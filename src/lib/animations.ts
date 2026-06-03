// Ortak animasyon sabitleri ve yardımcıları. "İnce & hızlı" tarz.

export const DURATION = 0.3
export const EASE = 'power2.out'
export const STAGGER = 0.04

/** Kullanıcı azaltılmış hareket tercih ediyorsa true döner. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
