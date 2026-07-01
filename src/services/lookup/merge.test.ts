import { describe, it, expect } from 'vitest'
import { dedupeKey, mergeResults, rankResults } from './merge'
import type { LookupResult } from './types'

const base = (over: Partial<LookupResult>): LookupResult => ({
  isbn: '9780306406157', title: 'T', author: null, publisher: null,
  publishedYear: null, coverUrl: null, source: 'x', ...over,
})

describe('dedupeKey', () => {
  it('uses isbn when present', () => {
    expect(dedupeKey(base({ isbn: '9780306406157' }))).toBe('9780306406157')
  })
  it('falls back to normalized title+author', () => {
    const k = dedupeKey(base({ isbn: '', title: 'The  Hobbit!', author: 'J. Tolkien' }))
    expect(k).toBe('thehobbit|jtolkien')
  })
})

describe('mergeResults', () => {
  it('collapses same-key records and fills null fields from others', () => {
    const merged = mergeResults([
      base({ source: 'a', coverUrl: null, publisher: null }),
      base({ source: 'b', coverUrl: 'http://c', publisher: 'Pub' }),
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0].coverUrl).toBe('http://c')
    expect(merged[0].publisher).toBe('Pub')
  })
})

describe('rankResults', () => {
  it('ranks more-complete records first', () => {
    const sparse = base({ isbn: '1', title: 'A', coverUrl: null, author: null })
    const full = base({ isbn: '2', title: 'B', coverUrl: 'http://c', author: 'X' })
    expect(rankResults([sparse, full])[0].isbn).toBe('2')
  })
})
