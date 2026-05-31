import type { Book, BookStatus } from '@/generated/prisma/client'

export interface BookFilter {
  q?: string
  status?: BookStatus
}

export interface BookCreateData {
  title: string
  author?: string | null
  coverPath?: string | null
  notes?: string | null
  rating?: number | null
  status?: BookStatus
}

export interface BookUpdateData {
  title?: string
  author?: string | null
  coverPath?: string | null
  notes?: string | null
  rating?: number | null
  status?: BookStatus
}

export interface BookRepository {
  list(ownerId: string, filter?: BookFilter): Promise<Book[]>
  getById(ownerId: string, id: string): Promise<Book | null>
  create(ownerId: string, data: BookCreateData): Promise<Book>
  update(ownerId: string, id: string, data: BookUpdateData): Promise<Book>
  delete(ownerId: string, id: string): Promise<void>
}
