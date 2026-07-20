import type { AuthProvider } from '@/adapters/auth/AuthProvider'
import { DeviceAuthProvider } from '@/adapters/auth/DeviceAuthProvider'
import { SessionAuthProvider } from '@/adapters/auth/SessionAuthProvider'
import { PrismaBookRepository } from '@/adapters/repository/PrismaBookRepository'
import { LocalStorageAdapter } from '@/adapters/storage/LocalStorageAdapter'
import { BookService } from '@/services/BookService'
import { createSearchAggregator } from '@/services/lookup'

export function createBookService(auth: AuthProvider): BookService {
  return new BookService(
    auth,
    new PrismaBookRepository(),
    new LocalStorageAdapter(),
    createSearchAggregator(),
  )
}

/**
 * Picks the right AuthProvider for an API request: `x-device-id` means the
 * paired scanner/companion client (DeviceAuthProvider), its absence means a
 * browser request authenticated via the session cookie.
 */
export function resolveAuthProvider(request: Request): AuthProvider {
  const deviceId = request.headers.get('x-device-id')
  if (deviceId) return new DeviceAuthProvider(deviceId)
  return new SessionAuthProvider()
}
