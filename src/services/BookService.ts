import type { AuthProvider } from '@/adapters/auth/AuthProvider'
import type { BookStatus } from '@/generated/prisma/client'
import type {
  BookRepository,
  BookFilter,
  BookCreateData,
  BookUpdateData,
  BookWithReview,
} from '@/adapters/repository/BookRepository'
import type { StorageAdapter } from '@/adapters/storage/StorageAdapter'
import type { SearchAggregator, LookupResult } from '@/services/lookup'
import { toEan13 } from '@/lib/isbn'
import { createBookSchema } from '@/lib/schemas'

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
    private readonly lookupService: SearchAggregator | null = null,
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
    return this.lookupService.byIsbn(isbn)
  }

  /** Free-text title/author search returning ranked candidates (Module 3). */
  async search(query: string): Promise<LookupResult[]> {
    if (!this.lookupService) return []
    return this.lookupService.search(query)
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

    let title = input.title?.trim() || null
    let author = input.author ?? null
    let coverPath = input.coverPath ?? null
    let status: BookStatus = 'WANT_TO_READ'

    // If the owner already has this book, reuse its catalog data so a bare
    // (ISBN-only) re-scan doesn't trigger a redundant network lookup, and keep
    // its current reading status. This is a read-only short-circuit; the actual
    // write still happens atomically in repo.upsertByIsbn below.
    const existing = ean13 ? await this.repo.findByIsbn(ownerId, ean13) : null
    if (existing) {
      title = title ?? existing.title
      author = author ?? existing.author
      coverPath = coverPath ?? existing.coverPath
      status = existing.status
    } else if (!title && ean13 && this.lookupService) {
      const found = await this.lookupService.byIsbn(ean13)
      if (found) {
        title = found.title
        author = author ?? found.author
        coverPath = coverPath ?? found.coverUrl
      }
    }

    if (!title) {
      throw new BookValidationError('Could not resolve a title for this book')
    }

    // (a) Validate the fully resolved record via Zod before opening the write
    // transaction — rating bounds (1-5), required title, status enum. Kept
    // outside repo.upsertByIsbn so no DB transaction is held open during
    // CPU-bound validation.
    const parsed = createBookSchema.safeParse({
      isbn: ean13,
      title,
      author,
      coverPath,
      status,
      rating: input.rating ?? null,
      notes: input.notes ?? null,
    })
    if (!parsed.success) {
      throw new BookValidationError(
        parsed.error.issues.map((issue) => issue.message).join('; '),
      )
    }

    return this.repo.upsertByIsbn(ownerId, {
      isbn: parsed.data.isbn ?? null,
      title: parsed.data.title,
      author: parsed.data.author ?? null,
      coverPath: parsed.data.coverPath ?? null,
      status: parsed.data.status,
      rating: parsed.data.rating ?? null,
      notes: parsed.data.notes ?? null,
    })
  }
}
