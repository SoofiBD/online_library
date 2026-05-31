# Biblio — Faz 1 MVP Tasarım Dokümanı

**Tarih:** 2026-05-31  
**Kapsam:** Faz 1 — Çekirdek CRUD (tek kullanıcı, local, self-hosted)

---

## 1. Genel Bakış

Self-hosted, tek kullanıcılık kişisel kütüphane uygulaması. Kitap ekle, listele, düzenle, sil; fotoğraf yükle; not ve puan bırak. Aynı Wi-Fi'daki telefondan da erişilebilir.

**Stack:** Next.js 14+ (App Router) · TypeScript · Tailwind CSS · Prisma · SQLite · sharp

---

## 2. Mimari

### Katmanlar

```
UI Layer       → src/app/ (Server Components + Server Actions)
API Layer      → src/app/api/upload/route.ts (sadece multipart upload)
Service Layer  → src/services/BookService.ts
Adapter Layer  → src/adapters/{repository,storage,auth}/
Infra          → Prisma + SQLite (data/biblio.db) + local FS (data/uploads/)
```

### Klasör Yapısı

```
biblio/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # kitap listesi
│   │   ├── books/
│   │   │   ├── new/page.tsx            # ekle formu
│   │   │   ├── [id]/page.tsx           # detay
│   │   │   └── [id]/edit/page.tsx      # düzenle formu
│   │   ├── api/upload/route.ts         # fotoğraf upload endpoint
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   └── layout.tsx
│   ├── actions/
│   │   └── books.ts                    # Server Actions (create, update, delete)
│   ├── services/
│   │   └── BookService.ts
│   ├── adapters/
│   │   ├── repository/
│   │   │   ├── BookRepository.ts       # interface
│   │   │   └── PrismaBookRepository.ts
│   │   ├── storage/
│   │   │   ├── StorageAdapter.ts       # interface
│   │   │   └── LocalStorageAdapter.ts
│   │   └── auth/
│   │       ├── AuthProvider.ts         # interface
│   │       └── LocalOwnerProvider.ts   # sabit "local-owner" döner
│   ├── lib/
│   │   ├── db.ts                       # Prisma client singleton
│   │   ├── schemas.ts                  # Zod validation şemaları
│   │   └── image.ts                    # sharp resize + EXIF rotation
│   └── components/
│       ├── BookList.tsx
│       ├── BookCard.tsx
│       ├── BookForm.tsx
│       ├── StarRating.tsx
│       └── SearchFilter.tsx
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── data/                               # .gitignore'da
│   ├── biblio.db
│   └── uploads/
└── docs/
```

---

## 3. Veri Akışı

### Okuma (Server Components)

```
URL params (?q=, ?status=)
  → page.tsx (Server Component)
  → BookService.list(ownerId, { q, status })
  → PrismaBookRepository.list()
  → Prisma → SQLite
  → HTML render (hydration yok)
```

### Yazma (Server Actions)

```
Form submit
  → Server Action (src/actions/books.ts)
  → Zod.parse() → hata varsa field mesajı döner
  → LocalOwnerProvider.getCurrentUser() → "local-owner"
  → BookService.create/update/delete()
  → redirect() veya revalidatePath()
```

### Fotoğraf Upload

```
Kullanıcı dosya seçer
  → Client: POST /api/upload (multipart/form-data)
  → Route Handler:
      sharp → max 1200px → webp + EXIF rotation fix
      LocalStorageAdapter.save() → data/uploads/local-owner/<uuid>.webp
      → coverPath (string) döner
  → Gizli <input> olarak forma eklenir
  → Form submit ile birlikte DB'ye kaydedilir
```

### Filtre / Arama

URL search params: `?q=kafka&status=READ`  
Client'ta `router.push()` ile debounced güncelleme — sayfa yenilemede, telefon erişiminde, browser geri tuşunda korunur.

---

## 4. UI Tasarımı

### Tema

