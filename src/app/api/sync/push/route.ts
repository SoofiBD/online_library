import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { corsJson, corsPreflight, requireValidOrigin } from '@/lib/cors'
import { resolveOwner } from '@/lib/auth/resolveOwner'

// POST /api/sync/push
//
// Accepts an array of local SyncEvents and persists them. Returns which events
// were accepted and any conflicts (where the server version is newer).
//
// Body: { events: Array<{ entityType, entityId, action, payload, version }> }
export async function POST(request: NextRequest) {
  const originError = requireValidOrigin(request)
  if (originError) return originError

  try {
    const body = await request.json()
    const { events } = body ?? {}

    if (!Array.isArray(events) || events.length === 0) {
      return corsJson(
        request,
        { error: 'Missing or empty events array' },
        { status: 400 },
      )
    }

    const deviceId = request.headers.get('x-device-id')
    const ownerId = await resolveOwner(deviceId)
    if (ownerId === null) {
      return corsJson(request, { error: 'Unknown or unpaired device' }, { status: 401 })
    }

    const accepted: string[] = []
    const conflicts: Array<{ entityType: string; entityId: string; serverVersion: number }> = []

    for (const event of events) {
      const { entityType, entityId, action, payload, version } = event ?? {}
      if (!entityType || !entityId || !action) continue

      // findFirst + create must run inside one transaction — otherwise two
      // concurrent pushes for the same entity can both read the same "latest"
      // version and both create, silently dropping one as a lost update.
      const outcome = await prisma.$transaction(async (tx) => {
        const latest = await tx.syncEvent.findFirst({
          where: { ownerId, entityType, entityId },
          orderBy: { version: 'desc' },
          select: { version: true },
        })

        if (latest && (version ?? 0) <= latest.version) {
          return { conflict: { entityType, entityId, serverVersion: latest.version } }
        }

        await tx.syncEvent.create({
          data: {
            ownerId,
            entityType,
            entityId,
            action,
            payload: payload ?? null,
            version: (latest?.version ?? 0) + 1,
          },
        })

        return { acceptedId: entityId as string }
      })

      if (outcome.conflict) {
        conflicts.push(outcome.conflict)
      } else if (outcome.acceptedId) {
        accepted.push(outcome.acceptedId)
      }
    }

    return corsJson(request, {
      accepted: accepted.length,
      conflicts,
      total: events.length,
    })
  } catch (error) {
    console.error('[api/sync/push] POST failed:', error)
    return corsJson(request, { error: 'Sync push failed' }, { status: 500 })
  }
}

export function OPTIONS(request: NextRequest) {
  return corsPreflight(request)
}
