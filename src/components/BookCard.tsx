import Image from 'next/image'
import Link from 'next/link'
import type { Book } from '@/generated/prisma/client'

const STATUS_LABELS: Record<string, string> = {
  WANT_TO_READ: 'Want to Read',
  READING: 'Reading',
  READ: 'Read',
}

export default function BookCard({ book }: { book: Book }) {
  const stars = book.rating
    ? Array.from({ length: 5 }, (_, i) => (i < book.rating! ? '★' : '☆')).join('')
    : null

  return (
    <Link
      href={`/books/${book.id}`}
      className="group flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-[0.99]"
    >
      <div className="w-12 h-16 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden transition-shadow group-hover:shadow-md">
        {book.coverPath ? (
          <Image
            src={book.coverPath}
            alt={book.title}
            width={48}
            height={64}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
            📖
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{book.title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {book.author ?? '—'}
        </p>
        <div className="flex items-center gap-2 mt-0.5 text-sm">
          {stars && <span className="text-amber-400 text-xs">{stars}</span>}
          <span className="text-gray-400 text-xs">{STATUS_LABELS[book.status]}</span>
        </div>
      </div>
    </Link>
  )
}
