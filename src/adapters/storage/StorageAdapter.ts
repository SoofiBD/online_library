export interface StorageAdapter {
  save(buffer: Buffer, key: string): Promise<string>
  getUrl(key: string): string
  delete(coverPath: string): Promise<void>
}
