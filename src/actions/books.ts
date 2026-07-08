'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createBookSchema, updateBookSchema } from '@/lib/schemas'
import { createBookService } from '@/lib/container'
import { progressForStatus, nextStatus } from '@/lib/theme/covers'
import type { BookStatus, BookLocation } from '@/generated/prisma/client'

export type FormState = { errors?: Record<string, string[]> } | undefined

function extractFormData(formData: FormData) {
  const str = (key: string) => {
    const val = formData.get(key) as string | null
    return val && val.trim() ? val.trim() : null
  }
  const status = ((formData.get('status') as string) || 'WANT_TO_READ') as BookStatus
  const location = ((formData.get('location') as string) || 'PHYSICAL') as BookLocation
  const tagsRaw = (formData.get('tags') as string) || ''
  const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
  return {
    title: (formData.get('title') as string)?.trim() ?? '',
    author: str('author'),
    coverPath: str('coverPath'),
    coverColor: str('coverColor'),
    notes: str('notes'),
    rating: formData.get('rating') || null,
    status,
    location,
    tags,
    // Progress is derived from status (the comp has no manual progress input).
    progress: progressForStatus(status),
  }
}

export async function createBook(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = extractFormData(formData)
  const result = createBookSchema.safeParse(raw)

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  let book
  try {
    const service = createBookService()
    book = await service.create(result.data)
  } catch (error) {
    console.error('[actions/books] createBook failed:', error)
    return { errors: { _form: ['Could not save the book. Please try again.'] } }
  }
  revalidatePath('/')
  redirect(`/books/${book.id}`)
}

export async function updateBook(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = extractFormData(formData)
  const result = updateBookSchema.safeParse(raw)

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  try {
    const service = createBookService()
    await service.update(id, result.data)
  } catch (error) {
    console.error('[actions/books] updateBook failed:', error)
    return { errors: { _form: ['Could not save the book. Please try again.'] } }
  }
  revalidatePath('/')
  revalidatePath(`/books/${id}`)
  redirect(`/books/${id}`)
}

export async function deleteBook(
  id: string,
  _formData: FormData,
): Promise<void> {
  const service = createBookService()
  try {
    await service.delete(id)
  } catch (error) {
    console.error('[actions/books] deleteBook failed:', error)
    throw error
  }
  revalidatePath('/')
  redirect('/')
}

// Advances a book's reading status (Want to Read → Reading → Read → …) and
// re-derives its progress, driven by the status pill on the detail view.
export async function cycleStatus(id: string): Promise<void> {
  const service = createBookService()
  let book
  try {
    book = await service.getById(id)
  } catch (error) {
    console.error('[actions/books] cycleStatus failed:', error)
    throw error
  }
  if (!book) return
  const next = nextStatus(book.status)
  await service.update(id, {
    status: next,
    progress: progressForStatus(next, book.progress),
  })
  revalidatePath('/')
  revalidatePath(`/books/${id}`)
}
