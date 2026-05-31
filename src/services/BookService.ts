import type { AuthProvider } from '@/adapters/auth/AuthProvider'
import type { BookRepository, BookFilter, BookCreateData, BookUpdateData } from '@/adapters/repository/BookRepository'
import type { StorageAdapter } from '@/adapters/storage/StorageAdapter'
import type { Book } from '@/generated/prisma/client'

export class BookService {
  constructor(
    private readonly auth: AuthProvider,
    private readonly repo: BookRepository,
    private readonly storage: StorageAdapter,
  ) {}

  async list(filter?: BookFilter): Promise<Book[]> {
    const ownerId = await this.auth.getCurrentUserId()
    return this.repo.list(ownerId, filter)
  }

  async getById(id: string): Promise<Book | null> {
    const ownerId = await this.auth.getCurrentUserId()
    return this.repo.getById(ownerId, id)
  }

  async create(data: BookCreateData): Promise<Book> {
    const ownerId = await this.auth.getCurrentUserId()
    return this.repo.create(ownerId, data)
  }

  async update(id: string, data: BookUpdateData): Promise<Book> {
    const ownerId = await this.auth.getCurrentUserId()
    return this.repo.update(ownerId, id, data)
  }

  async delete(id: string): Promise<void> {
    const ownerId = await this.auth.getCurrentUserId()
    const book = await this.repo.getById(ownerId, id)
    if (book?.coverPath) {
      await this.storage.delete(book.coverPath)
    }
    await this.repo.delete(ownerId, id)
  }
}
