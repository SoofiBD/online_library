import Link from 'next/link'
import BookCover3D from './BookCover3D'
import StarFraction from './StarFraction'
import { statusOf, locationOf } from '@/lib/theme/covers'
import type { BookWithReview } from '@/adapters/repository/BookRepository'

export default function BookCard({ book }: { book: BookWithReview }) {
  const st = statusOf(book.status)
  const loc = locationOf(book.location)
  return (
    <Link
      href={`/books/${book.id}`}
      className="bc3d-hover block text-center cursor-pointer no-underline text-[color:var(--color-ink)]"
    >
      <div className="mb-4">
        <BookCover3D
          colorKey={book.coverColor}
          title={book.title}
          author={book.author}
          image={book.coverPath}
          size="grid"
        />
      </div>
      <div className="font-serif-display font-medium text-[15px] leading-tight mb-0.5">{book.title}</div>
      <div className="text-[12.5px] text-[color:var(--color-muted)] mb-1.5">{book.author ?? 'Unknown'}</div>
      <div className="flex items-center justify-center gap-2">
        <StarFraction rating={book.rating} size={12} />
        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: st.color }}>
          {st.label}
        </span>
        <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: loc.color }}>
          · {loc.label}
        </span>
      </div>
      {book.status === 'READING' && (
        <div className="w-[74px] h-1 rounded-[3px] bg-[#e6dac4] mx-auto mt-2 overflow-hidden">
          <div
            className="h-full rounded-[3px] origin-left"
            style={{ background: st.color, width: `${book.progress ?? 0}%`, animation: 'barGrow 1s cubic-bezier(.2,.7,.2,1) both' }}
          />
        </div>
      )}
    </Link>
  )
}
