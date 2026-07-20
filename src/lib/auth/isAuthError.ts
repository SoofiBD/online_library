const AUTH_ERROR_MESSAGES = new Set(['Not authenticated', 'Unknown or unpaired device'])

/** True for the errors thrown by SessionAuthProvider/DeviceAuthProvider — used to map them to a 401 instead of a 500. */
export function isAuthError(error: unknown): error is Error {
  return error instanceof Error && AUTH_ERROR_MESSAGES.has(error.message)
}
