# Veritabanı

## Tasarım Hedefi

Schema, **bugün tek kullanıcı** için çalışır ama **multi-user + paylaşım** için gereken kolonlar/ilişkiler day-1'den mevcuttur. Böylece ileride ağır migration veya veri taşıma derdi olmaz.

## Schema (Prisma — kavramsal)

```prisma
model User {
  id        String   @id @default(cuid())
  // single-user modda tek kayıt: id = "local-owner"
  email     String?  @unique        // multi-user'da dolar
  name      String?
  books     Book[]
  createdAt DateTime @default(now())
}

model Book {
  id        String   @id @default(cuid())
  ownerId   String                   // ← tenancy anahtarı, HER sorguda filtre
  owner     User     @relation(fields: [ownerId], references: [id])

  title     String
  author    String?
  coverPath String?                  // dosya path/URL — BLOB değil
  notes     String?                  // kullanıcının düşünceleri
  rating    Int?                     // 1-5
  status    BookStatus @default(WANT_TO_READ)

  tags      Tag[]    @relation("BookTags")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([ownerId])                 // tüm sorgular ownerId ile başlar
  @@index([ownerId, status])
}

enum BookStatus {
  WANT_TO_READ
  READING
  READ
}

model Tag {
  id      String @id @default(cuid())
  ownerId String                     // tag'ler de owner'a ait
  name    String
  books   Book[] @relation("BookTags")

  @@unique([ownerId, name])
}

// FAZ 2'de eklenecek (şimdi yazma, sadece planda dursun):
// model Share {
//   id               String @id @default(cuid())
//   bookId           String
//   sharedWithUserId String
//   permission       Permission   // READ | EDIT
// }
```

## Tenancy Kuralı (tek altın kural)

**Her data sorgusu `ownerId` ile filtrelenir. İstisna yok.**

```
list:   WHERE ownerId = current.ownerId
get:    WHERE id = ? AND ownerId = current.ownerId   // başkasının kaydını okuyamaz
update: WHERE id = ? AND ownerId = current.ownerId
```

Bu kural Repository katmanında zorunlu kılınır (her metot ilk parametre olarak `ownerId` alır). Service/UI bunu unutamaz çünkü interface dayatır.

- **Single-user mod**: `current.ownerId = "local-owner"` (AuthProvider sabit döner)
- **Multi-user mod**: `current.ownerId = session.userId` (AuthProvider swap edilir)

Schema ikisinde de aynı → **geçişte migration yok**.

## Fotoğraf Depolama

DB'de **path/URL** tutulur, dosyanın kendisi değil:
- BLOB → DB şişer, backup ağırlaşır, performans düşer
- Local modda: `./data/uploads/<ownerId>/<bookId>.<ext>`
- Upload'ta resize + compress (örn. max 1200px, webp) — telefon fotoğrafları büyük gelir
- Cloud'a geçişte sadece `coverPath` bir URL'e döner, schema değişmez

## Migration Stratejisi

- **Dev**: `prisma migrate dev` — her schema değişikliğinde versiyonlu migration
- **Kullanıcı kurulumu**: `prisma migrate deploy` — `npm run db:setup` içinde otomatik
- SQLite → Postgres geçişi: provider değiştir + `migrate dev` ile yeniden generate; veri taşıma scripti faz 2'de
- Migration dosyaları repo'ya commit edilir → herkes aynı schema'yı alır

## Backup

Single-user/SQLite'ta backup = iki dosyayı kopyala:
```
data/biblio.db          # veritabanı
data/uploads/           # fotoğraflar
```
İleride: scheduled dump + cloud storage (faz 2/3).
