export interface CacheEntry {
  payload: unknown
  hit: boolean
  expiresAt: Date
}

export interface LookupCacheStore {
  get(key: string): Promise<CacheEntry | null>
  set(key: string, entry: CacheEntry): Promise<void>
}

/** In-memory store for tests and single-process fallback. Lazy expiry on read. */
export class InMemoryLookupCacheStore implements LookupCacheStore {
  private readonly map = new Map<string, CacheEntry>()

  async get(key: string): Promise<CacheEntry | null> {
    const entry = this.map.get(key)
    if (!entry) return null
    if (entry.expiresAt.getTime() <= Date.now()) {
      this.map.delete(key)
      return null
    }
    return entry
  }

  async set(key: string, entry: CacheEntry): Promise<void> {
    this.map.set(key, entry)
  }
}
