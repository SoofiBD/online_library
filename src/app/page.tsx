import Link from 'next/link'
import { Suspense } from 'react'
import { createBookService } from '@/lib/container'
import AnimatedBookList from '@/components/AnimatedBookList'
import SearchFilter from '@/components/SearchFilter'
import type { BookStatus } from '@/generated/prisma/client'

const VALID_STATUSES = new Set(['WANT_TO_READ', 'READING', 'READ'])

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams
  const status =
    params.status && VALID_STATUSES.has(params.status)
      ? (params.status as BookStatus)
      : undefined

  const service = createBookService()
  const books = await service.list({ q: params.q, status })

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Biblio</h1>
        <Link
          href="/books/new"
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition active:scale-95"
        >
          + Ekle
        </Link>
      </header>
      <Suspense>
        <SearchFilter q={params.q} status={params.status} />
      </Suspense>
      <AnimatedBookList books={books} />
    </div>
  )
}
