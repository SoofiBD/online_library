import Link from 'next/link'
import { notFound } from 'next/navigation'
import BookForm from '@/components/BookForm'
import { updateBook } from '@/actions/books'
import { createBookService } from '@/lib/container'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBookPage({ params }: Props) {
  const { id } = await params
  const service = createBookService()
  const book = await service.getById(id)

  if (!book) notFound()

  const boundAction = updateBook.bind(null, id)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <header className="flex items-center gap-3 mb-6">
        <Link
          href={`/books/${id}`}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ← Back
        </Link>
        <h1 className="text-xl font-bold">Edit</h1>
      </header>
      <BookForm action={boundAction} book={book} />
    </div>
  )
}
