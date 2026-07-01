import { LocalOwnerProvider } from '@/adapters/auth/LocalOwnerProvider'
import { PrismaBookRepository } from '@/adapters/repository/PrismaBookRepository'
import { LocalStorageAdapter } from '@/adapters/storage/LocalStorageAdapter'
import { BookService } from '@/services/BookService'
import { createSearchAggregator } from '@/services/lookup'

export function createBookService(): BookService {
  return new BookService(
    new LocalOwnerProvider(),
    new PrismaBookRepository(),
    new LocalStorageAdapter(),
    createSearchAggregator(),
  )
}
