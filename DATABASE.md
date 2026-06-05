# Database

## Design Goal

The schema **works for a single user today** but the columns/relations needed for **multi-user + sharing** are present from day-1. This avoids heavy migrations or data moves later.

## Schema (Prisma — conceptual)

```prisma
model User {
  id        String   @id @default(cuid())
  // single record in single-user mode: id = "local-owner"
  email     String?  @unique        // populated in multi-user
  name      String?
  books     Book[]
  createdAt DateTime @default(now())
}

model Book {
  id        String   @id @default(cuid())
  ownerId   String                   // ← tenancy key, filtered on EVERY query
  owner     User     @relation(fields: [ownerId], references: [id])

  title     String
  author    String?
  coverPath String?                  // file path/URL — not a BLOB
  notes     String?                  // the user's thoughts
  rating    Int?                     // 1-5
  status    BookStatus @default(WANT_TO_READ)

  tags      Tag[]    @relation("BookTags")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([ownerId])                 // all queries start with ownerId
  @@index([ownerId, status])
}

enum BookStatus {
  WANT_TO_READ
  READING
  READ
}

model Tag {
  id      String @id @default(cuid())
  ownerId String                     // tags belong to an owner too
  name    String
  books   Book[] @relation("BookTags")

  @@unique([ownerId, name])
}

// To be added in PHASE 2 (don't write it now, just keep it in the plan):
// model Share {
//   id               String @id @default(cuid())
//   bookId           String
//   sharedWithUserId String
//   permission       Permission   // READ | EDIT
// }
```

## Tenancy Rule (the one golden rule)

**Every data query is filtered by `ownerId`. No exceptions.**

```
list:   WHERE ownerId = current.ownerId
get:    WHERE id = ? AND ownerId = current.ownerId   // can't read someone else's record
update: WHERE id = ? AND ownerId = current.ownerId
```

This rule is enforced at the Repository layer (every method takes `ownerId` as its first parameter). The Service/UI cannot forget it because the interface mandates it.

- **Single-user mode**: `current.ownerId = "local-owner"` (AuthProvider returns a constant)
- **Multi-user mode**: `current.ownerId = session.userId` (AuthProvider is swapped)

The schema is identical in both → **no migration on transition**.

## Photo Storage

The DB keeps a **path/URL**, not the file itself:
- BLOB → DB bloats, backups get heavy, performance drops
- Local mode: `./data/uploads/<ownerId>/<bookId>.<ext>`
- On upload, resize + compress (e.g. max 1200px, webp) — phone photos come in large
- Moving to cloud only turns `coverPath` into a URL; the schema doesn't change

## Migration Strategy

- **Dev**: `prisma migrate dev` — a versioned migration on every schema change
- **User install**: `prisma migrate deploy` — runs automatically inside `npm run db:setup`
- SQLite → Postgres switch: change the provider + regenerate with `migrate dev`; data-move script in phase 2
- Migration files are committed to the repo → everyone gets the same schema

## Backup

In single-user/SQLite, backup = copy two things:
```
data/biblio.db          # the database
data/uploads/           # the photos
```
Later: scheduled dump + cloud storage (phase 2/3).
