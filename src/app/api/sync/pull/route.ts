import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { corsJson, corsPreflight } from '@/lib/cors'

// GET /api/sync/pull?since=<ISO timestamp>&limit=100
//
// Returns all SyncEvents newer than `since` for the authenticated owner.
// The client stores the latest event timestamp and uses it as `since` on the
// next poll — this is a simple long-polling / incremental sync strategy.
export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get('since')
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get('limit') ?? 100),
    500,
  )

  // Resolve owner from x-device-id header (falls back to local-owner)
  const deviceId = request.headers.get('x-device-id')
  const ownerId = await resolveOwner(deviceId)

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

  return corsJson({
    events,
    lastTimestamp,
    hasMore: events.length === limit,
  })
}

export function OPTIONS() {
  return corsPreflight()
}

async function resolveOwner(deviceId: string | null): Promise<string> {
  if (!deviceId) return 'local-owner'
  const device = await prisma.device.findUnique({
    where: { deviceId },
    select: { ownerId: true },
  })
  return device?.ownerId ?? 'local-owner'
}
