import { describe, it, expect, beforeEach } from 'vitest'
import { createHmac } from 'node:crypto'
import { createSessionToken, verifySessionToken } from './session'

beforeEach(() => {
  process.env.AUTH_SECRET = 'test-secret'
})

describe('createSessionToken / verifySessionToken', () => {
  it('round-trips a userId', () => {
    const token = createSessionToken('user-123')
    expect(verifySessionToken(token)).toBe('user-123')
  })

  it('rejects a tampered payload', () => {
    const token = createSessionToken('user-123')
    const [header, , signature] = token.split('.')
    const forgedBody = Buffer.from(
      JSON.stringify({ sub: 'someone-else', exp: Math.floor(Date.now() / 1000) + 60 }),
    ).toString('base64url')
    expect(verifySessionToken(`${header}.${forgedBody}.${signature}`)).toBeNull()
  })

  it('rejects an expired token', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
    const body = Buffer.from(
      JSON.stringify({ sub: 'user-123', exp: Math.floor(Date.now() / 1000) - 60 }),
    ).toString('base64url')
    // Re-sign with the same secret so only expiry causes rejection.
    const signature = createHmac('sha256', 'test-secret').update(`${header}.${body}`).digest('base64url')
    expect(verifySessionToken(`${header}.${body}.${signature}`)).toBeNull()
  })

  it('rejects a malformed token', () => {
    expect(verifySessionToken('not-a-token')).toBeNull()
  })
})
