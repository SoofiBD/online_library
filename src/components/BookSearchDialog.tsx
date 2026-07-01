'use client'

import { useState } from 'react'

interface Candidate {
  isbn: string
  title: string
  author: string | null
  publisher: string | null
  publishedYear: number | null
  coverUrl: string | null
  source: string
}

interface Props {
  onSelect: (result: Candidate) => void
}

export default function BookSearchDialog({ onSelect }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  async function runSearch() {
    if (!q.trim()) return
    setLoading(true)
    setSearched(true)
    setFetchError(false)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setFetchError(true)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
          placeholder="Title or author…"
          className="flex-1 px-4 py-3 border border-[color:var(--color-line)] bg-[color:var(--color-card)] rounded-xl text-sm outline-none"
        />
        <button
          onClick={runSearch}
          disabled={loading}
          className="px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {fetchError && !loading && (
        <p className="text-sm text-[color:var(--color-muted)]">Search failed, try again.</p>
      )}
      {searched && !loading && !fetchError && results.length === 0 && (
        <p className="text-sm text-[color:var(--color-muted)]">No matches found.</p>
      )}

      <ul className="flex flex-col gap-2">
        {results.map((r, i) => (
          <li key={`${r.isbn}-${i}`}>
            <button
              onClick={() => onSelect(r)}
              className="w-full flex gap-3 items-center text-left p-2 rounded-xl border border-[color:var(--color-line)] hover:border-[color:var(--color-accent)]"
            >
              {r.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.coverUrl} alt="" className="w-10 h-14 object-cover rounded" />
              ) : (
                <div className="w-10 h-14 rounded bg-[color:var(--color-line)]" />
              )}
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{r.title}</span>
                <span className="text-xs text-[color:var(--color-muted)]">
                  {[r.author, r.publishedYear].filter(Boolean).join(' · ')}
                </span>
                <span className="text-[10px] uppercase opacity-60">{r.source}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