Tailwind `dark:` prefix, `prefers-color-scheme` otomatik. Renk paleti: nötr gri + amber vurgu.

### Ana Ekran (`/`)

```
┌─────────────────────────────────┐
│ Biblio              [+ Ekle]    │
├─────────────────────────────────┤
│ 🔍 [Kitap veya yazar ara...]    │
│ [Tümü] [Okumak İst.] [Okuyor]  │
│         [Okudu]                 │
├─────────────────────────────────┤
│ ┌────┐ Kitap Adı                │
│ │    │ Yazar · ★★★★☆ · OKUYOR  │
│ └────┘                          │
├─────────────────────────────────┤
│ ┌────┐ Kitap Adı 2              │
│ │    │ Yazar · ★★★☆☆ · OKUDU   │
│ └────┘                          │
└─────────────────────────────────┘
```

Satıra tıklama → detay sayfası.

### Detay Sayfası (`/books/[id]`)

Büyük kapak + tüm alanlar (ad, yazar, durum, puan, notlar) + [Düzenle] [Sil] butonları.

### Ekle / Düzenle Formu (`/books/new`, `/books/[id]/edit`)

```
┌─────────────────────────────┐
│  ← Geri   Yeni Kitap        │
│                             │
│  [Kapak fotoğrafı yükle]    │
│  Ad *: [________________]   │
│  Yazar: [________________]  │
│  Durum: [Okumak İst. ▼]     │
│  Puan:  ★★★☆☆              │
│  Notlar: [______________]   │
│          [______________]   │
│  [      Kaydet      ]       │
└─────────────────────────────┘
```

- Kapak: anlık önizleme, upload sonrası coverPath gizli input'a yazılır
- Puan: tıklanabilir 5 yıldız
- Ad alanı zorunlu, diğerleri opsiyonel

---

## 5. Hata Yönetimi

| Senaryo | Davranış |
|---------|----------|
| Zod validation hatası | Field seviyesinde hata mesajı, form yeniden gösterilir |
| Fotoğraf > 10MB | Upload reddedilir, kullanıcıya mesaj |
| Desteklenmeyen format | Upload reddedilir, kitap kapaksız kaydedilebilir |
| Upload başarısız | coverPath boş kalır, kitap yine kaydedilir |
| DB hatası | `error.tsx` devreye girer, sade hata mesajı |
| Olmayan kitap | `not-found.tsx` |

---

## 6. Güvenlik

- `ownerId` her DB sorgusunda zorunlu — `BookRepository` interface'i bunu dayatır
- Fotoğraf dosya adı: `path.basename()` ile sanitize (path traversal önlemi)
- Upload boyut limiti `next.config` + route handler'da çift kontrol
- Faz 1: auth yok (local/same-network kullanım)

---

## 7. Prisma Schema (özet)

DATABASE.md'deki schema aynen kullanılır:

- `User` — tek kayıt: `id = "local-owner"`
- `Book` — `ownerId`, `title`, `author?`, `coverPath?`, `notes?`, `rating?`, `status`
- `Tag` — `ownerId`, `name` (Faz 1'de UI'da tag ekleme yok, schema hazır)
- `BookStatus` enum: `WANT_TO_READ | READING | READ`

---

## 8. Ortam Değişkenleri (`.env`)

```
DATABASE_URL="file:./data/biblio.db"
STORAGE_DRIVER="local"
UPLOAD_DIR="./data/uploads"
AUTH_MODE="local"
```

---

## 9. npm Scriptleri

```json
"dev": "next dev",
"build": "next build",
"start": "next start",
"db:setup": "prisma migrate deploy && npx tsx prisma/seed.ts"
```

---

## 10. Kapsam Dışı (Faz 1)

- Multi-user / auth
- Tag bazlı filtreleme (schema hazır, UI Faz 2)
- AI öneri
- Docker / Postgres
- Grid görünümü (liste görünümü varsayılan)
