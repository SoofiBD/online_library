import Link from 'next/link'
import { notFound } from 'next/navigation'
import BookForm from '@/components/BookForm'
import { updateBook } from '@/actions/books'
import { createBookService } from '@/lib/container'
import FadeIn from '@/components/FadeIn'

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
    <div className="px-[clamp(14px,4vw,40px)] pt-[clamp(18px,4vw,46px)] pb-[90px]">
      <div className="max-w-[880px] mx-auto">
        <FadeIn>
          <Link
            href={`/books/${id}`}
            className="text-[13.5px] font-semibold tracking-[.3px] text-[color:var(--color-muted)] no-underline mb-[22px] inline-block hover:text-[color:var(--color-accent)]"
          >
            ← Cancel
          </Link>
          <h1 className="font-serif-display font-semibold text-[clamp(28px,5vw,40px)] leading-[1.05] tracking-[-.5px] mb-[30px]">Edit book</h1>
          <BookForm action={boundAction} book={book} />
        </FadeIn>
      </div>
    </div>
  )
}
