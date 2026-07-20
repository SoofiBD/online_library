import type { AuthProvider } from './AuthProvider'
import { getSessionUserId } from '@/lib/auth/session'

/**
 * Resolves the current user from the httpOnly session cookie set by
 * /api/auth/login and /api/auth/signup. Used for browser (non-device)
 * requests once Phase 2 auth is wired into container.ts.
 */
export class SessionAuthProvider implements AuthProvider {
  async getCurrentUserId(): Promise<string> {
    const userId = await getSessionUserId()
    if (!userId) throw new Error('Not authenticated')
    return userId
  }
}
