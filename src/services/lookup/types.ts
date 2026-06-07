// Normalized result returned by every lookup connector, regardless of which
// external catalogue it came from.
export interface LookupResult {
  isbn: string // canonical EAN-13
  title: string
  author: string | null
  publisher: string | null
  publishedYear: number | null
  coverUrl: string | null
  source: string // which connector resolved it (for diagnostics)
}

// A single external data source. Connectors are tried in order by the
// BookLookupService (Connector Chain pattern).
export interface BookLookupConnector {
  readonly name: string
  lookup(ean13: string): Promise<LookupResult | null>
}
