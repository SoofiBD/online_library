import type { NextRequest } from 'next/server'
import { createRecommendationService, resolveAuthProvider } from '@/lib/container'
import { corsJson, corsPreflight } from '@/lib/cors'
import { isAuthError } from '@/lib/auth/isAuthError'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

// GET /api/recommendations -> the current owner's WANT_TO_READ books ranked
// by fit to their rated-book taste profile. Same JSON for web and mobile.
export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get('limit')
  const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : DEFAULT_LIMIT
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, MAX_LIMIT)
    : DEFAULT_LIMIT

  try {
    const service = createRecommendationService(resolveAuthProvider(request))
    const recommendations = await service.getRecommendations(limit)
    return corsJson(request, { recommendations })
  } catch (error) {
    if (isAuthError(error)) return corsJson(request, { error: error.message }, { status: 401 })
    console.error('[api/recommendations] GET failed:', error)
    return corsJson(request, { error: 'Could not load recommendations' }, { status: 500 })
  }
}

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}
