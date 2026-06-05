import Link from 'next/link'
import BookForm from '@/components/BookForm'
import { createBook } from '@/actions/books'

export default function NewBookPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <header className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          ← Back
        </Link>
        <h1 className="text-xl font-bold">New Book</h1>
      </header>
      <BookForm action={createBook} />
    </div>
  )
}
