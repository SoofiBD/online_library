import { describe, it, expect } from 'vitest'
import { SearchAggregator } from './SearchAggregator'
import type { BookLookupConnector, LookupResult, TextQuery } from './types'
import { InMemoryLookupCacheStore } from './cache/LookupCacheStore'

const r = (over: Partial<LookupResult>): LookupResult => ({
  isbn: '9780306406157', title: 'T', author: null, publisher: null,
  publishedYear: null, coverUrl: null, source: 's', ...over,
})

function fakeConn(name: string, tier: 'fast' | 'fallback', opts: {
  isbn?: LookupResult[]; text?: LookupResult[]; throws?: boolean
}): BookLookupConnector {
  return {
    name, tier,
    async lookupByIsbn() { if (opts.throws) throw new Error('x'); return opts.isbn ?? [] },
    async searchByText(_q: TextQuery) { if (opts.throws) throw new Error('x'); return opts.text ?? [] },
  }
}

describe('SearchAggregator.byIsbn', () => {
  it('merges fields across sources into one record', async () => {
    const agg = new SearchAggregator([
      fakeConn('a', 'fast', { isbn: [r({ source: 'a', coverUrl: null, publisher: null })] }),
      fakeConn('b', 'fast', { isbn: [r({ source: 'b', coverUrl: 'http://c', publisher: 'P' })] }),
    ])
    const out = await agg.byIsbn('9780306406157')
    expect(out?.coverUrl).toBe('http://c')
    expect(out?.publisher).toBe('P')
  })
  it('survives a throwing connector', async () => {
    const agg = new SearchAggregator([
      fakeConn('bad', 'fast', { throws: true }),
      fakeConn('good', 'fast', { isbn: [r({ source: 'good' })] }),
    ])
    expect((await agg.byIsbn('9780306406157'))?.source).toBe('good')
  })
  it('returns null for invalid isbn', async () => {
    const agg = new SearchAggregator([])
    expect(await agg.byIsbn('not-an-isbn')).toBeNull()
  })
  it('falls back to the ISBN-10 form when EAN-13 misses', async () => {
    const conn: BookLookupConnector = {
      name: 'a', tier: 'fast',
      async lookupByIsbn(isbn: string) {
        return isbn === '0306406152' ? [r({ source: 'a', isbn: '0306406152' })] : []
      },
    }
    const agg = new SearchAggregator([conn])
    const out = await agg.byIsbn('9780306406157')
    expect(out?.source).toBe('a')
  })
})

describe('SearchAggregator.search', () => {
  it('dedupes candidates across sources', async () => {
    const agg = new SearchAggregator([
      fakeConn('a', 'fast', { text: [r({ isbn: '1', title: 'A' }), r({ isbn: '2', title: 'B' })] }),
      fakeConn('b', 'fast', { text: [r({ isbn: '1', title: 'A' })] }),
    ])
    const out = await agg.search('a')
    expect(out).toHaveLength(2)
  })
  it('only calls fallback tier when fast results below threshold', async () => {
    let fallbackCalled = false
    const fallback: BookLookupConnector = {
      name: 'scrape', tier: 'fallback',
      async searchByText() { fallbackCalled = true; return [r({ isbn: '9', title: 'Z' })] },
    }
    const agg = new SearchAggregator(
      [fakeConn('a', 'fast', { text: [r({ isbn: '1', title: 'A' })] }), fallback],
      { fallbackThreshold: 1 },
    )
    await agg.search('a')
    expect(fallbackCalled).toBe(false) // fast returned >= threshold
  })
})

describe('SearchAggregator caching', () => {
  it('serves byIsbn from cache without re-calling connectors', async () => {
    let calls = 0
    const conn: BookLookupConnector = {
      name: 'a', tier: 'fast',
      async lookupByIsbn() { calls++; return [r({ source: 'a' })] },
    }
    const cache = new InMemoryLookupCacheStore()
    const agg = new SearchAggregator([conn], { cache })
    await agg.byIsbn('9780306406157')
    await agg.byIsbn('9780306406157')
    expect(calls).toBe(1)
  })
  it('negative-caches an isbn miss', async () => {
    let calls = 0
    const conn: BookLookupConnector = {
      name: 'a', tier: 'fast',
      async lookupByIsbn() { calls++; return [] },
    }
    const cache = new InMemoryLookupCacheStore()
    const agg = new SearchAggregator([conn], { cache })
    expect(await agg.byIsbn('9780306406157')).toBeNull()
    const afterFirst = calls          // 1 or 2 — don't care
    expect(await agg.byIsbn('9780306406157')).toBeNull()
    expect(calls).toBe(afterFirst)    // second call served from negative cache
  })

  it('does not negative-cache when a connector is rate-limited/transient', async () => {
    let calls = 0
    const conn: BookLookupConnector = {
      name: 'a', tier: 'fast',
      async lookupByIsbn() { calls++; throw new Error('rate limited') },
    }
    const cache = new InMemoryLookupCacheStore()
    const agg = new SearchAggregator([conn], { cache })
    expect(await agg.byIsbn('9780306406157')).toBeNull()
    const afterFirst = calls
    expect(await agg.byIsbn('9780306406157')).toBeNull()
    expect(calls).toBeGreaterThan(afterFirst) // re-queried, not cached
  })
})
