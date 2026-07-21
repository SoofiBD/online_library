import { z } from 'zod'

export const bookStatusSchema = z.enum(['WANT_TO_READ', 'READING', 'READ'])
export const bookLocationSchema = z.enum(['ONLINE', 'PHYSICAL'])

// rating/notes now live on the Review model, but they are still collected on the
// same form as the book itself, so they remain part of the book input and are
// split off into a Review inside the repository transaction.
const ratingSchema = z.coerce.number().int().min(1).max(5).optional().nullable()
const progressSchema = z.coerce.number().int().min(0).max(100).optional().nullable()
const tagsSchema = z.array(z.string().trim().min(1)).optional()

export const createBookSchema = z.object({
  isbn: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required'),
  author: z.string().optional().nullable(),
  coverPath: z.string().optional().nullable(),
  coverColor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  rating: ratingSchema,
  progress: progressSchema,
  tags: tagsSchema,
  status: bookStatusSchema.default('WANT_TO_READ'),
  location: bookLocationSchema.default('PHYSICAL'),
})

export const updateBookSchema = z.object({
  isbn: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required').optional(),
  author: z.string().optional().nullable(),
  coverPath: z.string().optional().nullable(),
  coverColor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  rating: ratingSchema,
  progress: progressSchema,
  tags: tagsSchema,
  status: bookStatusSchema.optional(),
  location: bookLocationSchema.optional(),
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

// --- Review (bounded context) -------------------------------------------------
// These validate a Review payload *on its own*, decoupled from the Book form, so
// the future cross-share milestone can create/edit a user's evaluation of an
// already-cataloged book without touching the immutable catalog metadata.
//
// `userId` is intentionally absent: it is supplied server-side by the
// AuthProvider (session cookie or paired device), never trusted from the
// client (same pattern as `ownerId` on the Book schemas). `bookId` identifies
// which catalog entry is being rated.

// On create, a rating is the whole point of the interaction, so it is required
// and strictly bounded 1–5 (the DB column stays nullable for the book-form path).
export const createReviewSchema = z.object({
  bookId: z.string().min(1, 'bookId is required'),
  rating: z.coerce
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5'),
  notes: z.string().trim().optional().nullable(),
})

// On update (PATCH semantics) every field is optional; `null` is allowed so a
// caller can explicitly clear a previously set rating or notes. `bookId` is
// omitted on purpose — a review never migrates to a different book.
export const updateReviewSchema = z.object({
  rating: z.coerce
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional()
    .nullable(),
  notes: z.string().trim().optional().nullable(),
})

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().trim().min(1).optional().nullable(),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const claimPairingCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'Code must be 6 digits'),
  deviceId: z.string().trim().min(1, 'deviceId is required'),
  name: z.string().trim().min(1).optional().nullable(),
})

export type ClaimPairingCodeInput = z.infer<typeof claimPairingCodeSchema>
export type CreateBookInput = z.infer<typeof createBookSchema>
export type UpdateBookInput = z.infer<typeof updateBookSchema>
export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
export type ScanBookInput = z.infer<typeof scanBookSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
