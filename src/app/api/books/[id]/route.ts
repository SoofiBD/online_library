import type { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createBookService, resolveAuthProvider } from '@/lib/container'
import { corsJson, corsPreflight, corsHeadersForRequest, requireValidOrigin } from '@/lib/cors'
import { isAuthError } from '@/lib/auth/isAuthError'

// DELETE /api/books/:id -> remove a book from the shared database so the scanner
// and the PC stay in sync. Explicit Promise-typed params (per Next 16 route
// handler conventions) rather than the generated RouteContext global.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const originError = requireValidOrigin(request)
  if (originError) return originError

  const { id } = await params
  try {
    const service = createBookService(resolveAuthProvider(request))
    await service.delete(id)
    revalidatePath('/')
    return new Response(null, { status: 204, headers: corsHeadersForRequest(request) })
  } catch (error) {
    if (isAuthError(error)) return corsJson(request, { error: error.message }, { status: 401 })
    console.error('[api/books/:id] DELETE failed:', error)
    return corsJson(request, { error: 'Could not delete the book' }, { status: 404 })
  }
}

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}
