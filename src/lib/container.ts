import { LocalOwnerProvider } from '@/adapters/auth/LocalOwnerProvider'
import { PrismaBookRepository } from '@/adapters/repository/PrismaBookRepository'
import { LocalStorageAdapter } from '@/adapters/storage/LocalStorageAdapter'
import { BookService } from '@/services/BookService'

export function createBookService(): BookService {
  return new BookService(
    new LocalOwnerProvider(),
    new PrismaBookRepository(),
    new LocalStorageAdapter(),
  )
}
