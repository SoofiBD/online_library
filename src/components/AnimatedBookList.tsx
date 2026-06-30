'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import type { BookWithReview } from '@/adapters/repository/BookRepository'
import BookCard from './BookCard'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

export default function AnimatedBookList({ books }: { books: BookWithReview[] }) {
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
      <div className="text-center py-[70px] px-5 text-[color:var(--color-faint)]">
        <div className="text-[40px] mb-2.5 opacity-50">❧</div>
        <div className="font-serif-display italic text-xl text-[#6f6253]">No volumes on this shelf yet.</div>
        <div className="text-[13.5px] mt-1.5">Try another search, or add a new book.</div>
      </div>
    )
  }

  return (
    <div
      ref={container}
      className="grid gap-x-5 gap-y-10"
      style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(158px,1fr))' }}
    >
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  )
}
