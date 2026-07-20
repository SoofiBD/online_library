import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session'

// Renamed from `middleware.ts` in this Next version — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
// Runs on the Node.js runtime by default (v15.5+), so node:crypto session
// verification works here without an Edge-compatible rewrite.
//
// Protects browser page routes. API routes are excluded — each one resolves
// its own auth (session cookie or `x-device-id`) via container.ts and
// returns 401 itself; the scanner/companion client can't follow redirects.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const userId = token ? verifySessionToken(token) : null
  if (userId) return NextResponse.next()

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', request.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!api|login|signup|_next/static|_next/image|uploads|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
