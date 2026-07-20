import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

// jose is unreachable in this environment (npm registry blocked), so the
// session token is a minimal hand-rolled HMAC-signed JWT — same tradeoff
// already made for password hashing, see src/lib/auth/password.ts.
export const SESSION_COOKIE = 'session'
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 days

interface SessionPayload {
  sub: string // userId
  exp: number // unix seconds
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET env var is not set')
  return secret
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function sign(data: string): string {
  return createHmac('sha256', getSecret()).update(data).digest('base64url')
}

export function createSessionToken(userId: string): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload: SessionPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  }
  const body = base64url(JSON.stringify(payload))
  const signature = sign(`${header}.${body}`)
  return `${header}.${body}.${signature}`
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [header, body, signature] = parts

  const expected = sign(`${header}.${body}`)
  const expectedBuf = Buffer.from(expected)
  const actualBuf = Buffer.from(signature)
  if (expectedBuf.length !== actualBuf.length) return null
  if (!timingSafeEqual(expectedBuf, actualBuf)) return null

  let payload: SessionPayload
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (typeof payload.sub !== 'string' || typeof payload.exp !== 'number') return null
  if (payload.exp < Math.floor(Date.now() / 1000)) return null

  return payload.sub
}

export async function setSessionCookie(userId: string): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}
