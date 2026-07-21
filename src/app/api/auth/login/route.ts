import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { setSessionCookie } from '@/lib/auth/session'
import { loginSchema } from '@/lib/schemas'
import { clientIp, isRateLimited } from '@/lib/rateLimit'

// POST /api/auth/login -> verify credentials and start a session.
export async function POST(request: NextRequest) {
  if (isRateLimited(`login:${clientIp(request)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts, try again later' }, { status: 429 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = loginSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  })

  // Same "Invalid email or password" message either way — don't reveal
  // whether the account exists.
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  await setSessionCookie(user.id)
  return NextResponse.json({ id: user.id })
}
