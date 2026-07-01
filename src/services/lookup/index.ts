import { SearchAggregator } from './SearchAggregator'
import { GoogleBooksConnector } from './GoogleBooksConnector'
import { IsbndbConnector } from './IsbndbConnector'
import { OpenLibraryConnector } from './OpenLibraryConnector'
import { PrismaLookupCacheStore } from './cache/PrismaLookupCacheStore'
import type { BookLookupConnector } from './types'
import type { LookupCacheStore } from './cache/LookupCacheStore'

export { SearchAggregator } from './SearchAggregator'
export type { BookLookupConnector, LookupResult, TextQuery } from './types'

/** Builds the aggregator: keyless fast connectors + optional ISBNDB, DB cache. */
export function createSearchAggregator(cache?: LookupCacheStore): SearchAggregator {
  const connectors: BookLookupConnector[] = [
    new OpenLibraryConnector(),
    new GoogleBooksConnector(process.env.GOOGLE_BOOKS_API_KEY),
  ]
  const isbndbKey = process.env.ISBNDB_API_KEY
  if (isbndbKey) connectors.push(new IsbndbConnector(isbndbKey))

  return new SearchAggregator(connectors, { cache: cache ?? new PrismaLookupCacheStore() })
}
