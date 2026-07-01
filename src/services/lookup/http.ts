const DEFAULT_TIMEOUT_MS = 6000

export type FetchResult =
  | { status: 'ok'; data: unknown }
  | { status: 'notFound' }
  | { status: 'rateLimited' }
  | { status: 'error'; error: unknown }

/**
 * GETs JSON with a hard timeout. Distinguishes 429 (rate-limited, transient)
 * from other non-2xx (treated as notFound) so callers can avoid negative-caching
 * a throttled response. Never throws — network/abort errors return {error}.
 */
export async function fetchJson(
  url: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<FetchResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    if (res.status === 429) return { status: 'rateLimited' }
    if (!res.ok) return { status: 'notFound' }
    return { status: 'ok', data: await res.json() }
  } catch (error) {
    return { status: 'error', error }
  } finally {
    clearTimeout(timer)
  }
}

/** Pulls a 4-digit year out of values like "2003-05-01" or "May 2003". */
export function extractYear(value: unknown): number | null {
  if (value == null) return null
  const match = String(value).match(/\d{4}/)
  return match ? Number(match[0]) : null
}
