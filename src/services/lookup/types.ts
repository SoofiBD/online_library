export interface LookupResult {
  isbn: string
  title: string
  author: string | null
  publisher: string | null
  publishedYear: number | null
  coverUrl: string | null
  source: string
}

export interface TextQuery {
  title?: string
  author?: string
  raw: string
}

export interface BookLookupConnector {
  readonly name: string
  readonly tier: 'fast' | 'fallback'
  lookupByIsbn?(ean13: string): Promise<LookupResult[]>
  searchByText?(query: TextQuery): Promise<LookupResult[]>
}
