import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { corsJson, corsPreflight } from '@/lib/cors'

// POST /api/sync/push
//
// Accepts an array of local SyncEvents and persists them. Returns which events
// were accepted and any conflicts (where the server version is newer).
//
// Body: { events: Array<{ entityType, entityId, action, payload, version }> }
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { events } = body ?? {}

  if (!Array.isArray(events) || events.length === 0) {
    return corsJson(
      { error: 'Missing or empty events array' },
      { status: 400 },
    )
  }

  const deviceId = request.headers.get('x-device-id')
  const ownerId = await resolveOwner(deviceId)

  const accepted: string[] = []
  const conflicts: Array<{ entityType: string; entityId: string; serverVersion: number }> = []

  for (const event of events) {
    const { entityType, entityId, action, payload, version } = event ?? {}
    if (!entityType || !entityId || !action) continue

    // Check for version conflict: if a newer event exists for this entity,
    // reject the incoming one (last-write-wins).
    const latest = await prisma.syncEvent.findFirst({
      where: { ownerId, entityType, entityId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })

    if (latest && (version ?? 0) <= latest.version) {
      conflicts.push({
        entityType,
        entityId,
        serverVersion: latest.version,
      })
      continue
    }

    await prisma.syncEvent.create({
      data: {
        ownerId,
        entityType,
        entityId,
        action,
        payload: payload ?? null,
        version: (latest?.version ?? 0) + 1,
      },
    })

    accepted.push(entityId)
  }

  return corsJson({
    accepted: accepted.length,
    conflicts,
    total: events.length,
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
