import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchJson } from './http'

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response)
}

afterEach(() => vi.restoreAllMocks())

describe('fetchJson', () => {
  it('returns ok + data on 200', async () => {
    vi.stubGlobal('fetch', mockFetch(200, { a: 1 }))
    expect(await fetchJson('u')).toEqual({ status: 'ok', data: { a: 1 } })
  })
  it('maps 404 to notFound', async () => {
    vi.stubGlobal('fetch', mockFetch(404, {}))
    expect(await fetchJson('u')).toEqual({ status: 'notFound' })
  })
  it('maps 429 to rateLimited', async () => {
    vi.stubGlobal('fetch', mockFetch(429, {}))
    expect(await fetchJson('u')).toEqual({ status: 'rateLimited' })
  })
  it('maps network throw to error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    const r = await fetchJson('u')
    expect(r.status).toBe('error')
  })
})
