import "dotenv/config"
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL is not set')

const adapter = new PrismaLibSql({ url })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.user.upsert({
    where: { id: 'local-owner' },
    update: {},
    create: { id: 'local-owner', name: 'Local User' },
  })
  console.log('Seed complete: local-owner created.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
