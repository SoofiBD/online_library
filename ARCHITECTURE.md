# Mimari

## Tasarım İlkesi

> Bugünün basit halini (tek kullanıcı, local) **yarının karmaşık haline** (multi-user, cloud, AI) yeniden yazmadan büyütebilmek.

Bunu üç adapter katmanıyla sağlıyoruz. Business logic (kitap ekle, listele, not güncelle) hiçbir zaman somut bir DB/storage/auth'a doğrudan bağlanmaz; hep bir interface'e bağlanır. Faz geçişlerinde sadece interface'in implementasyonu değişir.

## Katmanlar

```
┌─────────────────────────────────────────────┐
│  UI Layer (Next.js pages + React components)  │  mobile-first, responsive
├─────────────────────────────────────────────┤
│  API Layer (route handlers / server actions)  │  request → response, validation (zod)
├─────────────────────────────────────────────┤
│  Service Layer (business logic)                │  "kitap ekle", "öneri üret"
│   - BookService                                │  adapter'ları kullanır, somut DB bilmez
│   - RecommendationService (faz 3)              │
├─────────────────────────────────────────────┤
│  Adapter Layer (interface'ler + impl)          │  ← genişleme buradan olur
│   - Repository    (data erişimi)              │
│   - StorageAdapter (dosya/fotoğraf)           │
│   - AuthProvider   (kimlik, opsiyonel)        │
├─────────────────────────────────────────────┤
│  Infra (Prisma + SQLite, local FS)             │  somut teknoloji
└─────────────────────────────────────────────┘
```

## Üç Genişleme Noktası

### 1. Repository — DB bağımsızlığı
```
interface BookRepository {
  list(ownerId, filter): Promise<Book[]>
  getById(ownerId, id): Promise<Book | null>
  create(ownerId, data): Promise<Book>
  update(ownerId, id, data): Promise<Book>
  delete(ownerId, id): Promise<void>
}
```
- **Şimdi**: `PrismaBookRepository` (SQLite arkada)
- **Sonra**: aynı interface, Postgres provider — kod değişmez, sadece `DATABASE_URL` ve Prisma provider
- Tüm metotlar `ownerId` alır → tenancy day-1 hazır (aşağıda)

### 2. StorageAdapter — fotoğraf depolama
```
interface StorageAdapter {
  save(file, key): Promise<string>   // path/URL döner
  getUrl(key): string
  delete(key): Promise<void>
}
```
- **Şimdi**: `LocalStorageAdapter` → `./data/uploads/`, DB'de path tutulur (BLOB değil)
- **Sonra**: `S3StorageAdapter` / `R2StorageAdapter` — Service katmanı farkı görmez

### 3. AuthProvider — kimlik (opsiyonel)
```
interface AuthProvider {
  getCurrentUser(req): Promise<User>   // owner kim?
}
```
- **Şimdi**: `LocalOwnerProvider` → her zaman tek sabit `local-owner` user döner (login yok)
- **Sonra**: `SessionAuthProvider` (Auth.js/Lucia) → gerçek kullanıcı + sharing

## Tenancy Modeli (kritik karar)

Her tablo `ownerId` taşır. Single-user modda bu sabit `"local-owner"`. Bu sayede:

- Bugün: query `WHERE ownerId = 'local-owner'` (pratikte hep aynı)
- Yarın multi-user: `WHERE ownerId = session.userId` — **schema migration gerekmez**, sadece `AuthProvider` swap edilir
- Paylaşım: ayrı bir `Share(bookId, sharedWithUserId, permission)` tablosu eklenir; mevcut sorgular bozulmaz

Bu, "şimdi basit / sonra zahmetsiz büyüme" dengesinin kalbidir.

## Veri Akışı (kitap ekleme örneği)

```
Telefon/Browser
  → POST /api/books  (multipart: foto + metadata)
  → API: zod validate
  → AuthProvider.getCurrentUser() → ownerId
  → StorageAdapter.save(foto) → coverPath
  → BookService.create(ownerId, {..., coverPath})
  → BookRepository.create()  → Prisma → SQLite
  → 201 + book JSON
```

## Klasör Yapısı (öneri)

```
biblio/
├── src/
│   ├── app/                 # Next.js routes + UI
│   ├── services/            # BookService, RecommendationService
│   ├── adapters/
│   │   ├── repository/      # interface + PrismaBookRepository
│   │   ├── storage/         # interface + Local/S3
│   │   └── auth/            # interface + LocalOwner/Session
│   ├── lib/                 # zod schemas, image resize, db client
│   └── components/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── data/                    # SQLite dosyası + uploads (gitignore)
└── docs/
```

## Neden Bu Stack

| Karar | Neden |
|-------|-------|
| Next.js full-stack | Tek repo, tek komut çalışır; frontend+backend tek deploy — "indir-kur-çalıştır" hedefi |
| Prisma | DB provider swap'ı bir satır; type-safe; migration built-in |
| SQLite | Sıfır kurulum, tek dosya, backup = dosya kopyala; kişisel ölçekte ideal |
| Adapter pattern | Multi-user/cloud/AI fazları için yeniden yazım gerektirmez |
| TypeScript + zod | Sınır validation + tip güvenliği, AI üreteceği veriyi de doğrulamak için |
