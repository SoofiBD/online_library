import { prisma } from '@/lib/db'

// SyncEvent is an append-only log — left alone it grows forever. Events
// older than this are safe to drop because `/api/books` (not the sync log)
// is the source of truth; a client that's been offline longer than this
// window falls back to a full refetch instead of incremental sync (see
// `isResyncRequired` in sync/pull).
export const SYNC_EVENT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000

// Devices unseen this long are treated as abandoned (uninstalled app,
// replaced phone, etc.) and pruned so the Device table doesn't grow forever
// either. Re-pairing is cheap (pair/create + pair/claim) if the device comes
// back.
export const DEVICE_STALE_MS = 180 * 24 * 60 * 60 * 1000

/**
 * Opportunistic retention sweep for one owner, run inline on sync/push (same
 * pattern as the PairingCode sweep in pairing.ts) rather than a separate cron
 * job — cheap, and keeps both tables bounded without new infra.
 */
export async function sweepSyncRetention(ownerId: string): Promise<void> {
  const now = Date.now()
  await prisma.syncEvent.deleteMany({
    where: { ownerId, createdAt: { lt: new Date(now - SYNC_EVENT_RETENTION_MS) } },
  })
  await prisma.device.deleteMany({
    where: { ownerId, lastSeenAt: { lt: new Date(now - DEVICE_STALE_MS) } },
  })
}

/** True when `since` predates the retention window, i.e. events in that gap may have been pruned. */
export function isResyncRequired(since: Date): boolean {
  return since.getTime() < Date.now() - SYNC_EVENT_RETENTION_MS
}
