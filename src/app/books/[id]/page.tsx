import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createBookService } from '@/lib/container'
import { deleteBook } from '@/actions/books'

const STATUS_LABELS: Record<string, string> = {
  WANT_TO_READ: 'Okumak İstiyorum',
  READING: 'Okuyorum',
  READ: 'Okudum',
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function BookDetailPage({ params }: Props) {
  const { id } = await params
  const service = createBookService()
  const book = await service.getById(id)

  if (!book) notFound()

  const stars = book.rating
    ? Array.from({ length: 5 }, (_, i) => (i < book.rating! ? '★' : '☆')).join('')
    : null

  const boundDelete = deleteBook.bind(null, id)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <Link
        href="/"
        className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mb-6 inline-block"
      >
        ← Kütüphane
      </Link>

      <div className="flex gap-5 mb-6">
        <div className="w-28 h-40 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          {book.coverPath ? (
            <Image
              src={book.coverPath}
              alt={book.title}
              width={112}
              height={160}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📖</div>
          )}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <h1 className="text-xl font-bold mb-1 leading-tight">{book.title}</h1>
          {book.author && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{book.author}</p>
          )}
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
            {STATUS_LABELS[book.status]}
          </p>
          {stars && <p className="text-amber-400 text-sm">{stars}</p>}
        </div>
      </div>

      {book.notes && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Notlar
          </h2>
          <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">
            {book.notes}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Link
          href={`/books/${id}/edit`}
          className="flex-1 text-center bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          Düzenle
        </Link>
        <form action={boundDelete}>
          <button
            type="submit"
            className="px-5 py-2.5 border border-red-300 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg font-medium text-sm transition-colors"
            onClick={(e) => {
              if (!confirm('Bu kitabı silmek istediğine emin misin?')) {
                e.preventDefault()
              }
            }}
          >
            Sil
          </button>
        </form>
      </div>
    </div>
  )
}
