'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { DURATION, EASE, STAGGER, prefersReducedMotion } from '@/lib/animations'

interface Props {
  children: React.ReactNode
  /** true ise doğrudan alt öğeler sırayla (stagger) belirir. */
  stagger?: boolean
  className?: string
}

export default function FadeIn({ children, stagger = false, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return
      const targets = stagger ? ref.current.children : ref.current
      gsap.from(targets, {
        opacity: 0,
        y: 10,
        duration: DURATION,
        ease: EASE,
        stagger: stagger ? STAGGER : 0,
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
