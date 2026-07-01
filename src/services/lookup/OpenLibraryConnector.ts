import type { BookLookupConnector, LookupResult, TextQuery } from './types'
import { extractYear, fetchJson } from './http'

interface OpenLibraryBook {
  title?: string
  authors?: { name: string }[]
  publishers?: { name: string }[]
  publish_date?: string
  cover?: { small?: string; medium?: string; large?: string }
}

interface OpenLibraryDoc {
  title?: string
  author_name?: string[]
  publisher?: string[]
  first_publish_year?: number
  isbn?: string[]
  cover_i?: number
}

/** Open Library. Keyless, broad coverage. tier: fast. Supports ISBN + text. */
export class OpenLibraryConnector implements BookLookupConnector {
  readonly name = 'openlibrary'
  readonly tier = 'fast' as const

  async lookupByIsbn(ean13: string): Promise<LookupResult[]> {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${ean13}&jscmd=data&format=json`
    const res = await fetchJson(url)
    if (res.status === 'rateLimited' || res.status === 'error') {
      throw new Error(`[${this.name}] transient (${res.status})`)
    }
    if (res.status !== 'ok') return []
    const json = res.data as Record<string, OpenLibraryBook>
    const data = json?.[`ISBN:${ean13}`]
    if (!data) return []
    return [{
      isbn: ean13,
      title: data.title || 'Untitled',
      author: (data.authors ?? []).map((a) => a.name).join(', ') || null,
      publisher: (data.publishers ?? []).map((p) => p.name).join(', ') || null,
      publishedYear: extractYear(data.publish_date),
      coverUrl: this.resolveCover(ean13, data.cover),
      source: this.name,
    }]
  }

  async searchByText(query: TextQuery): Promise<LookupResult[]> {
    const params = new URLSearchParams({ q: query.raw, limit: '10' })
    const res = await fetchJson(`https://openlibrary.org/search.json?${params}`)
    if (res.status === 'rateLimited' || res.status === 'error') {
      throw new Error(`[${this.name}] transient (${res.status})`)
    }
    if (res.status !== 'ok') return []
    const docs = ((res.data as { docs?: OpenLibraryDoc[] }).docs ?? []).slice(0, 10)
    return docs.map((d) => ({
      isbn: d.isbn?.[0] ?? '',
      title: d.title || 'Untitled',
      author: (d.author_name ?? []).join(', ') || null,
      publisher: (d.publisher ?? [])[0] ?? null,
      publishedYear: d.first_publish_year ?? null,
      coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
      source: this.name,
    }))
  }

  private resolveCover(isbn: string, cover?: { small?: string; medium?: string; large?: string }): string | null {
    if (cover?.large) return cover.large
    if (cover?.medium) return cover.medium
    if (cover?.small) return cover.small
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`
  }
}
