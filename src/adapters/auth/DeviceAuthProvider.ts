import type { AuthProvider } from './AuthProvider'
import { resolveOwner, LOCAL_OWNER_ID } from '@/lib/auth/resolveOwner'

/**
 * Resolves the current user from a `x-device-id` header. Used in Phase 2 when
 * the phone (or any paired device) sends requests to the PC server. The header
 * is set by the client after the pairing flow completes.
 *
 * Falls back to LOCAL_OWNER_ID only when no device header is present at all
 * (single-user / LAN dev mode). A header naming an unknown/unpaired device is
 * rejected rather than silently granted local-owner access.
 */
export class DeviceAuthProvider implements AuthProvider {
  constructor(private readonly deviceId: string | null) {}

  async getCurrentUserId(): Promise<string> {
    if (!this.deviceId) return LOCAL_OWNER_ID

    const ownerId = await resolveOwner(this.deviceId)
    if (ownerId === null) {
      throw new Error('Unknown or unpaired device')
    }
    return ownerId
  }
}
