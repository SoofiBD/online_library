import type { AuthProvider } from './AuthProvider'

export class LocalOwnerProvider implements AuthProvider {
  async getCurrentUserId(): Promise<string> {
    return 'local-owner'
  }
}
