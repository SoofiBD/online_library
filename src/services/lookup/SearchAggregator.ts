import { toEan13, toIsbn10 } from '@/lib/isbn'
import type { BookLookupConnector, LookupResult, TextQuery } from './types'
import { mergeResults, rankResults } from './merge'
import type { LookupCacheStore } from './cache/LookupCacheStore'

const DEFAULT_TIMEOUT_MS = 5000
const DEFAULT_FALLBACK_THRESHOLD = 3

const POSITIVE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const NEGATIVE_TTL_MS = 24 * 60 * 60 * 1000       // 1 day

/**
 * Fans out to all connectors in parallel, merges/dedupes, and ranks.
 * Fallback-tier (scraping) connectors run only when fast-tier results are
 * below `fallbackThreshold`. ISBN-10 retry lives here — connectors never
 * do their own fallback.
 */
export class SearchAggregator {
  private readonly timeoutMs: number
  private readonly fallbackThreshold: number
  private readonly cache: LookupCacheStore | null

  constructor(
    private readonly connectors: BookLookupConnector[],
    opts?: { timeoutMs?: number; fallbackThreshold?: number; cache?: LookupCacheStore },
  ) {
    this.timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.fallbackThreshold = opts?.fallbackThreshold ?? DEFAULT_FALLBACK_THRESHOLD
    this.cache = opts?.cache ?? null
  }

  async byIsbn(rawIsbn: string): Promise<LookupResult | null> {
    const ean13 = toEan13(rawIsbn)
    if (!ean13) return null

    const cacheKey = `isbn:${ean13}`
    const cached = await this.cache?.get(cacheKey)
    if (cached) return cached.hit ? (cached.payload as LookupResult) : null

    const isbns = [ean13]
    const isbn10 = toIsbn10(ean13)
    if (isbn10) isbns.push(isbn10)

    const fast = this.connectors.filter((c) => c.tier === 'fast' && c.lookupByIsbn)
    let { results, transient } = await this.gatherIsbn(fast, isbns)

    if (results.length === 0) {
      const fb = this.connectors.filter((c) => c.tier === 'fallback' && c.lookupByIsbn)
      const fbGather = await this.gatherIsbn(fb, isbns)
      results = fbGather.results
      transient = transient || fbGather.transient
    }
    if (results.length === 0) {
      if (!transient) await this.writeCache(cacheKey, null, NEGATIVE_TTL_MS)
      return null
    }

    // Force every record onto the canonical EAN-13 so they merge into one book.
    const canonical = results.map((r) => ({ ...r, isbn: ean13 }))
    const result = mergeResults(canonical)[0] ?? null
    await this.writeCache(cacheKey, result, result ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS)
    return result
  }

  async search(rawQuery: string): Promise<LookupResult[]> {
    const query = this.parseQuery(rawQuery)
    if (!query.raw) return []

    const cacheKey = `text:${query.raw.toLowerCase().replace(/\s+/g, ' ')}`
    const cached = await this.cache?.get(cacheKey)
    if (cached) return cached.payload as LookupResult[]

    const fast = this.connectors.filter((c) => c.tier === 'fast' && c.searchByText)
    let { results: fastResults, transient } = await this.gatherText(fast, query)
    let results = mergeResults(fastResults)

    if (results.length < this.fallbackThreshold) {
      const fb = this.connectors.filter((c) => c.tier === 'fallback' && c.searchByText)
      if (fb.length > 0) {
        const fbGather = await this.gatherText(fb, query)
        transient = transient || fbGather.transient
        results = mergeResults([...results, ...fbGather.results])
      }
    }
    const ranked = rankResults(results, query)
    if (ranked.length > 0) {
      await this.writeCache(cacheKey, ranked, POSITIVE_TTL_MS)
    } else if (!transient) {
      await this.writeCache(cacheKey, ranked, NEGATIVE_TTL_MS)
    }
    return ranked
  }

  private parseQuery(raw: string): TextQuery {
    return { raw: raw.trim(), title: raw.trim() }
  }

  private async gatherIsbn(connectors: BookLookupConnector[], isbns: string[]): Promise<{ results: LookupResult[]; transient: boolean }> {
    const calls = connectors.map((c) =>
      this.withTimeout(this.firstNonEmptyIsbn(c, isbns), c.name),
    )
    return this.collect(calls)
  }

  private async firstNonEmptyIsbn(c: BookLookupConnector, isbns: string[]): Promise<LookupResult[]> {
    for (const isbn of isbns) {
      const hit = await c.lookupByIsbn!(isbn)
      if (hit.length > 0) return hit
    }
    return []
  }

  private async gatherText(connectors: BookLookupConnector[], query: TextQuery): Promise<{ results: LookupResult[]; transient: boolean }> {
    const calls = connectors.map((c) => this.withTimeout(c.searchByText!(query), c.name))
    return this.collect(calls)
  }

  private async collect(calls: Promise<LookupResult[]>[]): Promise<{ results: LookupResult[]; transient: boolean }> {
    const settled = await Promise.allSettled(calls)
    const out: LookupResult[] = []
    let transient = false
    for (const s of settled) {
      if (s.status === 'fulfilled') out.push(...s.value)
      else {
        transient = true
        console.warn('[lookup] connector failed:', s.reason)
      }
    }
    return { results: out, transient }
  }

  private async writeCache(key: string, payload: unknown, ttlMs: number): Promise<void> {
    if (!this.cache) return
    const hit = Array.isArray(payload) ? payload.length > 0 : payload != null
    await this.cache.set(key, { payload, hit, expiresAt: new Date(Date.now() + ttlMs) })
  }

  private withTimeout(promise: Promise<LookupResult[]>, label: string): Promise<LookupResult[]> {
    let timer: ReturnType<typeof setTimeout>
    const timeout = new Promise<LookupResult[]>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`[lookup] ${label} timed out after ${this.timeoutMs}ms`)),
        this.timeoutMs,
      )
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer!))
  }
}
