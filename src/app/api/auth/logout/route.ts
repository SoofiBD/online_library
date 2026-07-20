import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/auth/session'

// POST /api/auth/logout -> clear the session cookie.
export async function POST() {
  await clearSessionCookie()
  return NextResponse.json({ ok: true })
}
