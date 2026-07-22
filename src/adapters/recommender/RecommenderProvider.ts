import type { BookWithReview } from '@/adapters/repository/BookRepository'

export interface ScoredBook {
  id: string
  title: string
  author: string | null
  score: number
  reasons: string[]
}

/**
 * Scores a user's WANT_TO_READ candidates against their rated-book profile.
 * V1 implementations are purely local/rule-based; a V2 provider may add an
 * optional `discover()` method for external catalog search.
 */
export interface RecommenderProvider {
  recommend(
    profileBooks: BookWithReview[],
    candidates: BookWithReview[],
    limit: number,
  ): ScoredBook[]
}
