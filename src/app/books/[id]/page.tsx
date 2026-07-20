import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createBookService } from '@/lib/container'
import { SessionAuthProvider } from '@/adapters/auth/SessionAuthProvider'
import { deleteBook } from '@/actions/books'
import DeleteBookButton from '@/components/DeleteBookButton'
import StatusCycleButton from '@/components/StatusCycleButton'
import BookCover3D from '@/components/BookCover3D'
import StarFraction from '@/components/StarFraction'
import FadeIn from '@/components/FadeIn'
import { statusOf, locationOf } from '@/lib/theme/covers'

interface Props {
  params: Promise<{ id: string }>
}

export default async function BookDetailPage({ params }: Props) {
  const { id } = await params
  const service = createBookService(new SessionAuthProvider())
  const book = await service.getById(id)
  if (!book) notFound()

  const st = statusOf(book.status)
  const loc = locationOf(book.location)
  const boundDelete = deleteBook.bind(null, id)

  return (
    <div className="px-[clamp(14px,4vw,40px)] pt-[clamp(18px,4vw,46px)] pb-[90px]">
      <div className="max-w-[760px] mx-auto">
        <FadeIn>
          <Link
            href="/"
            className="text-[13.5px] font-semibold tracking-[.3px] text-[color:var(--color-muted)] no-underline mb-[30px] inline-block hover:text-[color:var(--color-accent)]"
          >
            ← Back to library
          </Link>

          <div className="flex gap-[clamp(24px,5vw,46px)] flex-wrap items-start mb-[38px]">
            <div className="mx-auto" style={{ animation: 'floatY 7s ease-in-out infinite' }}>
              <BookCover3D
                colorKey={book.coverColor}
                title={book.title}
                author={book.author}
                image={book.coverPath}
                size="detail"
                spineLabel
              />
            </div>

            <div className="flex-1 min-w-[260px]">
              <StatusCycleButton id={book.id} status={book.status} />
              <h1 className="font-serif-display font-semibold text-[clamp(28px,5vw,40px)] leading-[1.1] tracking-[-.5px] mb-2">{book.title}</h1>
              <p className="font-serif-display italic text-[18px] text-[color:var(--color-muted)] mb-4">by {book.author ?? 'Unknown'}</p>

              <div className="mb-[18px] flex items-center gap-3">
                <StarFraction rating={book.rating} size={19} />
                <span className="text-[11px] font-bold tracking-[.5px] uppercase" style={{ color: loc.color }}>
                  {loc.label}
                </span>
              </div>

              {book.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-5">
                  {book.tags.map((t) => (
                    <span
                      key={t.id}
                      className="text-[11.5px] font-semibold tracking-[.4px] text-[#7a6a54] bg-[#efe6d4] border border-[#e2d5bd] px-[11px] py-[5px] rounded-[7px]"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}

              {book.status === 'READING' && (
                <div className="bg-[color:var(--color-card)] border border-[#ece0cb] rounded-[13px] px-[17px] py-[15px] mb-6">
                  <div className="flex justify-between text-xs font-bold tracking-[.5px] uppercase text-[color:var(--color-muted)] mb-2">
                    <span>Reading progress</span>
                    <span style={{ color: st.color }}>{book.progress ?? 0}%</span>
                  </div>
                  <div className="h-[7px] rounded-[5px] bg-[#ece0cb] overflow-hidden">
                    <div
                      className="h-full rounded-[5px] origin-left"
                      style={{ background: `linear-gradient(90deg,${st.color},#c8763f)`, width: `${book.progress ?? 0}%`, animation: 'barGrow 1.1s cubic-bezier(.2,.7,.2,1) both' }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 flex-wrap items-center">
                <Link
                  href={`/books/${id}/edit`}
                  className="bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] text-sm font-semibold px-[26px] py-3 rounded-[11px] no-underline transition-transform active:scale-95 hover:-translate-y-0.5"
                  style={{ boxShadow: '0 10px 20px rgba(70,30,30,.2)' }}
                >
                  Edit details
                </Link>
                <DeleteBookButton action={boundDelete} />
              </div>
            </div>
          </div>

          {book.notes && (
            <div className="border-t border-[#e6dac4] pt-[26px]">
              <div className="text-xs font-bold tracking-[1.5px] uppercase text-[#a08f78] mb-3.5">Notes</div>
              <p className="font-serif-display text-[18px] leading-[1.62] text-[#3c3024] whitespace-pre-wrap max-w-[62ch] m-0">{book.notes}</p>
            </div>
          )}
        </FadeIn>
      </div>
    </div>
  )
}
