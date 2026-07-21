// In-memory fixed-window rate limiter. Single-process deployment (SQLite +
// named volumes, see docker-compose.yml), so a shared in-memory Map is
// sufficient — no Redis needed for this scale.
const buckets = new Map<string, { count: number; resetAt: number }>()

/** Returns true if `key` has exceeded `limit` requests within `windowMs`. */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  bucket.count += 1
  return bucket.count > limit
}

/** IP for rate-limit keying. Trusts x-forwarded-for since the app sits behind Caddy in production. */
export function clientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  return forwardedFor?.split(',')[0]?.trim() || 'unknown'
}
