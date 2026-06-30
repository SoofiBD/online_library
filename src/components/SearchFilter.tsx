'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef } from 'react'

const CHIPS = [
  { value: '', label: 'All' },
  { value: 'WANT_TO_READ', label: 'Want to Read' },
  { value: 'READING', label: 'Reading' },
  { value: 'READ', label: 'Read' },
]

interface Props {
  q?: string
  status?: string
  sort?: string
  counts: Record<string, number>
}

export default function SearchFilter({ q, status, sort, counts }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function buildUrl(updates: { q?: string; status?: string; sort?: string }) {
    const params = new URLSearchParams()
    const nextQ = 'q' in updates ? updates.q : q
    const nextStatus = 'status' in updates ? updates.status : status
    const nextSort = 'sort' in updates ? updates.sort : sort
    if (nextQ) params.set('q', nextQ)
    if (nextStatus) params.set('status', nextStatus)
    if (nextSort && nextSort !== 'recent') params.set('sort', nextSort)
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(debounceRef.current)
    const value = e.target.value
    debounceRef.current = setTimeout(() => router.push(buildUrl({ q: value })), 300)
  }

  const fieldCls =
    'px-4 py-3 border border-[color:var(--color-line)] bg-[color:var(--color-card)] rounded-xl text-sm text-[color:var(--color-ink)] outline-none'

  return (
    <div className="mb-[34px]">
      <div className="flex items-center gap-3 flex-wrap mb-[18px]">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[color:var(--color-faint)] text-[15px]">⌕</span>
          <input
            type="search"
            defaultValue={q}
            onChange={handleSearch}
            placeholder="Search titles, authors, tags…"
            className={`${fieldCls} w-full pl-[38px] focus:border-[color:var(--color-accent)]`}
          />
        </div>
        <select
          defaultValue={sort ?? 'recent'}
          onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
          className={`${fieldCls} cursor-pointer text-[color:var(--color-muted)]`}
        >
          <option value="recent">Recently added</option>
          <option value="title">Title A–Z</option>
          <option value="rating">Highest rated</option>
        </select>
      </div>
      <div className="flex gap-2.5 flex-wrap">
        {CHIPS.map((chip) => {
          const active = (status ?? '') === chip.value
          const count = counts[chip.value] ?? 0
          return (
            <button
              key={chip.value}
              onClick={() => router.push(buildUrl({ status: chip.value }))}
              className="cursor-pointer text-[13px] font-semibold tracking-[.2px] px-[15px] py-2 rounded-full inline-flex items-center gap-[7px] transition-transform active:scale-95 border"
              style={
                active
                  ? { background: 'var(--color-accent)', color: 'var(--color-accent-fg)', borderColor: 'var(--color-accent)' }
                  : { background: 'transparent', color: '#5b4f40', borderColor: '#ddccb0' }
              }
            >
              {chip.label}
              <span className="text-[11px] opacity-70 font-bold">{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
