'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createBookSchema, updateBookSchema } from '@/lib/schemas'
import { createBookService } from '@/lib/container'

export type FormState = { errors?: Record<string, string[]> } | undefined

function extractFormData(formData: FormData) {
  const str = (key: string) => {
    const val = formData.get(key) as string | null
    return val && val.trim() ? val.trim() : null
  }
  return {
    title: (formData.get('title') as string)?.trim() ?? '',
    author: str('author'),
    coverPath: str('coverPath'),
    notes: str('notes'),
    rating: formData.get('rating') || null,
    status: (formData.get('status') as string) || 'WANT_TO_READ',
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
