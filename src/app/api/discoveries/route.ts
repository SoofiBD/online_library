import type { NextRequest } from 'next/server'
import { createDiscoveryService, resolveAuthProvider } from '@/lib/container'
import { corsJson, corsPreflight } from '@/lib/cors'
import { isAuthError } from '@/lib/auth/isAuthError'

const DEFAULT_LIMIT = 8
const MAX_LIMIT = 20

// GET /api/discoveries -> books by the owner's favorite authors that aren't
// already in their library, sourced from the external catalog. Same JSON for
// web and mobile.
export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get('limit')
  const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : DEFAULT_LIMIT
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, MAX_LIMIT)
    : DEFAULT_LIMIT

  try {
    const service = createDiscoveryService(resolveAuthProvider(request))
    const discoveries = await service.getDiscoveries(limit)
    return corsJson(request, { discoveries })
  } catch (error) {
    if (isAuthError(error)) return corsJson(request, { error: error.message }, { status: 401 })
    console.error('[api/discoveries] GET failed:', error)
    return corsJson(request, { error: 'Could not load discoveries' }, { status: 500 })
  }
}

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}
