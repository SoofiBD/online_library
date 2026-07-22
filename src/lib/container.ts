import type { AuthProvider } from '@/adapters/auth/AuthProvider'
import { DeviceAuthProvider } from '@/adapters/auth/DeviceAuthProvider'
import { SessionAuthProvider } from '@/adapters/auth/SessionAuthProvider'
import { LocalRuleRecommenderProvider } from '@/adapters/recommender/LocalRuleRecommenderProvider'
import { PrismaBookRepository } from '@/adapters/repository/PrismaBookRepository'
import { LocalStorageAdapter } from '@/adapters/storage/LocalStorageAdapter'
import { BookService } from '@/services/BookService'
import { createSearchAggregator } from '@/services/lookup'
import { RecommendationService } from '@/services/RecommendationService'

export function createBookService(auth: AuthProvider): BookService {
  return new BookService(
    auth,
    new PrismaBookRepository(),
    new LocalStorageAdapter(),
    createSearchAggregator(),
  )
}

export function createRecommendationService(auth: AuthProvider): RecommendationService {
  return new RecommendationService(auth, new PrismaBookRepository(), new LocalRuleRecommenderProvider())
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
