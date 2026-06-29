// ISBN sanitization + EAN-13 normalization (Module 3).
//
// Barcode scanners and copy-paste introduce spaces, dashes, and invisible
// characters, and older/localized titles are catalogued under ISBN-10. To keep
// exactly one canonical key per book — and to make the (ownerId, isbn) unique
// constraint actually prevent duplicates — every incoming value is reduced to a
// 13-digit EAN-13 before it is queried or persisted.

const NON_ISBN_CHARS = /[^0-9Xx]/g

/** Strips whitespace, dashes, and invisible characters, leaving only [0-9X]. */
export function sanitizeIsbn(raw: string): string {
  return raw.replace(NON_ISBN_CHARS, '').toUpperCase()
}

function isValidIsbn10(s: string): boolean {
  if (!/^\d{9}[\dX]$/.test(s)) return false
  let sum = 0
  for (let i = 0; i < 10; i++) {
    const value = s[i] === 'X' ? 10 : Number(s[i])
    sum += value * (10 - i)
  }
  return sum % 11 === 0
}

function ean13CheckDigit(first12: string): number {
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3)
  return (10 - (sum % 10)) % 10
}

function isValidEan13(s: string): boolean {
  if (!/^\d{13}$/.test(s)) return false
  return ean13CheckDigit(s.slice(0, 12)) === Number(s[12])
}

/** True when the value is a structurally valid ISBN-10 or ISBN-13. */
export function isValidIsbn(raw: string): boolean {
  const s = sanitizeIsbn(raw)
  return isValidIsbn10(s) || isValidEan13(s)
}

/**
 * Maps any ISBN-10 / ISBN-13 input to a canonical EAN-13 string, or `null` if
 * it cannot be a book ISBN. ISBN-10 is converted by prefixing `978` to its
 * first 9 digits and recomputing the EAN-13 check digit.
 */
export function toEan13(raw: string): string | null {
  const s = sanitizeIsbn(raw)
  if (isValidEan13(s)) return s
  if (isValidIsbn10(s)) {
    const body = '978' + s.slice(0, 9)
    return body + ean13CheckDigit(body)
  }
  return null
}

/**
 * Converts a canonical EAN-13 string back to ISBN-10 when the EAN starts with
 * the 978 prefix (Bookland). Returns `null` for 979-prefix EANs that cannot
 * map to ISBN-10, or when the input is not a valid EAN-13.
 */
export function toIsbn10(ean13: string): string | null {
  if (!isValidEan13(ean13)) return null
  if (!ean13.startsWith('978')) return null

  // Drop the 978 prefix, take first 9 digits, compute ISBN-10 check digit.
  const body = ean13.slice(3, 12) // 9 digits
  let sum = 0
  for (let i = 0; i < 9; i++) sum += Number(body[i]) * (9 - i)
  const remainder = sum % 11
  const check = remainder === 0 ? '0' : remainder === 1 ? 'X' : String(11 - remainder)
  return body + check
}
