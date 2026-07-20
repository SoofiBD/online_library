import type { AuthProvider } from './AuthProvider'
import { resolveOwner } from '@/lib/auth/resolveOwner'

/**
 * Resolves the current user from a `x-device-id` header. Used in Phase 2 when
 * the phone (or any paired device) sends requests to the PC server. The header
 * is set by the client after the pairing flow completes.
 *
 * A missing, unknown, or unpaired device header is rejected — no implicit
 * local-owner fallback (that access model ended with real multi-user auth).
 */
export class DeviceAuthProvider implements AuthProvider {
  constructor(private readonly deviceId: string | null) {}

  async getCurrentUserId(): Promise<string> {
    const ownerId = await resolveOwner(this.deviceId)
    if (ownerId === null) {
      throw new Error('Unknown or unpaired device')
    }
    return ownerId
  }
}
