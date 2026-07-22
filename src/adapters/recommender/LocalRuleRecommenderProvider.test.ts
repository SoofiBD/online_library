import { describe, it, expect } from 'vitest'
import { LocalRuleRecommenderProvider } from './LocalRuleRecommenderProvider'
import type { BookWithReview } from '@/adapters/repository/BookRepository'

function book(overrides: Partial<BookWithReview>): BookWithReview {
  return {
    id: 'id', ownerId: 'o', isbn: null, title: 't', author: null,
    coverPath: null, coverColor: null, status: 'WANT_TO_READ', location: 'PHYSICAL',
    createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01'),
    rating: null, notes: null, progress: null, tags: [],
    ...overrides,
  } as BookWithReview
}

describe('LocalRuleRecommenderProvider', () => {
  const provider = new LocalRuleRecommenderProvider()

  it('ranks a candidate by a favorite author above one with no signal', () => {
    const profile = [book({ id: 'p1', author: 'Author A', rating: 5 })]
    const candidates = [
      book({ id: 'c1', author: 'Author A', title: 'Match' }),
      book({ id: 'c2', author: 'Author Z', title: 'No match' }),
    ]
    const result = provider.recommend(profile, candidates, 10)
    expect(result[0].id).toBe('c1')
    expect(result[0].reasons.some((r) => r.includes('Author A'))).toBe(true)
  })

  it('scores tag overlap', () => {
    const profile = [
      book({ id: 'p1', rating: 5, tags: [{ id: 't1', name: 'sci-fi' }] }),
    ]
    const candidates = [
      book({ id: 'c1', tags: [{ id: 't1', name: 'sci-fi' }] }),
      book({ id: 'c2', tags: [{ id: 't2', name: 'romance' }] }),
    ]
    const result = provider.recommend(profile, candidates, 10)
    expect(result[0].id).toBe('c1')
  })

  it('factors in author average rating across all rated books', () => {
    const profile = [
      book({ id: 'p1', author: 'Author B', rating: 4 }),
      book({ id: 'p2', author: 'Author B', rating: 5 }),
    ]
    const candidates = [
      book({ id: 'c1', author: 'Author B' }),
      book({ id: 'c2', author: 'Author C' }),
    ]
    const result = provider.recommend(profile, candidates, 10)
    // Author B has an average rating of 4.5, which contributes to the score.
    // Author C has no rating history, so only gets the rank-based tiebreaker.
    // The candidate with the favorable author average rating should rank higher.
    expect(result[0].id).toBe('c1')
    expect(result[0].score).toBeGreaterThan(result[1].score)
  })

  it('falls back to recency order when the profile is empty', () => {
    const candidates = [
      book({ id: 'old', createdAt: new Date('2023-01-01') }),
      book({ id: 'new', createdAt: new Date('2024-06-01') }),
    ]
    const result = provider.recommend([], candidates, 10)
    expect(result.map((r) => r.id)).toEqual(['new', 'old'])
    expect(result[0].reasons).toEqual(['Recently added'])
  })

  it('respects the limit', () => {
    const candidates = [book({ id: 'a' }), book({ id: 'b' }), book({ id: 'c' })]
    const result = provider.recommend([], candidates, 2)
    expect(result).toHaveLength(2)
  })

  it('scores author average rating even when author is not a favorite', () => {
    const profile = [
      book({ id: 'p1', author: 'Author D', rating: 2 }),
      book({ id: 'p2', author: 'Author D', rating: 3 }),
    ]
    const candidates = [
      book({ id: 'c1', author: 'Author D' }),
      book({ id: 'c2', author: 'Unknown Author' }),
    ]
    const result = provider.recommend(profile, candidates, 10)
    // Author D has an average rating of 2.5 (both 2 and 3 are below FAVORITE_RATING_THRESHOLD = 4).
    // This tests the average-rating bonus in isolation, without the favorite-author bonus.
    // The candidate with the known author should rank higher due to avg-rating contribution alone.
    expect(result[0].id).toBe('c1')
    expect(result[0].score).toBeGreaterThan(result[1].score)
  })

  it('caps the author-match bonus at AUTHOR_MATCH_CAP occurrences', () => {
    // Profile with exactly AUTHOR_MATCH_CAP (3) favorite books by Author E
    const profileWithCap = [
      book({ id: 'p1', author: 'Author E', rating: 5 }),
      book({ id: 'p2', author: 'Author E', rating: 5 }),
      book({ id: 'p3', author: 'Author E', rating: 5 }),
    ]

    // Profile with MORE than AUTHOR_MATCH_CAP (5) favorite books by Author E
    const profileOverCap = [
      book({ id: 'p1', author: 'Author E', rating: 5 }),
      book({ id: 'p2', author: 'Author E', rating: 5 }),
      book({ id: 'p3', author: 'Author E', rating: 5 }),
      book({ id: 'p4', author: 'Author E', rating: 5 }),
      book({ id: 'p5', author: 'Author E', rating: 5 }),
    ]

    const candidate = book({ id: 'c1', author: 'Author E' })

    const resultWithCap = provider.recommend(profileWithCap, [candidate], 10)
    const resultOverCap = provider.recommend(profileOverCap, [candidate], 10)

    // Both should have the same score since the author-match contribution is capped at 3.
    // If the cap is working: score = 3 * min(count, 3) + (5/5) * 2 = 9 + 2 = 11 for both.
    // If the cap is broken: the second would be 3 * 5 + 2 = 17.
    expect(resultWithCap[0].score).toBe(resultOverCap[0].score)
  })
})
