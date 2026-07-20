import type { NextRequest } from 'next/server'
import { corsJson, corsPreflight, requireValidOrigin } from '@/lib/cors'
import { generatePairingCode } from '@/lib/auth/pairing'
import { getSessionUserId } from '@/lib/auth/session'

// POST /api/pair/create — generate a pairing code for the authenticated owner.
// Codes live in the PairingCode table (survives process restarts) rather
// than an in-memory Map.
export async function POST(request: NextRequest) {
  const originError = requireValidOrigin(request)
  if (originError) return originError

  const ownerId = await getSessionUserId()
  if (!ownerId) {
    return corsJson(request, { error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { code, expiresIn } = await generatePairingCode(ownerId)
    return corsJson(request, { code, expiresIn })
  } catch (error) {
    console.error('[api/pair/create] POST failed:', error)
    return corsJson(request, { error: 'Could not create pairing code' }, { status: 500 })
  }
}

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}
