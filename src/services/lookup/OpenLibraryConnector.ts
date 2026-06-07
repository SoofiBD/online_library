import type { BookLookupConnector, LookupResult } from './types'
import { extractYear, fetchJson } from './http'

interface OpenLibraryBook {
  title?: string
  authors?: { name: string }[]
  publishers?: { name: string }[]
  publish_date?: string
  cover?: { small?: string; medium?: string; large?: string }
}

// Primary source: Open Library. Keyless, broad coverage.
export class OpenLibraryConnector implements BookLookupConnector {
  readonly name = 'openlibrary'

  async lookup(ean13: string): Promise<LookupResult | null> {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${ean13}&jscmd=data&format=json`
    const json = (await fetchJson(url)) as Record<string, OpenLibraryBook> | null
    const data = json?.[`ISBN:${ean13}`]
    if (!data) return null

    return {
      isbn: ean13,
      title: data.title || 'Untitled',
      author: (data.authors ?? []).map((a) => a.name).join(', ') || null,
      publisher: (data.publishers ?? []).map((p) => p.name).join(', ') || null,
      publishedYear: extractYear(data.publish_date),
      coverUrl:
        data.cover?.large ||
        data.cover?.medium ||
        data.cover?.small ||
        `https://covers.openlibrary.org/b/isbn/${ean13}-L.jpg`,
      source: this.name,
    }
  }
}
