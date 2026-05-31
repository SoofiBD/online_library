'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useRef } from 'react'

const STATUSES = [
  { value: '', label: 'Tümü' },
  { value: 'WANT_TO_READ', label: 'Okumak İst.' },
  { value: 'READING', label: 'Okuyor' },
  { value: 'READ', label: 'Okudu' },
]

interface Props {
  q?: string
  status?: string
}

export default function SearchFilter({ q, status }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  function buildUrl(updates: { q?: string; status?: string }) {
    const params = new URLSearchParams()
    const nextQ = 'q' in updates ? updates.q : q
    const nextStatus = 'status' in updates ? updates.status : status
    if (nextQ) params.set('q', nextQ)
    if (nextStatus) params.set('status', nextStatus)
    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(debounceRef.current)
    const value = e.target.value
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ q: value }))
    }, 300)
  }

  function handleStatus(value: string) {
    router.push(buildUrl({ status: value }))
  }

  return (
    <div className="mb-4 space-y-3">
      <input
        type="search"
        defaultValue={q}
        onChange={handleSearch}
        placeholder="Kitap veya yazar ara..."
        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
      />
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => handleStatus(s.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              (status ?? '') === s.value
                ? 'bg-amber-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
