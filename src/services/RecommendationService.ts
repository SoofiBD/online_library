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
    const [readBooks, wantToRead] = await Promise.all([
      this.repo.list(ownerId, { status: 'READ' }),
      this.repo.list(ownerId, { status: 'WANT_TO_READ' }),
    ])
    const ratedProfileBooks = readBooks.filter((b) => b.rating != null)
    // Unrated READ books haven't fed the taste profile yet, so they're still
    // worth scoring as candidates alongside WANT_TO_READ (e.g. re-reads).
    const unratedReadBooks = readBooks.filter((b) => b.rating == null)
    const candidates = [...wantToRead, ...unratedReadBooks]
    return this.provider.recommend(ratedProfileBooks, candidates, limit)
  }
}
