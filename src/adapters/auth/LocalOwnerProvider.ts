import type { AuthProvider } from './AuthProvider'
import { LOCAL_OWNER_ID } from '@/lib/auth/resolveOwner'

export class LocalOwnerProvider implements AuthProvider {
  async getCurrentUserId(): Promise<string> {
    return LOCAL_OWNER_ID
  }
}
