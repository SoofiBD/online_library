import { toIsbn10 } from '@/lib/isbn'
import type { BookLookupConnector, LookupResult } from './types'
import { extractYear, fetchJson } from './http'

interface GoogleVolumeInfo {
  title?: string
  authors?: string[]
  publisher?: string
  publishedDate?: string
  imageLinks?: { smallThumbnail?: string; thumbnail?: string }
}

interface GoogleBooksResponse {
  items?: { volumeInfo?: GoogleVolumeInfo }[]
  totalItems?: number
}

/**
 * Fallback source: Google Books. Keyless for simple ISBN queries.
 *
 * Strategy:
 * 1. Query by ISBN-13 via `q=isbn:<ean13>`
 * 2. If no hit, convert to ISBN-10 and retry
 * 3. Cover: upgrade http -> https, null if unavailable
 */
export class GoogleBooksConnector implements BookLookupConnector {
  readonly name = 'googlebooks'

  async lookup(ean13: string): Promise<LookupResult | null> {
    // Attempt 1: ISBN-13
    const result = await this.queryByIsbn(ean13)
    if (result) return result

    // Attempt 2: ISBN-10 fallback
    const isbn10 = toIsbn10(ean13)
    if (isbn10) {
      const fallback = await this.queryByIsbn(isbn10)
      if (fallback) {
        return { ...fallback, isbn: ean13 }
      }
    }

    return null
  }

  private async queryByIsbn(isbn: string): Promise<LookupResult | null> {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`
    const json = (await fetchJson(url)) as GoogleBooksResponse | null

    if (!json || (json.totalItems ?? 0) === 0) return null

    const info = json.items?.[0]?.volumeInfo
    if (!info) return null

    return {
      isbn,
      title: info.title || 'Untitled',
      author: (info.authors ?? []).join(', ') || null,
      publisher: info.publisher || null,
      publishedYear: extractYear(info.publishedDate),
      coverUrl: this.resolveCover(info.imageLinks),
      source: this.name,
    }
  }

  private resolveCover(
    imageLinks?: { smallThumbnail?: string; thumbnail?: string },
  ): string | null {
    const raw = imageLinks?.thumbnail || imageLinks?.smallThumbnail
    if (!raw) return null
    // Google returns http:// image links; upgrade to https
    return raw.replace('http://', 'https://')
  }
}
