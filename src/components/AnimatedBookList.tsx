'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import type { Book } from '@/generated/prisma/client'
import BookCard from './BookCard'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

export default function AnimatedBookList({ books }: { books: Book[] }) {
  const container = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !container.current) return
      gsap.from(container.current.children, {
        opacity: 0,
        y: 12,
        duration: DURATION,
        ease: EASE,
        stagger: STAGGER,
      })
    },
    { scope: container, dependencies: [books] },
  )

  if (books.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-5xl mb-4">📚</p>
        <p className="text-sm">No books yet. Add your first book!</p>
      </div>
    )
  }

  return (
    <div
      ref={container}
      className="divide-y divide-gray-100 dark:divide-gray-800"
    >
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}
