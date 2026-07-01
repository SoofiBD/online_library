import { describe, it, expect, vi, afterEach } from 'vitest'
import { OpenLibraryConnector } from './OpenLibraryConnector'

function stub(body: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status < 300, status, json: async () => body,
  } as Response))
}
afterEach(() => vi.restoreAllMocks())

describe('OpenLibraryConnector.lookupByIsbn', () => {
  it('returns a result array on hit', async () => {
    stub({ 'ISBN:9780306406157': { title: 'Structure', authors: [{ name: 'A' }] } })
    const c = new OpenLibraryConnector()
    const out = await c.lookupByIsbn!('9780306406157')
    expect(out[0].title).toBe('Structure')
    expect(out[0].source).toBe('openlibrary')
  })
  it('returns [] on miss', async () => {
    stub({})
    const c = new OpenLibraryConnector()
    expect(await c.lookupByIsbn!('9780306406157')).toEqual([])
  })
})

describe('OpenLibraryConnector.searchByText', () => {
  it('maps search docs to results', async () => {
    stub({ docs: [{ title: 'Hobbit', author_name: ['Tolkien'], first_publish_year: 1937, isbn: ['9780261102217'] }] })
    const c = new OpenLibraryConnector()
    const out = await c.searchByText!({ raw: 'hobbit', title: 'hobbit' })
    expect(out[0].title).toBe('Hobbit')
    expect(out[0].author).toBe('Tolkien')
  })
})
