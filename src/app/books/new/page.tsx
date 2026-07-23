'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import BookForm from '@/components/BookForm'
import BookSearchDialog from '@/components/BookSearchDialog'
import { createBook } from '@/actions/books'
import FadeIn from '@/components/FadeIn'

interface Candidate {
  isbn: string
  title: string
  author: string | null
  publisher: string | null
  publishedYear: number | null
  coverUrl: string | null
  source: string
}

export default function NewBookPage() {
  return (
    <Suspense fallback={null}>
      <NewBookPageInner />
    </Suspense>
  )
}

function NewBookPageInner() {
  const searchParams = useSearchParams()
  const queryPrefill = (() => {
    const title = searchParams.get('title')
    if (!title) return null
    return {
      isbn: searchParams.get('isbn') ?? '',
      title,
      author: searchParams.get('author'),
      publisher: null,
      publishedYear: null,
      coverUrl: searchParams.get('cover'),
      source: 'discovery',
    } as Candidate
  })()
  const [prefill, setPrefill] = useState<Candidate | null>(queryPrefill)

  return (
    <div className="px-[clamp(14px,4vw,40px)] pt-[clamp(18px,4vw,46px)] pb-[90px]">
      <div className="max-w-[880px] mx-auto">
        <FadeIn>
          <Link
            href="/"
            className="text-[13.5px] font-semibold tracking-[.3px] text-[color:var(--color-muted)] no-underline mb-[22px] inline-block hover:text-[color:var(--color-accent)]"
          >
            ← Cancel
          </Link>
          <h1 className="font-serif-display font-semibold text-[clamp(28px,5vw,40px)] leading-[1.05] tracking-[-.5px] mb-[30px]">Add to your library</h1>

          <div className="mb-[30px]">
            <h2 className="text-[13.5px] font-bold tracking-[.5px] text-[#6f6253] mb-[14px]">SEARCH BY TITLE OR AUTHOR</h2>
            <BookSearchDialog onSelect={setPrefill} />
          </div>

          <BookForm
            key={prefill?.isbn ?? prefill?.title ?? 'blank'}
            action={createBook}
            initialTitle={prefill?.title}
            initialAuthor={prefill?.author ?? undefined}
            initialCoverUrl={prefill?.coverUrl ?? undefined}
          />
        </FadeIn>
      </div>
    </div>
  )
}
