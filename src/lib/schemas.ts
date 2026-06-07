import { z } from 'zod'

export const bookStatusSchema = z.enum(['WANT_TO_READ', 'READING', 'READ'])

// rating/notes now live on the Review model, but they are still collected on the
// same form as the book itself, so they remain part of the book input and are
// split off into a Review inside the repository transaction.
const ratingSchema = z.coerce.number().int().min(1).max(5).optional().nullable()

export const createBookSchema = z.object({
  isbn: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required'),
  author: z.string().optional().nullable(),
  coverPath: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  rating: ratingSchema,
  status: bookStatusSchema.default('WANT_TO_READ'),
})

export const updateBookSchema = z.object({
  isbn: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required').optional(),
  author: z.string().optional().nullable(),
  coverPath: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  rating: ratingSchema,
  status: bookStatusSchema.optional(),
})

// Payload POSTed by the standalone barcode scanner (Module 2 bridge). Field
// names mirror the scanner's own vocabulary (cover/review/year); the route
// handler maps them onto the Book + Review model. At least a title or an ISBN
// must be present — the server can resolve the rest from the ISBN.
export const scanBookSchema = z
  .object({
    isbn: z.string().optional().nullable(),
    title: z.string().optional().nullable(),
    author: z.string().optional().nullable(),
    publisher: z.string().optional().nullable(),
    year: z.union([z.string(), z.number()]).optional().nullable(),
    cover: z.string().optional().nullable(),
    rating: ratingSchema,
    review: z.string().optional().nullable(),
  })
  .refine(
    (d) => Boolean(d.title && d.title.trim()) || Boolean(d.isbn && d.isbn.trim()),
    { message: 'Provide at least a title or an ISBN' },
  )

export type CreateBookInput = z.infer<typeof createBookSchema>
export type UpdateBookInput = z.infer<typeof updateBookSchema>
export type ScanBookInput = z.infer<typeof scanBookSchema>
