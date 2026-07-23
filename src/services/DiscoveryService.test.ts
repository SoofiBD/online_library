import { describe, it, expect, vi } from 'vitest'
import { DiscoveryService } from './DiscoveryService'
import type { BookRepository, BookWithReview } from '@/adapters/repository/BookRepository'
import type { SearchAggregator } from '@/services/lookup/SearchAggregator'
import type { LookupResult } from '@/services/lookup/types'

function book(overrides: Partial<BookWithReview>): BookWithReview {
  return {
    id: 'id', ownerId: 'o', isbn: null, title: 't', author: null,
    coverPath: null, coverColor: null, status: 'READ', location: 'PHYSICAL',
    createdAt: new Date(), updatedAt: new Date(),
    rating: null, notes: null, progress: null, tags: [],
    ...overrides,
  } as BookWithReview
}

function result(overrides: Partial<LookupResult>): LookupResult {
  return {
    isbn: 'isbn-x', title: 'Title X', author: 'Author X',
    publisher: null, publishedYear: null, coverUrl: null, source: 'test',
    ...overrides,
  }
}

const auth = { getCurrentUserId: async () => 'owner1' }

describe('DiscoveryService', () => {
  it('picks the top 2 favorite authors by count then avg rating, and searches each', async () => {
    const library = [
      book({ id: 'r1', author: 'Author A', rating: 5 }),
      book({ id: 'r2', author: 'Author A', rating: 4 }),
      book({ id: 'r3', author: 'Author B', rating: 5 }),
      book({ id: 'r4', author: 'Author C', rating: 5 }),
      book({ id: 'r5', author: 'Author D', rating: 3 }), // below threshold, excluded
    ]
    const list = vi.fn(async () => library)
    const repo = { list } as unknown as BookRepository

    const search = vi.fn(async (q: string) => {
      if (q === 'Author A') return [result({ isbn: 'new-a', title: 'New A', author: 'Author A' })]
      if (q === 'Author B') return [result({ isbn: 'new-b', title: 'New B', author: 'Author B' })]
      return []
    })
    const aggregator = { search } as unknown as SearchAggregator

    const service = new DiscoveryService(auth, repo, aggregator)
    const discoveries = await service.getDiscoveries(8)

    // Author A (count 2) beats Author B and C (count 1 each, B wins tiebreak on rating).
    expect(search).toHaveBeenCalledWith('Author A')
    expect(search).toHaveBeenCalledWith('Author B')
    expect(search).not.toHaveBeenCalledWith('Author C')
    expect(discoveries.map((d) => d.isbn).sort()).toEqual(['new-a', 'new-b'])
  })

  it('dedupes candidates already owned, by ISBN or by normalized title+author', async () => {
    const library = [
      book({ id: 'r1', author: 'Author A', rating: 5, isbn: 'owned-isbn' }),
      book({ id: 'r2', title: 'Owned By Title', author: 'Author A', rating: 5, isbn: null }),
    ]
    const list = vi.fn(async () => library)
    const repo = { list } as unknown as BookRepository

    const search = vi.fn(async () => [
      result({ isbn: 'owned-isbn', title: 'Something Else', author: 'Author A' }), // isbn match
      result({ isbn: null as unknown as string, title: 'owned by title', author: 'author a' }), // normalized title+author match
      result({ isbn: 'fresh', title: 'Brand New', author: 'Author A' }),
    ])
    const aggregator = { search } as unknown as SearchAggregator

    const service = new DiscoveryService(auth, repo, aggregator)
    const discoveries = await service.getDiscoveries(8)

    expect(discoveries).toHaveLength(1)
    expect(discoveries[0].isbn).toBe('fresh')
    expect(discoveries[0].reason).toBe('More by Author A')
  })

  it('dedupes candidates against each other, not just against the owned library', async () => {
    const library = [
      book({ id: 'r1', author: 'Author A', rating: 5 }),
      book({ id: 'r2', author: 'Author B', rating: 5 }),
    ]
    const list = vi.fn(async () => library)
    const repo = { list } as unknown as BookRepository

    const search = vi.fn(async (q: string) => {
      if (q === 'Author A') {
        return [
          result({ isbn: 'shared-isbn', title: 'Shared Book', author: 'Author A' }),
          result({ isbn: null as unknown as string, title: 'No Isbn Book', author: 'Author A' }),
        ]
      }
      if (q === 'Author B') {
        return [
          // Same ISBN as the "Author A" candidate above, from a different author search.
          result({ isbn: 'shared-isbn', title: 'Shared Book (again)', author: 'Author A' }),
          // Same normalized title+author, no isbn, as the "Author A" candidate above.
          result({ isbn: null as unknown as string, title: 'no isbn book', author: 'author a' }),
          result({ isbn: 'unique-b', title: 'Unique B', author: 'Author B' }),
        ]
      }
      return []
    })
    const aggregator = { search } as unknown as SearchAggregator

    const service = new DiscoveryService(auth, repo, aggregator)
    const discoveries = await service.getDiscoveries(8)

    expect(discoveries.filter((d) => d.isbn === 'shared-isbn')).toHaveLength(1)
    expect(discoveries.filter((d) => d.title.toLowerCase() === 'no isbn book')).toHaveLength(1)
    expect(discoveries.map((d) => d.isbn ?? d.title).sort()).toEqual(
      ['No Isbn Book', 'shared-isbn', 'unique-b'].sort(),
    )
  })

  it('skips an author whose search fails, keeping results from the other author', async () => {
    const library = [
      book({ id: 'r1', author: 'Author A', rating: 5 }),
      book({ id: 'r2', author: 'Author B', rating: 5 }),
    ]
    const list = vi.fn(async () => library)
    const repo = { list } as unknown as BookRepository

    const search = vi.fn(async (q: string) => {
      if (q === 'Author A') throw new Error('network down')
      return [result({ isbn: 'ok', title: 'OK Book', author: 'Author B' })]
    })
    const aggregator = { search } as unknown as SearchAggregator

    const service = new DiscoveryService(auth, repo, aggregator)
    const discoveries = await service.getDiscoveries(8)

    expect(discoveries).toEqual([
      { isbn: 'ok', title: 'OK Book', author: 'Author B', coverUrl: null, reason: 'More by Author B' },
    ])
  })

  it('caps results to the requested limit', async () => {
    const library = [book({ id: 'r1', author: 'Author A', rating: 5 })]
    const list = vi.fn(async () => library)
    const repo = { list } as unknown as BookRepository

    const many = Array.from({ length: 10 }, (_, i) =>
      result({ isbn: `book-${i}`, title: `Book ${i}`, author: 'Author A' }),
    )
    const search = vi.fn(async () => many)
    const aggregator = { search } as unknown as SearchAggregator

    const service = new DiscoveryService(auth, repo, aggregator)
    const discoveries = await service.getDiscoveries(3)

    expect(discoveries).toHaveLength(3)
  })

  it('returns an empty list when there are no rated books at or above the favorite threshold', async () => {
    const library = [book({ id: 'r1', author: 'Author A', rating: 3 })]
    const list = vi.fn(async () => library)
    const repo = { list } as unknown as BookRepository
    const search = vi.fn(async () => [])
    const aggregator = { search } as unknown as SearchAggregator

    const service = new DiscoveryService(auth, repo, aggregator)
    const discoveries = await service.getDiscoveries(8)

    expect(discoveries).toEqual([])
    expect(search).not.toHaveBeenCalled()
  })
})
