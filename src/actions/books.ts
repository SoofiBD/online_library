'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createBookSchema, updateBookSchema } from '@/lib/schemas'
import { createBookService } from '@/lib/container'
import { progressForStatus, nextStatus } from '@/lib/theme/covers'
import type { BookStatus } from '@/generated/prisma/client'

export type FormState = { errors?: Record<string, string[]> } | undefined

function extractFormData(formData: FormData) {
  const str = (key: string) => {
    const val = formData.get(key) as string | null
    return val && val.trim() ? val.trim() : null
  }
  const status = ((formData.get('status') as string) || 'WANT_TO_READ') as BookStatus
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

  const service = createBookService()
  const book = await service.create(result.data)
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

  const service = createBookService()
  await service.update(id, result.data)
  revalidatePath('/')
  revalidatePath(`/books/${id}`)
  redirect(`/books/${id}`)
}

export async function deleteBook(
  id: string,
  _formData: FormData,
): Promise<void> {
  const service = createBookService()
  await service.delete(id)
  revalidatePath('/')
  redirect('/')
}

// Advances a book's reading status (Want to Read → Reading → Read → …) and
// re-derives its progress, driven by the status pill on the detail view.
export async function cycleStatus(id: string): Promise<void> {
  const service = createBookService()
  const book = await service.getById(id)
  if (!book) return
  const next = nextStatus(book.status)
  await service.update(id, {
    status: next,
    progress: progressForStatus(next, book.progress),
  })
  revalidatePath('/')
  revalidatePath(`/books/${id}`)
}
