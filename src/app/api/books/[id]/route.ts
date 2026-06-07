import type { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createBookService } from '@/lib/container'
import { CORS_HEADERS, corsJson, corsPreflight } from '@/lib/cors'

// DELETE /api/books/:id -> remove a book from the shared database so the scanner
// and the PC stay in sync. Explicit Promise-typed params (per Next 16 route
// handler conventions) rather than the generated RouteContext global.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  try {
    const service = createBookService()
    await service.delete(id)
    revalidatePath('/')
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  } catch (error) {
    console.error('[api/books/:id] DELETE failed:', error)
    return corsJson({ error: 'Could not delete the book' }, { status: 404 })
  }
}

export function OPTIONS() {
  return corsPreflight()
}
