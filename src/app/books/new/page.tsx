import Link from 'next/link'
import BookForm from '@/components/BookForm'
import { createBook } from '@/actions/books'
import FadeIn from '@/components/FadeIn'

export default function NewBookPage() {
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
          <BookForm action={createBook} />
        </FadeIn>
      </div>
    </div>
  )
}
