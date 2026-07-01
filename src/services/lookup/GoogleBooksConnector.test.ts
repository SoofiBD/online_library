import { describe, it, expect, vi, afterEach } from 'vitest'
import { GoogleBooksConnector } from './GoogleBooksConnector'

function stub(body: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status < 300, status, json: async () => body,
  } as Response))
}
afterEach(() => vi.restoreAllMocks())

describe('GoogleBooksConnector', () => {
  it('lookupByIsbn maps volumeInfo', async () => {
    stub({ totalItems: 1, items: [{ volumeInfo: { title: 'G', authors: ['A'], imageLinks: { thumbnail: 'http://c' } } }] })
    const out = await new GoogleBooksConnector().lookupByIsbn!('9780306406157')
    expect(out[0].title).toBe('G')
    expect(out[0].coverUrl).toBe('https://c')
  })
  it('lookupByIsbn returns [] on zero items', async () => {
    stub({ totalItems: 0 })
    expect(await new GoogleBooksConnector().lookupByIsbn!('9780306406157')).toEqual([])
  })
  it('searchByText returns multiple candidates', async () => {
    stub({ totalItems: 2, items: [
      { volumeInfo: { title: 'One', authors: ['A'] } },
      { volumeInfo: { title: 'Two', authors: ['B'] } },
    ] })
    const out = await new GoogleBooksConnector().searchByText!({ raw: 'x' })
    expect(out).toHaveLength(2)
  })
})
