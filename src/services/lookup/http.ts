const DEFAULT_TIMEOUT_MS = 6000

/**
 * GETs JSON with a hard timeout so a slow external catalogue cannot stall the
 * whole connector chain. Returns `null` on a non-2xx response; throws on
 * network/abort errors so the chain can log and fall through to the next source.
 */
export async function fetchJson(
  url: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    if (!res.ok) return null
    return await res.json()
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
