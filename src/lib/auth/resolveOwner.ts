import { prisma } from '@/lib/db'

/** Single-user / LAN dev mode owner id — shared so it isn't duplicated per file. */
export const LOCAL_OWNER_ID = 'local-owner'

/**
 * Resolves the owner id for a request's `x-device-id` header.
 *
 * Returns `null` when a deviceId is present but not a paired device — callers
 * must treat this as unauthenticated and reject the request, rather than
 * falling back to LOCAL_OWNER_ID (that fallback let a spoofed/unknown device
 * header get full local-owner access).
 */
export async function resolveOwner(deviceId: string | null): Promise<string | null> {
  if (!deviceId) return LOCAL_OWNER_ID

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
