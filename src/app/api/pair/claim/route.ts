import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { corsJson, corsPreflight, requireValidOrigin } from '@/lib/cors'
import { claimPairingCode } from '@/lib/auth/pairing'
import { clientIp, isRateLimited } from '@/lib/rateLimit'
import { claimPairingCodeSchema } from '@/lib/schemas'

// POST /api/pair/claim — exchange a 6-digit code for a device binding
//
// Body: { code: string, deviceId: string, name?: string }
//
// On success the server creates a Device record linking the client-generated
// deviceId to the owner. Subsequent requests from this device should send
// `x-device-id: <deviceId>` so the device-auth resolver can identify them.
export async function POST(request: NextRequest) {
  const originError = requireValidOrigin(request)
  if (originError) return originError

  // Tight per-IP throttle: the code is only a 6-digit/1M keyspace, so this is
  // the main defense against brute-forcing it within its 5-minute expiry.
  if (isRateLimited(`pair-claim:${clientIp(request)}`, 10, 60_000)) {
    return corsJson(request, { error: 'Too many attempts, try again later' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const parsed = claimPairingCodeSchema.safeParse(body)

    if (!parsed.success) {
      return corsJson(
        request,
        { error: 'Validation failed', issues: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { code, deviceId, name } = parsed.data

    const result = await claimPairingCode(code)
    if (!result) {
      return corsJson(
        request,
        { error: 'Invalid or expired pairing code' },
        { status: 401 },
      )
    }

    // Upsert: a device may re-pair (e.g. after clearing localStorage)
    const device = await prisma.device.upsert({
      where: { deviceId },
      create: {
        deviceId,
        ownerId: result.ownerId,
        name: name ?? null,
      },
      update: {
        name: name ?? undefined,
        lastSeenAt: new Date(),
      },
      select: { id: true, deviceId: true, name: true, pairedAt: true },
    })

    return corsJson(request, { success: true, device })
  } catch (error) {
    console.error('[api/pair/claim] POST failed:', error)
    return corsJson(request, { error: 'Could not claim pairing code' }, { status: 500 })
  }
}

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}
