import type { AuthProvider } from '@/adapters/auth/AuthProvider'
import type {
  BookRepository,
  BookFilter,
  BookCreateData,
  BookUpdateData,
  BookWithReview,
} from '@/adapters/repository/BookRepository'
import type { StorageAdapter } from '@/adapters/storage/StorageAdapter'
import type { BookLookupService, LookupResult } from '@/services/lookup'
import { toEan13 } from '@/lib/isbn'

/** Thrown when a scan/manual payload can't be turned into a saveable book. */
export class BookValidationError extends Error {}

export interface ScanInput {
  isbn?: string | null
  title?: string | null
  author?: string | null
  coverPath?: string | null
  rating?: number | null
  notes?: string | null
}

export class BookService {
  constructor(
    private readonly auth: AuthProvider,
    private readonly repo: BookRepository,
    private readonly storage: StorageAdapter,
    private readonly lookupService: BookLookupService | null = null,
  ) {}

  async list(filter?: BookFilter): Promise<BookWithReview[]> {
    const ownerId = await this.auth.getCurrentUserId()
    return this.repo.list(ownerId, filter)
  }

  async getById(id: string): Promise<BookWithReview | null> {
    const ownerId = await this.auth.getCurrentUserId()
    return this.repo.getById(ownerId, id)
  }

  async create(data: BookCreateData): Promise<BookWithReview> {
    const ownerId = await this.auth.getCurrentUserId()
    return this.repo.create(ownerId, data)
  }

  async update(id: string, data: BookUpdateData): Promise<BookWithReview> {
    const ownerId = await this.auth.getCurrentUserId()
    return this.repo.update(ownerId, id, data)
  }

  async delete(id: string): Promise<void> {
    const ownerId = await this.auth.getCurrentUserId()
    const book = await this.repo.getById(ownerId, id)
    // Only purge covers we actually stored locally; scanned books reference
    // remote cover URLs that we must not try to unlink.
    if (book?.coverPath && book.coverPath.startsWith('/uploads/')) {
      await this.storage.delete(book.coverPath)
    }
    await this.repo.delete(ownerId, id)
  }

  /** Resolves book metadata by ISBN through the connector chain (Module 3). */
  async lookup(isbn: string): Promise<LookupResult | null> {
    if (!this.lookupService) return null
    return this.lookupService.lookup(isbn)
  }

  /**
   * Persists a scanned/manual book for the current user (Module 2 bridge).
   * Sanitizes the ISBN to EAN-13, de-duplicates against the owner's library,
   * and fills in missing metadata from the connector chain when only an ISBN
   * was supplied.
   */
  async addByScan(input: ScanInput): Promise<BookWithReview> {
    const ownerId = await this.auth.getCurrentUserId()
    const ean13 = input.isbn ? toEan13(input.isbn) : null

    if (ean13) {
      const existing = await this.repo.findByIsbn(ownerId, ean13)
      if (existing) return existing
    }

    let title = input.title?.trim() || null
    let author = input.author ?? null
    let coverPath = input.coverPath ?? null

    if (!title && ean13 && this.lookupService) {
      const found = await this.lookupService.lookup(ean13)
      if (found) {
        title = found.title
        author = author ?? found.author
        coverPath = coverPath ?? found.coverUrl
      }
    }

    if (!title) {
      throw new BookValidationError('Could not resolve a title for this book')
    }

    try {
      return await this.repo.create(ownerId, {
        isbn: ean13,
        title,
        author,
        coverPath,
        status: 'WANT_TO_READ',
        rating: input.rating ?? null,
        notes: input.notes ?? null,
      })
    } catch (error) {
      // Lost a race on the (ownerId, isbn) unique index -> return the winner.
      if (ean13 && isUniqueViolation(error)) {
        const existing = await this.repo.findByIsbn(ownerId, ean13)
        if (existing) return existing
      }
      throw error
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  )
}
