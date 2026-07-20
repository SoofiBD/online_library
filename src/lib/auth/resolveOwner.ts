import { prisma } from '@/lib/db'

/**
 * Resolves the owner id for a request's `x-device-id` header.
 *
 * Returns `null` when no deviceId is present, or when it's present but not a
 * paired device — callers must treat this as unauthenticated and reject the
 * request. No local-owner fallback: that access model ended with real
 * multi-user auth.
 */
export async function resolveOwner(deviceId: string | null): Promise<string | null> {
  if (!deviceId) return null

  const device = await prisma.device.findUnique({
    where: { deviceId },
    select: { ownerId: true },
  })

  if (!device) return null

  await prisma.device.update({
    where: { deviceId },
    data: { lastSeenAt: new Date() },
  })

  return device.ownerId
}
