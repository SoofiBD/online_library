import type { BookLookupConnector, LookupResult } from './types'
import { extractYear, fetchJson } from './http'

interface IsbndbResponse {
  book?: {
    title?: string
    title_long?: string
    authors?: string[]
    publisher?: string
    date_published?: string
    image?: string
  }
}

// Optional third source: ISBNDB. Unlike Open Library and Google Books it
// REQUIRES an API key (sent in the Authorization header), so it is only added
// to the chain when ISBNDB_API_KEY is set — see createBookLookupService().
export class IsbndbConnector implements BookLookupConnector {
  readonly name = 'isbndb'

  constructor(private readonly apiKey: string) {}

  async lookup(ean13: string): Promise<LookupResult | null> {
    const json = (await fetchJson(`https://api2.isbndb.com/book/${ean13}`, {
      headers: { Authorization: this.apiKey },
    })) as IsbndbResponse | null
    const book = json?.book
    if (!book) return null

    return {
      isbn: ean13,
      title: book.title || book.title_long || 'Untitled',
      author: (book.authors ?? []).join(', ') || null,
      publisher: book.publisher || null,
      publishedYear: extractYear(book.date_published),
      coverUrl: book.image || null,
      source: this.name,
    }
  }
}
