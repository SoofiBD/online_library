import { randomInt } from 'node:crypto'
import { prisma } from '@/lib/db'

const CODE_TTL_MS = 5 * 60 * 1000

export async function generatePairingCode(ownerId: string): Promise<{ code: string; expiresIn: number }> {
  // Sweep expired codes on every create — cheap, and keeps the table from
  // growing unbounded without needing a separate cron job.
  await prisma.pairingCode.deleteMany({ where: { expiresAt: { lt: new Date() } } })

  // 6-digit numeric code. crypto.randomInt is a CSPRNG — Math.random() is
  // predictable and must not be used for anything auth-adjacent.
  const code = String(randomInt(100000, 1000000))
  const expiresAt = new Date(Date.now() + CODE_TTL_MS)
  await prisma.pairingCode.create({ data: { code, ownerId, expiresAt } })
  return { code, expiresIn: CODE_TTL_MS / 1000 }
}

export async function claimPairingCode(code: string): Promise<{ ownerId: string } | null> {
  const pending = await prisma.pairingCode.findUnique({ where: { code } })
  if (!pending) return null

  // Single-use either way: expired or not, the code is consumed on this claim
  // attempt so it can't be retried.
  await prisma.pairingCode.delete({ where: { code } })
  if (pending.expiresAt < new Date()) return null

  return { ownerId: pending.ownerId }
}
