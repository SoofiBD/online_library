import { prisma } from '@/lib/db'
import type { CacheEntry, LookupCacheStore } from './LookupCacheStore'

/** Persistent cache backed by the LookupCache table. Lazy expiry on read. */
export class PrismaLookupCacheStore implements LookupCacheStore {
  async get(key: string): Promise<CacheEntry | null> {
    const row = await prisma.lookupCache.findUnique({ where: { key } })
    if (!row) return null
    if (row.expiresAt.getTime() <= Date.now()) return null
    return { payload: JSON.parse(row.payload), hit: row.hit, expiresAt: row.expiresAt }
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    const kind = key.startsWith('isbn:') ? 'isbn' : 'text'
    const data = {
      kind,
      payload: JSON.stringify(entry.payload),
      hit: entry.hit,
      expiresAt: entry.expiresAt,
    }
    await prisma.lookupCache.upsert({
      where: { key },
      create: { key, ...data },
      update: data,
    })
  }
}
