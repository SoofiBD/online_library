import type { Book } from '@/generated/prisma/client'
import BookCard from './BookCard'

export default function BookList({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-5xl mb-4">📚</p>
        <p className="text-sm">Henüz kitap yok. İlk kitabını ekle!</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}
