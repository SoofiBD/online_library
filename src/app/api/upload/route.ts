import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { processImage } from '@/lib/image'
import { LocalStorageAdapter } from '@/adapters/storage/LocalStorageAdapter'
import { resolveAuthProvider } from '@/lib/container'
import { requireValidOrigin } from '@/lib/cors'
import { isAuthError } from '@/lib/auth/isAuthError'

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export async function POST(req: NextRequest) {
  const originError = requireValidOrigin(req)
  if (originError) return originError

  try {
    await resolveAuthProvider(req).getCurrentUserId()
  } catch (error) {
    if (isAuthError(error)) return NextResponse.json({ error: error.message }, { status: 401 })
    throw error
  }

  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_SIZE) {
    return NextResponse.json({ error: 'File cannot be larger than 10MB' }, { status: 413 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file selected' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File cannot be larger than 10MB' }, { status: 413 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported format (jpeg, png, webp, heic)' }, { status: 415 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let processed: Buffer
  try {
    processed = await processImage(buffer)
  } catch {
    return NextResponse.json({ error: 'Could not process the image' }, { status: 422 })
  }

  const key = `${crypto.randomUUID()}.webp`
  const storage = new LocalStorageAdapter()
  const url = await storage.save(processed, key)

  return NextResponse.json({ url })
}
