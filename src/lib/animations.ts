// Shared animation constants and helpers. "Subtle & fast" style.

export const DURATION = 0.3
export const EASE = 'power2.out'
export const STAGGER = 0.04

/** Returns true if the user prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
