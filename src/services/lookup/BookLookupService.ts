import { toEan13, toIsbn10 } from '@/lib/isbn'
import type { BookLookupConnector, LookupResult } from './types'

const SERVICE_TIMEOUT_MS = 5000

/**
 * Connector Chain: normalizes the ISBN to EAN-13, then tries each source in
 * order and returns the first hit. A connector that throws or times out is
 * logged and skipped, so a single failing source can never break a lookup.
 *
 * Two-pass strategy for Turkish/older editions:
 * 1. Try all connectors with EAN-13
 * 2. If no hit, convert to ISBN-10 and retry all connectors
 */
export class BookLookupService {
  constructor(private readonly connectors: BookLookupConnector[]) {}

  async lookup(rawIsbn: string): Promise<LookupResult | null> {
    const ean13 = toEan13(rawIsbn)
    if (!ean13) return null

    // Pass 1: EAN-13
    const result = await this.tryAll(ean13)
    if (result) return result

    // Pass 2: ISBN-10 fallback (only when EAN-13 had 978 prefix)
    const isbn10 = toIsbn10(ean13)
    if (isbn10) {
      console.info(`[lookup] EAN-13 ${ean13} miss, retrying as ISBN-10 ${isbn10}`)
      const fallback = await this.tryAll(isbn10)
      if (fallback) {
        // Preserve the canonical EAN-13
        return { ...fallback, isbn: ean13 }
      }
    }

    return null
  }

  private async tryAll(isbn: string): Promise<LookupResult | null> {
    for (const connector of this.connectors) {
      try {
        const result = await withTimeout(connector.lookup(isbn), SERVICE_TIMEOUT_MS, connector.name)
        if (result) return result
      } catch (error) {
        console.warn(`[lookup] connector "${connector.name}" failed:`, error)
      }
    }
    return null
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`[lookup] ${label} timed out after ${ms}ms`)), ms),
    ),
  ])
}
