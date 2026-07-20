import Link from 'next/link'
import { Suspense } from 'react'
import { createBookService } from '@/lib/container'
import { SessionAuthProvider } from '@/adapters/auth/SessionAuthProvider'
import AnimatedBookList from '@/components/AnimatedBookList'
import SearchFilter from '@/components/SearchFilter'
import FadeIn from '@/components/FadeIn'
import ThemeToggle from '@/components/ThemeToggle'
import type { BookStatus } from '@/generated/prisma/client'

const VALID_STATUSES = new Set(['WANT_TO_READ', 'READING', 'READ'])
const VALID_SORTS = new Set(['recent', 'title', 'rating'])

interface Props {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams
  const status =
    params.status && VALID_STATUSES.has(params.status) ? (params.status as BookStatus) : undefined
  const sort = (params.sort && VALID_SORTS.has(params.sort) ? params.sort : 'recent') as
    | 'recent'
    | 'title'
    | 'rating'

  const service = createBookService(new SessionAuthProvider())
  const [books, all] = await Promise.all([
    service.list({ q: params.q, status, sort }),
    service.list({}),
  ])

  const counts: Record<string, number> = {
    '': all.length,
    WANT_TO_READ: all.filter((b) => b.status === 'WANT_TO_READ').length,
    READING: all.filter((b) => b.status === 'READING').length,
    READ: all.filter((b) => b.status === 'READ').length,
  }

  return (
    <div className="px-[clamp(14px,4vw,40px)] pt-[clamp(18px,4vw,46px)] pb-[90px]">
      <div className="max-w-[1140px] mx-auto">
        <FadeIn>
          <header className="flex items-end justify-between gap-5 flex-wrap mb-[30px]">
            <div>
              <div className="flex items-center gap-3">
                <span className="w-[30px] h-0.5 bg-[color:var(--color-accent)] inline-block" />
                <span className="text-[11px] tracking-[3.5px] uppercase text-[color:var(--color-faint)]">Your reading room</span>
              </div>
              <h1 className="font-serif-display font-semibold text-[clamp(38px,6vw,58px)] leading-none mt-2.5 tracking-[-1px]">Biblio</h1>
            </div>
            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              <Link
                href="/books/new"
                className="bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] text-sm font-semibold px-[22px] py-[13px] rounded-[11px] no-underline transition-transform active:scale-95 hover:-translate-y-0.5"
                style={{ boxShadow: '0 10px 22px rgba(70,30,30,.22)' }}
              >
                ＋ Add a book
              </Link>
            </div>
          </header>
          <Suspense>
            <SearchFilter q={params.q} status={params.status} sort={sort} counts={counts} />
          </Suspense>
          <AnimatedBookList books={books} />
        </FadeIn>
      </div>
    </div>
  )
}
