import Link from 'next/link'
import type { DiscoveredBook } from '@/services/DiscoveryService'

export default function DiscoverShelf({ discoveries }: { discoveries: DiscoveredBook[] }) {
  if (discoveries.length === 0) return null

  return (
    <div className="mb-9">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-[18px] h-0.5 bg-[color:var(--color-accent)] inline-block" />
        <span className="text-[11px] tracking-[3.5px] uppercase text-[color:var(--color-faint)]">
          Discover more
        </span>
      </div>
      <div
        className="grid gap-x-5 gap-y-6"
        style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}
      >
        {discoveries.map((book) => (
          <Link
            key={book.isbn || `${book.title}-${book.author}`}
            href={`/books/new?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author ?? '')}&isbn=${encodeURIComponent(book.isbn)}&cover=${encodeURIComponent(book.coverUrl ?? '')}`}
            className="block no-underline text-[color:var(--color-ink)] bg-[color:var(--color-card)] rounded-[11px] p-4 border border-[color:var(--color-line)] transition-transform hover:-translate-y-0.5 hover:border-[color:var(--color-accent)]"
          >
            <div className="font-serif-display font-medium text-[15px] leading-tight mb-0.5">{book.title}</div>
            <div className="text-[12.5px] text-[color:var(--color-muted)] mb-2">{book.author ?? 'Unknown'}</div>
            <div className="text-[11px] text-[color:var(--color-faint)] leading-snug">{book.reason}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
