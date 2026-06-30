import "dotenv/config"
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

const adapter = new PrismaLibSql({ url })
const prisma = new PrismaClient({ adapter })

const OWNER = 'local-owner'

type Seed = {
  title: string
  author: string
  coverColor: string
  status: 'WANT_TO_READ' | 'READING' | 'READ'
  rating: number | null
  progress: number | null
  tags: string[]
  notes: string | null
}

const BOOKS: Seed[] = [
  { title: 'The Shadow of the Wind', author: 'Carlos Ruiz Zafón', coverColor: 'oxblood', status: 'READ', rating: 5, progress: 100, tags: ['Gothic', 'Mystery'], notes: 'A novel about novels — cursed authors, gothic Barcelona, and a boy who refuses to let a book die.' },
  { title: 'The Name of the Rose', author: 'Umberto Eco', coverColor: 'garnet', status: 'READING', rating: 4, progress: 62, tags: ['Mystery', 'Historical'], notes: 'A medieval monastery murder wrapped in semiotics. The labyrinth library is the real protagonist.' },
  { title: 'The Secret History', author: 'Donna Tartt', coverColor: 'forest', status: 'READING', rating: 5, progress: 34, tags: ['Dark Academia'], notes: 'A murder told backwards by the most pretentious classics students alive.' },
  { title: 'Jane Eyre', author: 'Charlotte Brontë', coverColor: 'emerald', status: 'READ', rating: 5, progress: 100, tags: ['Classic', 'Romance'], notes: 'Reader, I finished it on the train.' },
  { title: 'Norwegian Wood', author: 'Haruki Murakami', coverColor: 'amethyst', status: 'READ', rating: 4, progress: 100, tags: ['Literary'], notes: 'Quiet, melancholic, full of rain.' },
  { title: 'Pale Fire', author: 'Vladimir Nabokov', coverColor: 'sapphire', status: 'WANT_TO_READ', rating: null, progress: 0, tags: ['Experimental'], notes: null },
  { title: 'Possession', author: 'A. S. Byatt', coverColor: 'plum', status: 'WANT_TO_READ', rating: null, progress: 0, tags: ['Literary', 'Romance'], notes: null },
  { title: 'Gormenghast', author: 'Mervyn Peake', coverColor: 'amber', status: 'WANT_TO_READ', rating: null, progress: 0, tags: ['Fantasy'], notes: null },
]

async function main() {
  await prisma.user.upsert({
    where: { id: OWNER },
    update: {},
    create: { id: OWNER, name: 'Local User' },
  })

  const existing = await prisma.book.count({ where: { ownerId: OWNER } })
  if (existing > 0) {
    console.log(`Seed complete: local-owner exists, ${existing} books already present (skipped demo books).`)
    return
  }

  for (const b of BOOKS) {
    await prisma.book.create({
      data: {
        ownerId: OWNER,
        title: b.title,
        author: b.author,
        coverColor: b.coverColor,
        status: b.status,
        tags: {
          connectOrCreate: b.tags.map((name) => ({
            where: { ownerId_name: { ownerId: OWNER, name } },
            create: { ownerId: OWNER, name },
          })),
        },
        reviews:
          b.rating != null || b.notes != null || b.progress != null
            ? { create: { userId: OWNER, rating: b.rating, notes: b.notes, progress: b.progress } }
            : undefined,
      },
    })
  }

  console.log(`Seed complete: local-owner created with ${BOOKS.length} demo books.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
