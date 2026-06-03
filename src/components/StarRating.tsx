'use client'

import { useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { prefersReducedMotion } from '@/lib/animations'

interface Props {
  name: string
  defaultValue?: number
}

export default function StarRating({ name, defaultValue = 0 }: Props) {
  const [value, setValue] = useState(defaultValue)
  const [hover, setHover] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const { contextSafe } = useGSAP({ scope: containerRef })

  const handleClick = contextSafe((star: number) => {
    setValue((prev) => (prev === star ? 0 : star))
    if (prefersReducedMotion()) return
    const el = containerRef.current?.querySelectorAll('button')[star - 1]
    if (el) {
      gsap.fromTo(
        el,
        { scale: 0.8 },
        { scale: 1, duration: 0.25, ease: 'power2.out' },
      )
    }
  })

  return (
    <div ref={containerRef} className="flex items-center gap-0.5">
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
