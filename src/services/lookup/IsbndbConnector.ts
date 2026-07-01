import type { BookLookupConnector, LookupResult } from './types'
import { extractYear, fetchJson } from './http'

interface IsbndbResponse {
  book?: {
    title?: string; title_long?: string; authors?: string[]
    publisher?: string; date_published?: string; image?: string
  }
}

/** ISBNDB. Requires an API key; added to the chain only when configured. tier: fast. */
export class IsbndbConnector implements BookLookupConnector {
  readonly name = 'isbndb'
  readonly tier = 'fast' as const

  constructor(private readonly apiKey: string) {}

  async lookupByIsbn(ean13: string): Promise<LookupResult[]> {
    const res = await fetchJson(`https://api2.isbndb.com/book/${ean13}`, {
      headers: { Authorization: this.apiKey },
    })
    if (res.status === 'rateLimited' || res.status === 'error') {
      throw new Error(`[${this.name}] transient (${res.status})`)
    }
    if (res.status !== 'ok') return []
    const book = (res.data as IsbndbResponse).book
    if (!book) return []
    return [{
      isbn: ean13,
      title: book.title || book.title_long || 'Untitled',
      author: (book.authors ?? []).join(', ') || null,
      publisher: book.publisher || null,
      publishedYear: extractYear(book.date_published),
      coverUrl: book.image || null,
      source: this.name,
    }]
  }
}
