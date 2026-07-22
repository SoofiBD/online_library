import type { AuthProvider } from '@/adapters/auth/AuthProvider'
import type { BookRepository } from '@/adapters/repository/BookRepository'
import type { RecommenderProvider, ScoredBook } from '@/adapters/recommender/RecommenderProvider'

const DEFAULT_LIMIT = 10

export class RecommendationService {
  constructor(
    private readonly auth: AuthProvider,
    private readonly repo: BookRepository,
    private readonly provider: RecommenderProvider,
  ) {}

  async getRecommendations(limit: number = DEFAULT_LIMIT): Promise<ScoredBook[]> {
    const ownerId = await this.auth.getCurrentUserId()
    const [profileBooks, candidates] = await Promise.all([
      this.repo.list(ownerId, { status: 'READ' }),
      this.repo.list(ownerId, { status: 'WANT_TO_READ' }),
    ])
    const ratedProfileBooks = profileBooks.filter((b) => b.rating != null)
    return this.provider.recommend(ratedProfileBooks, candidates, limit)
  }
}
