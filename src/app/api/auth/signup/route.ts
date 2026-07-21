import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { setSessionCookie } from '@/lib/auth/session'
import { signupSchema } from '@/lib/schemas'
import { clientIp, isRateLimited } from '@/lib/rateLimit'

// POST /api/auth/signup -> create a new account and start a session.
export async function POST(request: NextRequest) {
  if (isRateLimited(`signup:${clientIp(request)}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Too many attempts, try again later' }, { status: 429 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = signupSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { email, password, name } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const user = await prisma.user.create({
    data: { email, passwordHash: hashPassword(password), name: name ?? null },
    select: { id: true },
  })

  await setSessionCookie(user.id)
  return NextResponse.json({ id: user.id, email }, { status: 201 })
}
