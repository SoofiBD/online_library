import { prisma } from '@/lib/db'
import type { Book, Review } from '@/generated/prisma/client'
import type {
  BookRepository,
  BookFilter,
  BookCreateData,
  BookUpdateData,
  BookWithReview,
} from './BookRepository'

type BookRow = Book & { reviews: Review[] }

// Each query loads only the *current* user's review (there is at most one per
// (user, book)), then flattens its rating/notes onto the book.
function reviewInclude(ownerId: string) {
  return { reviews: { where: { userId: ownerId } } } as const
}

function flatten(row: BookRow): BookWithReview {
  const review = row.reviews[0]
  return {
    id: row.id,
    ownerId: row.ownerId,
    isbn: row.isbn,
    title: row.title,
    author: row.author,
    coverPath: row.coverPath,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    rating: review?.rating ?? null,
    notes: review?.notes ?? null,
  }
}

export class PrismaBookRepository implements BookRepository {
  async list(ownerId: string, filter?: BookFilter): Promise<BookWithReview[]> {
    const rows = await prisma.book.findMany({
      where: {
        ownerId,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.q
          ? {
              OR: [
                { title: { contains: filter.q } },
                { author: { contains: filter.q } },
              ],
            }
          : {}),
      },
      include: reviewInclude(ownerId),
      orderBy: { createdAt: 'desc' },
    })
    return rows.map(flatten)
  }

  async getById(ownerId: string, id: string): Promise<BookWithReview | null> {
    const row = await prisma.book.findFirst({
      where: { id, ownerId },
      include: reviewInclude(ownerId),
    })
    return row ? flatten(row) : null
  }

  async findByIsbn(ownerId: string, isbn: string): Promise<BookWithReview | null> {
    const row = await prisma.book.findFirst({
      where: { ownerId, isbn },
      include: reviewInclude(ownerId),
    })
    return row ? flatten(row) : null
  }

  async create(ownerId: string, data: BookCreateData): Promise<BookWithReview> {
    const { rating, notes, ...bookData } = data

    const row = await prisma.$transaction(async (tx) => {
      const book = await tx.book.create({ data: { ...bookData, ownerId } })

      // Only create a Review when the user actually rated or wrote something.
      if (rating != null || notes != null) {
        await tx.review.create({
          data: { userId: ownerId, bookId: book.id, rating: rating ?? null, notes: notes ?? null },
        })
      }

      return tx.book.findFirstOrThrow({
        where: { id: book.id },
        include: reviewInclude(ownerId),
      })
    })

    return flatten(row)
  }

  async update(ownerId: string, id: string, data: BookUpdateData): Promise<BookWithReview> {
    const { rating, notes, ...bookData } = data

    const row = await prisma.$transaction(async (tx) => {
      const existing = await tx.book.findFirst({ where: { id, ownerId } })
      if (!existing) throw new Error('Book not found')

      await tx.book.update({ where: { id }, data: bookData })

      // Keep the user's review in lock-step with the form. Upsert so the row is
      // created the first time the book is rated and updated thereafter.
      if ('rating' in data || 'notes' in data) {
        await tx.review.upsert({
          where: { userId_bookId: { userId: ownerId, bookId: id } },
          create: { userId: ownerId, bookId: id, rating: rating ?? null, notes: notes ?? null },
          update: { rating: rating ?? null, notes: notes ?? null },
        })
      }

      return tx.book.findFirstOrThrow({ where: { id }, include: reviewInclude(ownerId) })
    })

    return flatten(row)
  }

  async delete(ownerId: string, id: string): Promise<void> {
    const exists = await prisma.book.findFirst({ where: { id, ownerId } })
    if (!exists) throw new Error('Book not found')
    // Review rows are removed by the onDelete: Cascade relation.
    await prisma.book.delete({ where: { id } })
  }
}
