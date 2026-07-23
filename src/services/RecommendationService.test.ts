import { describe, it, expect, vi } from 'vitest'
import { RecommendationService } from './RecommendationService'
import type { BookRepository, BookWithReview } from '@/adapters/repository/BookRepository'
import type { RecommenderProvider, ScoredBook } from '@/adapters/recommender/RecommenderProvider'

function book(overrides: Partial<BookWithReview>): BookWithReview {
  return {
    id: 'id', ownerId: 'o', isbn: null, title: 't', author: null,
    coverPath: null, coverColor: null, status: 'WANT_TO_READ', location: 'PHYSICAL',
    createdAt: new Date(), updatedAt: new Date(),
    rating: null, notes: null, progress: null, tags: [],
    ...overrides,
  } as BookWithReview
}

describe('RecommendationService', () => {
  it('fetches READ+rated profile books, and treats WANT_TO_READ plus unrated READ books as candidates', async () => {
    const list = vi.fn(async (_ownerId: string, filter?: { status?: string }) => {
      if (filter?.status === 'READ') {
        return [book({ id: 'read1', rating: 5 }), book({ id: 'read2', rating: null })]
      }
      return [book({ id: 'cand1' })]
    })
    const repo = { list } as unknown as BookRepository

    const scored: ScoredBook[] = [{ id: 'cand1', title: 't', author: null, score: 1, reasons: [] }]
    const recommend = vi.fn(() => scored)
    const provider = { recommend } as unknown as RecommenderProvider

    const auth = { getCurrentUserId: async () => 'owner1' }
    const service = new RecommendationService(auth, repo, provider)

    const result = await service.getRecommendations(5)

    expect(list).toHaveBeenCalledWith('owner1', { status: 'READ' })
    expect(list).toHaveBeenCalledWith('owner1', { status: 'WANT_TO_READ' })
    expect(recommend).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'read1' })],
      [expect.objectContaining({ id: 'cand1' }), expect.objectContaining({ id: 'read2' })],
      5,
    )
    expect(result).toEqual(scored)
  })

  it('defaults limit to 10', async () => {
    const list = vi.fn(async () => [])
    const repo = { list } as unknown as BookRepository
    const recommend = vi.fn(() => [])
    const provider = { recommend } as unknown as RecommenderProvider
    const auth = { getCurrentUserId: async () => 'owner1' }

    const service = new RecommendationService(auth, repo, provider)
    await service.getRecommendations()

    expect(recommend).toHaveBeenCalledWith([], [], 10)
  })
})
