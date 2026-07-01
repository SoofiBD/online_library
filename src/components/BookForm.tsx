'use client'

import { useActionState, useState, useRef } from 'react'
import BookCover3D from './BookCover3D'
import StarRating from './StarRating'
import TagInput from './TagInput'
import { COVER_KEYS, COVERS, STATUS } from '@/lib/theme/covers'
import type { BookWithReview } from '@/adapters/repository/BookRepository'
import type { FormState } from '@/actions/books'
import type { BookStatus } from '@/generated/prisma/client'

const STATUS_OPTIONS = Object.keys(STATUS) as BookStatus[]

interface Props {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>
  book?: BookWithReview
  initialTitle?: string
  initialAuthor?: string
  initialCoverUrl?: string
}

export default function BookForm({ action, book, initialTitle, initialAuthor, initialCoverUrl }: Props) {
  const [state, formAction, isPending] = useActionState(action, undefined)

  const [title, setTitle] = useState(book?.title ?? initialTitle ?? '')
  const [author, setAuthor] = useState(book?.author ?? initialAuthor ?? '')
  const [color, setColor] = useState<string>(book?.coverColor ?? 'garnet')
  const [status, setStatus] = useState<BookStatus>(book?.status ?? 'WANT_TO_READ')
  const [coverPath, setCoverPath] = useState<string>(book?.coverPath ?? initialCoverUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      setCoverPath(url)
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Upload failed' }))
      setUploadError(error)
    }
  }

  const label = 'block text-[12.5px] font-bold tracking-[.5px] text-[#6f6253] mb-[7px]'
  const field =
    'w-full px-[15px] py-[13px] border border-[color:var(--color-line)] bg-[color:var(--color-card)] rounded-[11px] text-[15px] text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-accent)]'

  return (
    <form action={formAction} className="flex gap-[clamp(26px,5vw,48px)] flex-wrap items-start">
      <input type="hidden" name="coverColor" value={color} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="coverPath" value={coverPath} />

      {/* live preview + palette */}
      <div className="shrink-0 mx-auto text-center">
        <div className="mb-5">
          <BookCover3D colorKey={color} title={title || 'Untitled'} author={author || 'Add author'} image={coverPath || null} size="form" />
        </div>
        <div className="text-[11px] font-bold tracking-[1px] uppercase text-[#a08f78] mb-2.5">Cover color</div>
        <div className="flex gap-2 flex-wrap justify-center max-w-[170px] mx-auto mb-4">
          {COVER_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setColor(k)}
              className="w-[26px] h-[26px] rounded-full border-0 cursor-pointer transition-transform hover:scale-110"
              style={{ background: COVERS[k].bg, boxShadow: color === k ? '0 0 0 2px var(--color-paper), 0 0 0 4px var(--color-accent)' : '0 1px 3px rgba(0,0,0,.25)' }}
              aria-label={`Cover color ${k}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-[12px] font-semibold text-[color:var(--color-muted)] underline cursor-pointer bg-transparent border-0"
        >
          {uploading ? 'Uploading…' : coverPath ? 'Replace photo' : 'Use a photo instead'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {uploadError && <p className="text-[#a8432f] text-[12.5px] mt-1.5">{uploadError}</p>}
      </div>

      {/* fields */}
      <div className="flex-1 min-w-[280px] flex flex-col gap-5">
        <div>
          <label htmlFor="title" className={label}>TITLE</label>
          <input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="The book's title" className={field} />
          {state?.errors?.title && <div className="text-[#a8432f] text-[12.5px] font-semibold mt-1.5">{state.errors.title[0]}</div>}
        </div>

        <div>
          <label htmlFor="author" className={label}>AUTHOR</label>
          <input id="author" name="author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Who wrote it?" className={field} />
        </div>

        <div>
          <span className={label}>STATUS</span>
          <div className="flex gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => {
              const m = STATUS[s]
              const active = status === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className="cursor-pointer text-[13.5px] font-semibold px-4 py-[9px] rounded-[10px] transition-transform active:scale-95 border"
                  style={active ? { background: m.soft, color: m.color, borderColor: m.color } : { background: 'transparent', color: '#6f6253', borderColor: '#ddccb0' }}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <span className={label}>YOUR RATING</span>
          <StarRating name="rating" defaultValue={book?.rating ?? 0} />
        </div>

        <div>
          <span className={label}>TAGS</span>
          <TagInput name="tags" defaultValue={book?.tags.map((t) => t.name) ?? []} />
        </div>

        <div>
          <label htmlFor="notes" className={label}>NOTES</label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={book?.notes ?? ''}
            rows={5}
            placeholder="What did you think?"
            className={`${field} font-serif-display leading-[1.55] resize-y`}
          />
        </div>

        <div className="flex gap-2.5 mt-1">
          <button
            type="submit"
            disabled={isPending || uploading}
            className="bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] text-[14.5px] font-semibold px-8 py-[13px] rounded-[11px] border-0 cursor-pointer transition-transform active:scale-95 hover:-translate-y-0.5 disabled:opacity-50"
            style={{ boxShadow: '0 10px 22px rgba(70,30,30,.22)' }}
          >
            {isPending ? 'Saving…' : 'Save book'}
          </button>
        </div>
      </div>
    </form>
  )
}
