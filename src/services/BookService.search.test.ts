import { describe, it, expect } from 'vitest'
import { BookService } from './BookService'
import type { SearchAggregator, LookupResult } from '@/services/lookup'

const candidate: LookupResult = {
  isbn: '9780306406157', title: 'T', author: 'A', publisher: null,
  publishedYear: null, coverUrl: null, source: 's',
}

describe('BookService.search', () => {
  it('delegates to the aggregator', async () => {
    const agg = { search: async () => [candidate] } as unknown as SearchAggregator
    const svc = new BookService({ getCurrentUserId: async () => 'u' } as never, {} as never, {} as never, agg)
    expect(await svc.search('t')).toEqual([candidate])
  })
  it('returns [] when no aggregator configured', async () => {
    const svc = new BookService({ getCurrentUserId: async () => 'u' } as never, {} as never, {} as never, null)
    expect(await svc.search('t')).toEqual([])
  })
})
