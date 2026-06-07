import type { NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createBookService } from '@/lib/container'
import { scanBookSchema } from '@/lib/schemas'
import { BookValidationError } from '@/services/BookService'
import { corsJson, corsPreflight } from '@/lib/cors'

// GET /api/books -> the current owner's library, as shared JSON. Lets the
// standalone scanner render the same list the PC sees.
export async function GET() {
  const service = createBookService()
  const books = await service.list()
  return corsJson({ books })
}

// POST /api/books -> persist a scanned/manual book into the shared database.
export async function POST(request: NextRequest) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return corsJson({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = scanBookSchema.safeParse(payload)
  if (!parsed.success) {
    return corsJson(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { isbn, title, author, cover, rating, review } = parsed.data
  try {
    const service = createBookService()
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
    return corsJson({ book }, { status: 201 })
  } catch (error) {
    if (error instanceof BookValidationError) {
      return corsJson({ error: error.message }, { status: 422 })
    }
    console.error('[api/books] POST failed:', error)
    return corsJson({ error: 'Could not save the book' }, { status: 500 })
  }
}

// Preflight for cross-origin POSTs from the scanner.
export function OPTIONS() {
  return corsPreflight()
}
