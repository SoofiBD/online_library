import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { corsJson, corsPreflight, requireValidOrigin } from '@/lib/cors'
import { claimPairingCode } from '../create/route'

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

  try {
    const body = await request.json()
    const { code, deviceId, name } = body ?? {}

    if (!code || !deviceId) {
      return corsJson(
        request,
        { error: 'Missing required fields: code, deviceId' },
        { status: 400 },
      )
    }

    const result = claimPairingCode(String(code))
    if (!result) {
      return corsJson(
        request,
        { error: 'Invalid or expired pairing code' },
        { status: 401 },
      )
    }

    // Upsert: a device may re-pair (e.g. after clearing localStorage)
    const device = await prisma.device.upsert({
      where: { deviceId: String(deviceId) },
      create: {
        deviceId: String(deviceId),
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
