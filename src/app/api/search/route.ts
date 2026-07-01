import type { NextRequest } from 'next/server'
import { createBookService } from '@/lib/container'
import { corsJson, corsPreflight } from '@/lib/cors'

// GET /api/search?q=... -> ranked candidate list from the multi-source
// aggregator (Open Library + Google Books + optional ISBNDB, DB-cached).
// Used by the search box when a barcode/ISBN lookup isn't possible.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return corsJson({ error: 'Missing ?q= query parameter' }, { status: 400 })
  }
  const service = createBookService()
  const results = await service.search(q)
  return corsJson({ results })
}

export function OPTIONS() {
  return corsPreflight()
}
