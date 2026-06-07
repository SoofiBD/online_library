import { toEan13 } from '@/lib/isbn'
import type { BookLookupConnector, LookupResult } from './types'

/**
 * Connector Chain: normalizes the ISBN to EAN-13, then tries each source in
 * order and returns the first hit. A connector that throws or times out is
 * logged and skipped, so a single failing source can never break a lookup.
 */
export class BookLookupService {
  constructor(private readonly connectors: BookLookupConnector[]) {}

  async lookup(rawIsbn: string): Promise<LookupResult | null> {
    const ean13 = toEan13(rawIsbn)
    if (!ean13) return null

    for (const connector of this.connectors) {
      try {
        const result = await connector.lookup(ean13)
        if (result) return result
      } catch (error) {
        console.warn(`[lookup] connector "${connector.name}" failed:`, error)
      }
    }
    return null
  }
}
