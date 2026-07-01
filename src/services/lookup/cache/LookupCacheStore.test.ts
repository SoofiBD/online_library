import { describe, it, expect } from 'vitest'
import { InMemoryLookupCacheStore } from './LookupCacheStore'

describe('InMemoryLookupCacheStore', () => {
  it('returns a stored entry before expiry', async () => {
    const s = new InMemoryLookupCacheStore()
    await s.set('k', { payload: { a: 1 }, hit: true, expiresAt: new Date(Date.now() + 10000) })
    expect((await s.get('k'))?.payload).toEqual({ a: 1 })
  })
  it('returns null for an expired entry', async () => {
    const s = new InMemoryLookupCacheStore()
    await s.set('k', { payload: {}, hit: true, expiresAt: new Date(Date.now() - 1) })
    expect(await s.get('k')).toBeNull()
  })
  it('returns null for a missing key', async () => {
    expect(await new InMemoryLookupCacheStore().get('nope')).toBeNull()
  })
})
