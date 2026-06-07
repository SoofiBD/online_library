import { BookLookupService } from './BookLookupService'
import { GoogleBooksConnector } from './GoogleBooksConnector'
import { IsbndbConnector } from './IsbndbConnector'
import { OpenLibraryConnector } from './OpenLibraryConnector'
import type { BookLookupConnector } from './types'

export { BookLookupService } from './BookLookupService'
export type { BookLookupConnector, LookupResult } from './types'

/**
 * Builds the lookup chain: Open Library -> Google Books (both keyless). ISBNDB
 * is appended only when ISBNDB_API_KEY is configured, because it rejects
 * unauthenticated requests.
 */
export function createBookLookupService(): BookLookupService {
  const connectors: BookLookupConnector[] = [
    new OpenLibraryConnector(),
    new GoogleBooksConnector(),
  ]

  const isbndbKey = process.env.ISBNDB_API_KEY
  if (isbndbKey) connectors.push(new IsbndbConnector(isbndbKey))

  return new BookLookupService(connectors)
}
