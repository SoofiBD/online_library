import type { NextRequest } from 'next/server'
import { createBookService, resolveAuthProvider } from '@/lib/container'
import { corsJson, corsPreflight } from '@/lib/cors'

// GET /api/search?q=... -> ranked candidate list from the multi-source
// aggregator (Open Library + Google Books + optional ISBNDB, DB-cached).
// Used by the search box when a barcode/ISBN lookup isn't possible.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return corsJson(request, { error: 'Missing ?q= query parameter' }, { status: 400 })
  }
  try {
    const service = createBookService(resolveAuthProvider(request))
    const results = await service.search(q)
    return corsJson(request, { results })
  } catch (error) {
    console.error('[api/search] GET failed:', error)
    return corsJson(request, { error: 'Search failed' }, { status: 500 })
  }
}

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}
