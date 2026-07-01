import { describe, it, expect } from 'vitest'
import { toEan13, toIsbn10 } from './isbn'

describe('isbn', () => {
  it('normalizes ISBN-10 to EAN-13', () => {
    expect(toEan13('0-306-40615-2')).toBe('9780306406157')
  })
  it('round-trips EAN-13 back to ISBN-10', () => {
    expect(toIsbn10('9780306406157')).toBe('0306406152')
  })
})
