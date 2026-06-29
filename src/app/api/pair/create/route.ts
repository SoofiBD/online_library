import { prisma } from '@/lib/db'
import { corsJson, corsPreflight } from '@/lib/cors'

// In-memory store for pending pairing codes. In production this would be a DB
// table; for LAN-dev usage a Map is fine — codes live ≤5 minutes.
const pendingCodes = new Map<string, { ownerId: string; expiresAt: number }>()

export function generatePairingCode(ownerId: string): string {
  // 6-digit numeric code
  const code = String(Math.floor(100000 + Math.random() * 900000))
  pendingCodes.set(code, {
    ownerId,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  })
  return code
}

export function claimPairingCode(
  code: string,
): { ownerId: string } | null {
  const pending = pendingCodes.get(code)
  if (!pending) return null
  if (Date.now() > pending.expiresAt) {
    pendingCodes.delete(code)
    return null
  }
  pendingCodes.delete(code)
  return { ownerId: pending.ownerId }
}

// POST /api/pair/create — generate a pairing code for the local owner
export async function POST() {
  // In single-user mode, always pair to "local-owner"
  const code = generatePairingCode('local-owner')
  return corsJson({ code, expiresIn: 300 }) // 5 minutes in seconds
}

export function OPTIONS() {
  return corsPreflight()
}
