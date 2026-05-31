'use client'

import { useState } from 'react'

interface Props {
  name: string
  defaultValue?: number
}

export default function StarRating({ name, defaultValue = 0 }: Props) {
  const [value, setValue] = useState(defaultValue)
  const [hover, setHover] = useState(0)

  function handleClick(star: number) {
    setValue((prev) => (prev === star ? 0 : star))
  }

  return (
    <div className="flex items-center gap-0.5">
      <input type="hidden" name={name} value={value || ''} />
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl text-amber-400 hover:scale-110 transition-transform leading-none"
          aria-label={`${star} yıldız`}
        >
          {star <= (hover || value) ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}
