import { z } from 'zod'

export const bookStatusSchema = z.enum(['WANT_TO_READ', 'READING', 'READ'])

export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().optional().nullable(),
  coverPath: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  status: bookStatusSchema.default('WANT_TO_READ'),
})

export const updateBookSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  author: z.string().optional().nullable(),
  coverPath: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  status: bookStatusSchema.optional(),
})

export type CreateBookInput = z.infer<typeof createBookSchema>
export type UpdateBookInput = z.infer<typeof updateBookSchema>
