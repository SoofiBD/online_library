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
}

// Fallback source: Google Books. Keyless for simple ISBN queries.
export class GoogleBooksConnector implements BookLookupConnector {
  readonly name = 'googlebooks'

  async lookup(ean13: string): Promise<LookupResult | null> {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${ean13}`
    const json = (await fetchJson(url)) as GoogleBooksResponse | null
    const info = json?.items?.[0]?.volumeInfo
    if (!info) return null

    const thumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null
    return {
      isbn: ean13,
      title: info.title || 'Untitled',
      author: (info.authors ?? []).join(', ') || null,
      publisher: info.publisher || null,
      publishedYear: extractYear(info.publishedDate),
      // Google returns http:// image links; upgrade to https so they load on
      // secure pages.
      coverUrl: thumb ? thumb.replace('http://', 'https://') : null,
      source: this.name,
    }
  }
}
