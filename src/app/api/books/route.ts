import type { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createBookService, resolveAuthProvider } from '@/lib/container'
import { scanBookSchema } from '@/lib/schemas'
import { BookValidationError } from '@/services/BookService'
import { corsJson, corsPreflight, requireValidOrigin } from '@/lib/cors'
import { isAuthError } from '@/lib/auth/isAuthError'

// GET /api/books -> the current owner's library, as shared JSON. Lets the
// standalone scanner render the same list the PC sees.
export async function GET(request: NextRequest) {
  try {
    const service = createBookService(resolveAuthProvider(request))
    const books = await service.list()
    return corsJson(request, { books })
  } catch (error) {
    if (isAuthError(error)) return corsJson(request, { error: error.message }, { status: 401 })
    console.error('[api/books] GET failed:', error)
    return corsJson(request, { error: 'Could not load the library' }, { status: 500 })
  }
}

// POST /api/books -> persist a scanned/manual book into the shared database.
export async function POST(request: NextRequest) {
  const originError = requireValidOrigin(request)
  if (originError) return originError

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return corsJson(request, { error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = scanBookSchema.safeParse(payload)
  if (!parsed.success) {
    return corsJson(
      request,
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { isbn, title, author, cover, rating, review } = parsed.data
  try {
    const service = createBookService(resolveAuthProvider(request))
    const book = await service.addByScan({
      isbn,
      title,
      author,
      coverPath: cover ?? null,
      rating: rating ?? null,
      notes: review ?? null,
    })

    // Mark the home library stale so the next visit on the PC shows the book.
    revalidatePath('/')
    return corsJson(request, { book }, { status: 201 })
  } catch (error) {
    if (isAuthError(error)) return corsJson(request, { error: error.message }, { status: 401 })
    if (error instanceof BookValidationError) {
      return corsJson(request, { error: error.message }, { status: 422 })
    }
    console.error('[api/books] POST failed:', error)
    return corsJson(request, { error: 'Could not save the book' }, { status: 500 })
  }
}

// Preflight for cross-origin POSTs from the scanner.
export function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}
