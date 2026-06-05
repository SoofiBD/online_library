'use client'

import { useActionState } from 'react'
import { useState, useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { DURATION, EASE, prefersReducedMotion } from '@/lib/animations'
import StarRating from './StarRating'
import type { Book } from '@/generated/prisma/client'
import type { FormState } from '@/actions/books'

const STATUS_OPTIONS = [
  { value: 'WANT_TO_READ', label: 'Want to Read' },
  { value: 'READING', label: 'Reading' },
  { value: 'READ', label: 'Read' },
]

interface Props {
  action: (prevState: FormState, formData: FormData) => Promise<FormState>
  book?: Book
}

export default function BookForm({ action, book }: Props) {
  const [state, formAction, isPending] = useActionState(action, undefined)
  const [coverPreview, setCoverPreview] = useState<string | null>(
    book?.coverPath ?? null,
  )
  const [coverPath, setCoverPath] = useState<string>(book?.coverPath ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLImageElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !previewRef.current) return
      gsap.from(previewRef.current, {
        opacity: 0,
        scale: 0.92,
        duration: DURATION,
        ease: EASE,
      })
    },
    { dependencies: [coverPreview] },
  )

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setCoverPreview(URL.createObjectURL(file))
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
      setCoverPreview(book?.coverPath ?? null)
      setCoverPath(book?.coverPath ?? '')
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Cover */}
      <div>
        <p className="text-sm font-medium mb-2">Cover Photo</p>
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          className="w-32 h-44 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-amber-400 transition-colors"
        >
          {uploading ? (
            <span className="text-xs text-gray-400">Uploading...</span>
          ) : coverPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={previewRef}
              src={coverPreview}
              alt="Cover preview"
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-3xl">📷</span>
          )}
        </div>
        {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <input type="hidden" name="coverPath" value={coverPath} />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          defaultValue={book?.title}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
        />
        {state?.errors?.title && (
          <p className="text-red-500 text-xs mt-1">{state.errors.title[0]}</p>
        )}
      </div>

      {/* Author */}
      <div>
        <label htmlFor="author" className="block text-sm font-medium mb-1">
          Author
        </label>
        <input
          id="author"
          name="author"
          defaultValue={book?.author ?? ''}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
        />
      </div>

      {/* Status */}
      <div>
        <p className="text-sm font-medium mb-2">Status</p>
        <div className="flex flex-wrap gap-3">
          {STATUS_OPTIONS.map((opt) => {
            const defaultStatus = book?.status ?? 'WANT_TO_READ'
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <input
                  type="radio"
                  name="status"
                  value={opt.value}
                  defaultChecked={defaultStatus === opt.value}
                  className="accent-amber-500"
                />
                {opt.label}
              </label>
            )
          })}
        </div>
      </div>

      {/* Rating */}
      <div>
        <p className="text-sm font-medium mb-2">Rating</p>
        <StarRating name="rating" defaultValue={book?.rating ?? 0} />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={book?.notes ?? ''}
          rows={5}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || uploading}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition active:scale-[0.98]"
      >
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
