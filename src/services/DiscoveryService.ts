import type { AuthProvider } from '@/adapters/auth/AuthProvider'
import type { BookRepository, BookWithReview } from '@/adapters/repository/BookRepository'
import type { SearchAggregator } from '@/services/lookup/SearchAggregator'
import type { LookupResult } from '@/services/lookup/types'

const DEFAULT_LIMIT = 8
const FAVORITE_RATING_THRESHOLD = 4
const MAX_FAVORITE_AUTHORS = 2

export interface DiscoveredBook {
  isbn: string
  title: string
  author: string | null
  coverUrl: string | null
  reason: string
}

function normalize(value: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

export class DiscoveryService {
  constructor(
    private readonly auth: AuthProvider,
    private readonly repo: BookRepository,
    private readonly search: SearchAggregator,
  ) {}

  async getDiscoveries(limit: number = DEFAULT_LIMIT): Promise<DiscoveredBook[]> {
    const ownerId = await this.auth.getCurrentUserId()
    const library = await this.repo.list(ownerId)

    const favoriteAuthors = this.pickFavoriteAuthors(library)
    if (favoriteAuthors.length === 0) return []

    const ownedIsbns = new Set(library.map((b) => normalize(b.isbn)).filter(Boolean))
    const ownedTitleAuthor = new Set(
      library.map((b) => `${normalize(b.title)}::${normalize(b.author)}`),
    )

    const perAuthorResults = await Promise.all(
      favoriteAuthors.map((author) => this.searchAuthor(author)),
    )

    const deduped: DiscoveredBook[][] = perAuthorResults.map((results, i) =>
      results
        .filter((r) => !ownedIsbns.has(normalize(r.isbn)))
        .filter((r) => !ownedTitleAuthor.has(`${normalize(r.title)}::${normalize(r.author)}`))
        .map((r) => ({
          isbn: r.isbn,
          title: r.title,
          author: r.author,
          coverUrl: r.coverUrl,
          reason: `More by ${favoriteAuthors[i]}`,
        })),
    )

    return this.interleave(deduped).slice(0, limit)
  }

  private pickFavoriteAuthors(library: BookWithReview[]): string[] {
    const counts = new Map<string, { count: number; sum: number }>()
    for (const b of library) {
      if (b.status !== 'READ' || b.rating == null || b.rating < FAVORITE_RATING_THRESHOLD || !b.author) {
        continue
      }
      const entry = counts.get(b.author) ?? { count: 0, sum: 0 }
      entry.count += 1
      entry.sum += b.rating
      counts.set(b.author, entry)
    }

    return [...counts.entries()]
      .sort((a, b) => b[1].count - a[1].count || b[1].sum / b[1].count - a[1].sum / a[1].count)
      .slice(0, MAX_FAVORITE_AUTHORS)
      .map(([author]) => author)
  }

  private async searchAuthor(author: string): Promise<LookupResult[]> {
    try {
      return await this.search.search(author)
    } catch (error) {
      console.error(`[DiscoveryService] search failed for author "${author}":`, error)
      return []
    }
  }

  private interleave(lists: DiscoveredBook[][]): DiscoveredBook[] {
    const out: DiscoveredBook[] = []
    let i = 0
    while (lists.some((l) => i < l.length)) {
      for (const list of lists) {
        if (i < list.length) out.push(list[i])
      }
      i += 1
    }
    return out
  }
}
