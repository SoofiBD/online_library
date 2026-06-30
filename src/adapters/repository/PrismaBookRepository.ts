import { prisma } from '@/lib/db'
import type { Book, Review } from '@/generated/prisma/client'
import type {
  BookRepository,
  BookFilter,
  BookCreateData,
  BookUpdateData,
  BookWithReview,
} from './BookRepository'

type BookRow = Book & {
  reviews: Review[]
  tags: { id: string; name: string }[]
}

// Each query loads only the *current* user's review (there is at most one per
// (user, book)), then flattens its rating/notes/progress onto the book, plus
// the book's tags.
function reviewInclude(ownerId: string) {
  return {
    reviews: { where: { userId: ownerId } },
    tags: { select: { id: true, name: true } },
  } as const
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
    coverColor: row.coverColor,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    rating: review?.rating ?? null,
    notes: review?.notes ?? null,
    progress: review?.progress ?? null,
    tags: row.tags,
  }
}

export class PrismaBookRepository implements BookRepository {
  // Resolve a comma list of tag names to a Prisma relation write. `set: []`
  // first clears existing links so an edit reflects the exact submitted set,
  // then connect-or-create against the (ownerId, name) unique index reuses an
  // owner's existing tag or mints a new one. Returns undefined to leave the
  // relation untouched when no tags array was supplied.
  private tagConnect(ownerId: string, tags?: string[]) {
    if (!tags) return undefined
    const unique = Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean)))
    return {
      set: [],
      connectOrCreate: unique.map((name) => ({
        where: { ownerId_name: { ownerId, name } },
        create: { ownerId, name },
      })),
    }
  }

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
                { tags: { some: { name: { contains: filter.q } } } },
              ],
            }
          : {}),
      },
      include: reviewInclude(ownerId),
      orderBy: filter?.sort === 'title' ? { title: 'asc' } : { createdAt: 'desc' },
    })
    const flat = rows.map(flatten)
    // Rating lives on the joined review, so it can't drive a DB orderBy here;
    // sort in the app layer for the "highest rated" option.
    if (filter?.sort === 'rating') {
      flat.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    }
    return flat
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
    const { rating, notes, progress, tags, ...bookData } = data

    const row = await prisma.$transaction(async (tx) => {
      const book = await tx.book.create({
        data: { ...bookData, ownerId, tags: this.tagConnect(ownerId, tags) },
      })

      // Only create a Review when the user actually rated, wrote, or has progress.
      if (rating != null || notes != null || progress != null) {
        await tx.review.create({
          data: { userId: ownerId, bookId: book.id, rating: rating ?? null, notes: notes ?? null, progress: progress ?? null },
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
    const { rating, notes, progress, tags, ...bookData } = data

    const row = await prisma.$transaction(async (tx) => {
      const existing = await tx.book.findFirst({ where: { id, ownerId } })
      if (!existing) throw new Error('Book not found')

      await tx.book.update({
        where: { id },
        data: { ...bookData, ...(tags ? { tags: this.tagConnect(ownerId, tags) } : {}) },
      })

      // Keep the user's review in lock-step with the form. Upsert so the row is
      // created the first time the book is rated and updated thereafter. Only
      // touch the fields actually present in the submitted patch.
      if ('rating' in data || 'notes' in data || 'progress' in data) {
        await tx.review.upsert({
          where: { userId_bookId: { userId: ownerId, bookId: id } },
          create: { userId: ownerId, bookId: id, rating: rating ?? null, notes: notes ?? null, progress: progress ?? null },
          update: {
            ...('rating' in data ? { rating: rating ?? null } : {}),
            ...('notes' in data ? { notes: notes ?? null } : {}),
            ...('progress' in data ? { progress: progress ?? null } : {}),
          },
        })
      }

      return tx.book.findFirstOrThrow({ where: { id }, include: reviewInclude(ownerId) })
    })

    return flatten(row)
  }

  async upsertByIsbn(ownerId: string, data: BookCreateData): Promise<BookWithReview> {
    const { rating, notes, progress, tags, isbn, status, ...metadata } = data
    const tagWrite = this.tagConnect(ownerId, tags)

    const row = await prisma.$transaction(async (tx) => {
      // (b) Find-or-create the generic Book by its sanitized ISBN. With a real
      // ISBN we lean on the (ownerId, isbn) unique index for an atomic upsert;
      // a NULL isbn has no dedup key, so it is always a fresh manual entry.
      const book = isbn
        ? await tx.book.upsert({
            where: { ownerId_isbn: { ownerId, isbn } },
            create: { ...metadata, isbn, status: status ?? 'WANT_TO_READ', ownerId, tags: tagWrite },
            // Refresh catalog fields on re-scan; leave the user's `status` alone.
            update: { ...metadata, ...(tagWrite ? { tags: tagWrite } : {}) },
          })
        : await tx.book.create({
            data: { ...metadata, isbn: null, status: status ?? 'WANT_TO_READ', ownerId, tags: tagWrite },
          })

      // (c) Create-or-update the owner's Review. Skipped when the scan carried
      // no rating, notes, or progress, so a bare re-scan never wipes a prior review.
      if (rating != null || notes != null || progress != null) {
        await tx.review.upsert({
          where: { userId_bookId: { userId: ownerId, bookId: book.id } },
          create: { userId: ownerId, bookId: book.id, rating: rating ?? null, notes: notes ?? null, progress: progress ?? null },
          update: { rating: rating ?? null, notes: notes ?? null, progress: progress ?? null },
        })
      }

      return tx.book.findFirstOrThrow({ where: { id: book.id }, include: reviewInclude(ownerId) })
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
