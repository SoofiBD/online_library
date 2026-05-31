export interface AuthProvider {
  getCurrentUserId(): Promise<string>
}
