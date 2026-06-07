import type { NextRequest } from 'next/server'
import { createBookService } from '@/lib/container'
import { corsJson, corsPreflight } from '@/lib/cors'

// GET /api/lookup?isbn=... -> resolve metadata through the connector chain
// (Open Library -> Google Books -> optional ISBNDB). Used by the scanner to
// preview a book before saving, keeping the lookup logic server-side (Module 3).
export async function GET(request: NextRequest) {
  const isbn = request.nextUrl.searchParams.get('isbn')
  if (!isbn) {
    return corsJson({ error: 'Missing ?isbn= query parameter' }, { status: 400 })
  }

  const service = createBookService()
  const result = await service.lookup(isbn)
  if (!result) {
    return corsJson({ found: false }, { status: 404 })
  }
  return corsJson({ found: true, book: result })
}

export function OPTIONS() {
  return corsPreflight()
}
