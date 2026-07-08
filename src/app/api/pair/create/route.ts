import type { NextRequest } from 'next/server'
import { randomInt } from 'crypto'
import { corsJson, corsPreflight, requireValidOrigin } from '@/lib/cors'
import { LOCAL_OWNER_ID } from '@/lib/auth/resolveOwner'

// In-memory store for pending pairing codes. In production this would be a DB
// table; for LAN-dev usage a Map is fine — codes live ≤5 minutes.
const pendingCodes = new Map<string, { ownerId: string; expiresAt: number }>()

export function generatePairingCode(ownerId: string): string {
  // 6-digit numeric code. crypto.randomInt is a CSPRNG — Math.random() is
  // predictable and must not be used for anything auth-adjacent.
  const code = String(randomInt(100000, 1000000))
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
export async function POST(request: NextRequest) {
  const originError = requireValidOrigin(request)
  if (originError) return originError

  try {
    // In single-user mode, always pair to the local owner.
    const code = generatePairingCode(LOCAL_OWNER_ID)
    return corsJson(request, { code, expiresIn: 300 }) // 5 minutes in seconds
  } catch (error) {
    console.error('[api/pair/create] POST failed:', error)
    return corsJson(request, { error: 'Could not create pairing code' }, { status: 500 })
  }
}

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}
