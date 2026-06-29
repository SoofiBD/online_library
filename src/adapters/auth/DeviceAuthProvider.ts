import { prisma } from '@/lib/db'
import type { AuthProvider } from './AuthProvider'

/**
 * Resolves the current user from a `x-device-id` header. Used in Phase 2 when
 * the phone (or any paired device) sends requests to the PC server. The header
 * is set by the client after the pairing flow completes.
 *
 * Falls back to `LocalOwnerProvider` behaviour when no device header is present
 * (single-user / LAN dev mode).
 */
export class DeviceAuthProvider implements AuthProvider {
  constructor(private readonly deviceId: string | null) {}

  async getCurrentUserId(): Promise<string> {
    if (!this.deviceId) return 'local-owner'

    const device = await prisma.device.findUnique({
      where: { deviceId: this.deviceId },
      select: { ownerId: true },
    })

    if (!device) {
      console.warn(`[auth] unknown deviceId "${this.deviceId}", falling back to local-owner`)
      return 'local-owner'
    }

    // Touch lastSeenAt so we know the device is alive
    await prisma.device.update({
      where: { deviceId: this.deviceId },
      data: { lastSeenAt: new Date() },
    })

    return device.ownerId
  }
}
