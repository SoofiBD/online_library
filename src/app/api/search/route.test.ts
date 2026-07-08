import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/container', () => ({
  createBookService: () => ({ search: async (q: string) => (q === 'hit' ? [{ title: 'X' }] : []) }),
}))

import { GET } from './route'

function req(url: string) {
  return { nextUrl: new URL(url), headers: new Headers() } as never
}

describe('GET /api/search', () => {
  it('400 when q missing', async () => {
    const res = await GET(req('http://x/api/search'))
    expect(res.status).toBe(400)
  })
  it('returns results for a query', async () => {
    const res = await GET(req('http://x/api/search?q=hit'))
    expect(res.status).toBe(200)
    expect((await res.json()).results).toHaveLength(1)
  })
})
