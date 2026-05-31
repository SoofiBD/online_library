import { prisma } from '@/lib/db'
import type { BookRepository, BookFilter, BookCreateData, BookUpdateData } from './BookRepository'
import type { Book } from '@/generated/prisma/client'

export class PrismaBookRepository implements BookRepository {
  async list(ownerId: string, filter?: BookFilter): Promise<Book[]> {
    return prisma.book.findMany({
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
      orderBy: { createdAt: 'desc' },
    })
  }

  async getById(ownerId: string, id: string): Promise<Book | null> {
    return prisma.book.findFirst({ where: { id, ownerId } })
  }

  async create(ownerId: string, data: BookCreateData): Promise<Book> {
    return prisma.book.create({ data: { ...data, ownerId } })
  }

  async update(ownerId: string, id: string, data: BookUpdateData): Promise<Book> {
    const exists = await this.getById(ownerId, id)
    if (!exists) throw new Error('Kitap bulunamadı')
    return prisma.book.update({ where: { id }, data })
  }

  async delete(ownerId: string, id: string): Promise<void> {
    const exists = await this.getById(ownerId, id)
    if (!exists) throw new Error('Kitap bulunamadı')
    await prisma.book.delete({ where: { id } })
  }
}
