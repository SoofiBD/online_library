import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { corsJson, corsPreflight } from '@/lib/cors'
import { resolveOwner } from '@/lib/auth/resolveOwner'

// GET /api/sync/pull?since=<ISO timestamp>&limit=100
//
// Returns all SyncEvents newer than `since` for the authenticated owner.
// The client stores the latest event timestamp and uses it as `since` on the
// next poll — this is a simple long-polling / incremental sync strategy.
export async function GET(request: NextRequest) {
  try {
    const since = request.nextUrl.searchParams.get('since')
    const limit = Math.min(
      Number(request.nextUrl.searchParams.get('limit') ?? 100),
      500,
    )

    // Resolve owner from x-device-id header (falls back to local-owner when
    // the header is absent; rejected when it names an unknown device).
    const deviceId = request.headers.get('x-device-id')
    const ownerId = await resolveOwner(deviceId)
    if (ownerId === null) {
      return corsJson(request, { error: 'Unknown or unpaired device' }, { status: 401 })
    }

    const where: Record<string, unknown> = { ownerId }
    if (since) {
      where.createdAt = { gt: new Date(since) }
    }

    const events = await prisma.syncEvent.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit,
    })

    const lastTimestamp = events.length > 0
      ? events[events.length - 1].createdAt.toISOString()
      : since ?? null

    return corsJson(request, {
      events,
      lastTimestamp,
      hasMore: events.length === limit,
    })
  } catch (error) {
    console.error('[api/sync/pull] GET failed:', error)
    return corsJson(request, { error: 'Sync pull failed' }, { status: 500 })
  }
}

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}
