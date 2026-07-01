import type { LookupResult, TextQuery } from './types'

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** ISBN when present, else a fingerprint of title+author. */
export function dedupeKey(r: LookupResult): string {
  if (r.isbn) return r.isbn
  return `${normalize(r.title)}|${normalize(r.author ?? '')}`
}

function completeness(r: LookupResult): number {
  return [r.author, r.publisher, r.publishedYear, r.coverUrl].filter((v) => v != null).length
}

/** Collapse records sharing a dedupe key; fill null fields from the group. */
export function mergeResults(results: LookupResult[]): LookupResult[] {
  const groups = new Map<string, LookupResult[]>()
  for (const r of results) {
    const key = dedupeKey(r)
    const g = groups.get(key)
    if (g) g.push(r)
    else groups.set(key, [r])
  }
  const out: LookupResult[] = []
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => completeness(b) - completeness(a))
    const merged = { ...sorted[0] }
    for (const r of sorted.slice(1)) {
      merged.author ??= r.author
      merged.publisher ??= r.publisher
      merged.publishedYear ??= r.publishedYear
      merged.coverUrl ??= r.coverUrl
    }
    out.push(merged)
  }
  return out
}

/** Rank by title match (if query) then field completeness. */
export function rankResults(results: LookupResult[], query?: TextQuery): LookupResult[] {
  const wanted = query?.title ? normalize(query.title) : null
  return [...results].sort((a, b) => {
    if (wanted) {
      const am = normalize(a.title).includes(wanted) ? 1 : 0
      const bm = normalize(b.title).includes(wanted) ? 1 : 0
      if (am !== bm) return bm - am
    }
    return completeness(b) - completeness(a)
  })
}
