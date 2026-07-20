import type { NextRequest } from 'next/server'
import { createBookService, resolveAuthProvider } from '@/lib/container'
import { corsJson, corsPreflight } from '@/lib/cors'

// GET /api/lookup?isbn=... -> resolve metadata through the connector chain
// (Open Library -> Google Books -> optional ISBNDB). Used by the scanner to
// preview a book before saving, keeping the lookup logic server-side (Module 3).
export async function GET(request: NextRequest) {
  const isbn = request.nextUrl.searchParams.get('isbn')
  if (!isbn) {
    return corsJson(request, { error: 'Missing ?isbn= query parameter' }, { status: 400 })
  }

  try {
    const service = createBookService(resolveAuthProvider(request))
    const result = await service.lookup(isbn)
    if (!result) {
      return corsJson(request, { found: false }, { status: 404 })
    }
    return corsJson(request, { found: true, book: result })
  } catch (error) {
    console.error('[api/lookup] GET failed:', error)
    return corsJson(request, { error: 'Lookup failed' }, { status: 500 })
  }
}

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}
