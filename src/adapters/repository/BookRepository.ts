import type { Book, BookStatus } from '@/generated/prisma/client'

export interface BookFilter {
  q?: string
  status?: BookStatus
  sort?: 'recent' | 'title' | 'rating'
}

// A Book joined with the current user's Review, flattened so existing consumers
// can keep reading `book.rating` / `book.notes` even though those fields now
// live on the Review model.
export type BookWithReview = Book & {
  rating: number | null
  notes: string | null
  progress: number | null
  tags: { id: string; name: string }[]
}

export interface BookCreateData {
  isbn?: string | null
  title: string
  author?: string | null
  coverPath?: string | null
  coverColor?: string | null
  status?: BookStatus
  // Routed into the user's Review inside the repository transaction:
  rating?: number | null
  notes?: string | null
  progress?: number | null
  tags?: string[]
}

export interface BookUpdateData {
  isbn?: string | null
  title?: string
  author?: string | null
  coverPath?: string | null
  coverColor?: string | null
  status?: BookStatus
  rating?: number | null
  notes?: string | null
  progress?: number | null
  tags?: string[]
}

export interface BookRepository {
  list(ownerId: string, filter?: BookFilter): Promise<BookWithReview[]>
  getById(ownerId: string, id: string): Promise<BookWithReview | null>
  findByIsbn(ownerId: string, isbn: string): Promise<BookWithReview | null>
  create(ownerId: string, data: BookCreateData): Promise<BookWithReview>
  update(ownerId: string, id: string, data: BookUpdateData): Promise<BookWithReview>
  /**
   * Atomically find-or-create the owner's Book for `data.isbn` and create-or-
   * update the owner's Review (rating + notes) in a single transaction. On
   * re-scan the catalog metadata is refreshed but the user's reading `status`
   * is preserved. When `data.isbn` is null there is no dedup key, so a fresh
   * Book is always created. This is the write primitive behind the scan flow.
   */
  upsertByIsbn(ownerId: string, data: BookCreateData): Promise<BookWithReview>
  delete(ownerId: string, id: string): Promise<void>
}
