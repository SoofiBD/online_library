import type { BookWithReview } from '@/adapters/repository/BookRepository'
import type { RecommenderProvider, ScoredBook } from './RecommenderProvider'

const FAVORITE_RATING_THRESHOLD = 4
const AUTHOR_MATCH_WEIGHT = 3
const AUTHOR_MATCH_CAP = 3
const TAG_OVERLAP_WEIGHT = 2
const AUTHOR_AVG_RATING_WEIGHT = 2

export class LocalRuleRecommenderProvider implements RecommenderProvider {
  recommend(
    profileBooks: BookWithReview[],
    candidates: BookWithReview[],
    limit: number,
  ): ScoredBook[] {
    if (profileBooks.length === 0) {
      return [...candidates]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit)
        .map((c) => ({
          id: c.id,
          title: c.title,
          author: c.author,
          score: 0,
          reasons: ['Recently added'],
        }))
    }

    const favoriteAuthorCounts = new Map<string, number>()
    const topTagCounts = new Map<string, number>()
    const authorRatingSums = new Map<string, { sum: number; count: number }>()

    for (const b of profileBooks) {
      if (b.rating == null) continue
      if (b.author) {
        const entry = authorRatingSums.get(b.author) ?? { sum: 0, count: 0 }
        entry.sum += b.rating
        entry.count += 1
        authorRatingSums.set(b.author, entry)
      }
      if (b.rating >= FAVORITE_RATING_THRESHOLD) {
        if (b.author) {
          favoriteAuthorCounts.set(b.author, (favoriteAuthorCounts.get(b.author) ?? 0) + 1)
        }
        for (const tag of b.tags) {
          topTagCounts.set(tag.name, (topTagCounts.get(tag.name) ?? 0) + 1)
        }
      }
    }

    const scored = candidates.map((c) => {
      const reasons: string[] = []
      let score = 0

      if (c.author && favoriteAuthorCounts.has(c.author)) {
        const occurrences = Math.min(favoriteAuthorCounts.get(c.author)!, AUTHOR_MATCH_CAP)
        score += AUTHOR_MATCH_WEIGHT * occurrences
        reasons.push(`You liked books by ${c.author}`)
      }

      const sharedTags = c.tags.filter((t) => topTagCounts.has(t.name))
      if (sharedTags.length > 0) {
        score += TAG_OVERLAP_WEIGHT * sharedTags.length
        reasons.push(`Shares tags: ${sharedTags.map((t) => t.name).join(', ')}`)
      }

      if (c.author && authorRatingSums.has(c.author)) {
        const { sum, count } = authorRatingSums.get(c.author)!
        const avgRating = sum / count
        score += (avgRating / 5) * AUTHOR_AVG_RATING_WEIGHT
      }

      return {
        id: c.id,
        title: c.title,
        author: c.author,
        score,
        reasons: reasons.length > 0 ? reasons : ['Matches your reading history'],
      }
    })

    return scored.sort((a, b) => b.score - a.score).slice(0, limit)
  }
}
