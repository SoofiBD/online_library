import path from 'path'
import fs from 'fs/promises'
import type { StorageAdapter } from './StorageAdapter'

export class LocalStorageAdapter implements StorageAdapter {
  private readonly uploadDir: string

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads')
  }

  async save(buffer: Buffer, key: string): Promise<string> {
    const safeKey = path.basename(key)
    const fullPath = path.resolve(path.join(this.uploadDir, safeKey))
    const resolvedUploadDir = path.resolve(this.uploadDir)
    if (!fullPath.startsWith(resolvedUploadDir + path.sep)) {
      throw new Error('Invalid upload path')
    }
    await fs.mkdir(this.uploadDir, { recursive: true })
    await fs.writeFile(fullPath, buffer)
    return `/uploads/${safeKey}`
  }

  getUrl(key: string): string {
    return `/uploads/${path.basename(key)}`
  }

  async delete(coverPath: string): Promise<void> {
    const filename = path.basename(coverPath)
    const fullPath = path.resolve(path.join(this.uploadDir, filename))
    const resolvedUploadDir = path.resolve(this.uploadDir)
    if (!fullPath.startsWith(resolvedUploadDir + path.sep) && fullPath !== resolvedUploadDir) {
      console.error('Attempted path traversal in delete:', coverPath)
      return
    }
    await fs.unlink(fullPath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') {
        console.error('[LocalStorageAdapter] failed to delete cover:', error)
      }
    })
  }
}
