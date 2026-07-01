import type { BookLookupConnector, LookupResult, TextQuery } from './types'
import { extractYear, fetchJson } from './http'

interface GoogleVolumeInfo {
  title?: string
  authors?: string[]
  publisher?: string
  publishedDate?: string
  industryIdentifiers?: { type?: string; identifier?: string }[]
  imageLinks?: { smallThumbnail?: string; thumbnail?: string }
}
interface GoogleBooksResponse {
  items?: { volumeInfo?: GoogleVolumeInfo }[]
  totalItems?: number
}

/**
 * Google Books. Works keyless but is aggressively rate-limited (429) without a
 * key; pass an API key (GOOGLE_BOOKS_API_KEY) to raise the quota. tier: fast.
 */
export class GoogleBooksConnector implements BookLookupConnector {
  readonly name = 'googlebooks'
  readonly tier = 'fast' as const

  constructor(private readonly apiKey?: string) {}

  async lookupByIsbn(ean13: string): Promise<LookupResult[]> {
    return this.query(`q=isbn:${ean13}&maxResults=1`, ean13)
  }

  async searchByText(query: TextQuery): Promise<LookupResult[]> {
    const q = encodeURIComponent(query.raw)
    return this.query(`q=${q}&maxResults=10`)
  }

  private async query(qs: string, fallbackIsbn?: string): Promise<LookupResult[]> {
    const keyParam = this.apiKey ? `&key=${this.apiKey}` : ''
    const res = await fetchJson(`https://www.googleapis.com/books/v1/volumes?${qs}${keyParam}`)
    if (res.status === 'rateLimited' || res.status === 'error') {
      throw new Error(`[${this.name}] transient (${res.status})`)
    }
    if (res.status !== 'ok') return []
    const json = res.data as GoogleBooksResponse
    if (!json || (json.totalItems ?? 0) === 0) return []
    return (json.items ?? []).flatMap((item) => {
      const info = item.volumeInfo
      if (!info) return []
      const isbn = info.industryIdentifiers?.find((i) => i.type === 'ISBN_13')?.identifier
      return [{
        isbn: isbn ?? fallbackIsbn ?? '',
        title: info.title || 'Untitled',
        author: (info.authors ?? []).join(', ') || null,
        publisher: info.publisher || null,
        publishedYear: extractYear(info.publishedDate),
        coverUrl: this.resolveCover(info.imageLinks),
        source: this.name,
      }]
    })
  }

  private resolveCover(imageLinks?: { smallThumbnail?: string; thumbnail?: string }): string | null {
    const raw = imageLinks?.thumbnail || imageLinks?.smallThumbnail
    return raw ? raw.replace('http://', 'https://') : null
  }
}
