import type { BookStatus } from '@/generated/prisma/client'

export const COVERS = {
  oxblood:  { bg: 'linear-gradient(160deg,#7a2630,#591820 60%,#451218)', spine: '#3a0f15', foil: '#e7c982' },
  garnet:   { bg: 'linear-gradient(160deg,#8a2b34,#5f1c23)', spine: '#43121a', foil: '#ecc97f' },
  garnet2:  { bg: 'linear-gradient(160deg,#6f2530,#4a161e)', spine: '#340f15', foil: '#ecc97f' },
  emerald:  { bg: 'linear-gradient(160deg,#246a4f,#15402f)', spine: '#0f3023', foil: '#ecd79a' },
  forest:   { bg: 'linear-gradient(160deg,#2f4a33,#1c3020)', spine: '#142413', foil: '#e3d49a' },
  teal:     { bg: 'linear-gradient(160deg,#1f6363,#11403f)', spine: '#0c2e2d', foil: '#d7ecdf' },
  sapphire: { bg: 'linear-gradient(160deg,#2f5685,#1d3a5c)', spine: '#152a44', foil: '#dfe7f2' },
  amethyst: { bg: 'linear-gradient(160deg,#54407e,#382651)', spine: '#2a1b40', foil: '#e6d6f0' },
  plum:     { bg: 'linear-gradient(160deg,#73305a,#481e39)', spine: '#34132a', foil: '#f0d6e6' },
  amber:    { bg: 'linear-gradient(160deg,#8a5a22,#5d3a14)', spine: '#3e2710', foil: '#f3e2b0' },
} as const

export type CoverKey = keyof typeof COVERS
export const COVER_KEYS = Object.keys(COVERS) as CoverKey[]

export function coverOf(key: string | null | undefined) {
  return key && key in COVERS ? COVERS[key as CoverKey] : COVERS.garnet
}

export const STATUS: Record<BookStatus, { label: string; color: string; soft: string }> = {
  WANT_TO_READ: { label: 'Want to Read', color: '#345b86', soft: '#e6edf5' },
  READING:      { label: 'Reading', color: '#a8432f', soft: '#f6e7e1' },
  READ:         { label: 'Read', color: '#2f6b50', soft: '#e3efe7' },
}

export function statusOf(status: BookStatus) {
  return STATUS[status] ?? STATUS.WANT_TO_READ
}

export function progressForStatus(status: BookStatus, current?: number | null): number {
  if (status === 'READ') return 100
  if (status === 'WANT_TO_READ') return 0
  return current && current > 0 && current < 100 ? current : 15
}

export const STATUS_ORDER: BookStatus[] = ['WANT_TO_READ', 'READING', 'READ']

export function nextStatus(status: BookStatus): BookStatus {
  return STATUS_ORDER[(STATUS_ORDER.indexOf(status) + 1) % STATUS_ORDER.length]
}
