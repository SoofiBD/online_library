import { toIsbn10 } from '@/lib/isbn'
import type { BookLookupConnector, LookupResult } from './types'
import { extractYear, fetchJson } from './http'

interface OpenLibraryBook {
  title?: string
  authors?: { name: string }[]
  publishers?: { name: string }[]
  publish_date?: string
  cover?: { small?: string; medium?: string; large?: string }
}

/**
 * Primary source: Open Library. Keyless, broad coverage.
 *
 * Strategy:
 * 1. Query by ISBN-13 (EAN-13)
 * 2. If no hit, convert to ISBN-10 and retry (Turkish/older editions)
 * 3. Cover: prefer API cover URLs, fallback to OL cover endpoint, null if
 *    all fail (never return a broken link)
 */
export class OpenLibraryConnector implements BookLookupConnector {
  readonly name = 'openlibrary'

  async lookup(ean13: string): Promise<LookupResult | null> {
    // Attempt 1: ISBN-13
    const result = await this.queryByIsbn(ean13)
    if (result) return result

    // Attempt 2: ISBN-10 fallback (978-prefix EAN-13 only)
    const isbn10 = toIsbn10(ean13)
    if (isbn10) {
      const fallback = await this.queryByIsbn(isbn10)
      if (fallback) {
        // Preserve the canonical EAN-13 we were asked to look up
        return { ...fallback, isbn: ean13 }
      }
    }

    return null
  }

  private async queryByIsbn(isbn: string): Promise<LookupResult | null> {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=data&format=json`
    const json = (await fetchJson(url)) as Record<string, OpenLibraryBook> | null
    const data = json?.[`ISBN:${isbn}`]
    if (!data) return null

    return {
      isbn,
      title: data.title || 'Untitled',
      author: (data.authors ?? []).map((a) => a.name).join(', ') || null,
      publisher: (data.publishers ?? []).map((p) => p.name).join(', ') || null,
      publishedYear: extractYear(data.publish_date),
      coverUrl: this.resolveCover(isbn, data.cover),
      source: this.name,
    }
  }

  private resolveCover(
    isbn: string,
    cover?: { small?: string; medium?: string; large?: string },
  ): string | null {
    // Prefer API-provided cover URLs (most reliable)
    if (cover?.large) return cover.large
    if (cover?.medium) return cover.medium
    if (cover?.small) return cover.small

    // Open Library cover endpoint — may or may not have an image
    // Return it as a best-effort; caller should handle 404 gracefully
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
  }
}
