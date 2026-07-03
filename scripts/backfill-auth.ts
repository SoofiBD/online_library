import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { hashPassword } from '../src/lib/auth/password'

const OLD_OWNER_ID = 'local-owner'

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  const email = process.env.BACKFILL_OWNER_EMAIL
  const password = process.env.BACKFILL_OWNER_PASSWORD
  if (!email || !password) {
    throw new Error('BACKFILL_OWNER_EMAIL and BACKFILL_OWNER_PASSWORD must be set')
  }

  const adapter = new PrismaLibSql({ url })
  const prisma = new PrismaClient({ adapter })

  const existing = await prisma.user.findUnique({ where: { id: OLD_OWNER_ID } })
  if (!existing) {
    console.log(`No '${OLD_OWNER_ID}' user found — nothing to backfill.`)
    await prisma.$disconnect()
    return
  }

  const passwordHash = hashPassword(password)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: OLD_OWNER_ID },
      data: { email, passwordHash },
    }),
  ])

  console.log(`Backfilled credentials for user '${OLD_OWNER_ID}' (email set to ${email}).`)
  console.log('ownerId literal is unchanged — Book/Review/Tag/Device/SyncEvent already reference this id, so no further UPDATE is needed.')

  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
