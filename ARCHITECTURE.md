# Architecture

## Design Principle

> Grow from today's simple form (single user, local) to **tomorrow's complex form** (multi-user, cloud, AI) without a rewrite.

We achieve this with three adapter layers. Business logic (add a book, list books, update notes) never binds directly to a concrete DB/storage/auth; it always binds to an interface. Across phase transitions, only the interface's implementation changes.

## Layers

```
┌─────────────────────────────────────────────┐
│  UI Layer (Next.js pages + React components)  │  mobile-first, responsive
├─────────────────────────────────────────────┤
│  API Layer (route handlers / server actions)  │  request → response, validation (zod)
├─────────────────────────────────────────────┤
│  Service Layer (business logic)                │  "add book", "generate recommendation"
│   - BookService                                │  uses adapters, knows no concrete DB
│   - RecommendationService (phase 3)            │
├─────────────────────────────────────────────┤
│  Adapter Layer (interfaces + impl)             │  ← extension happens here
│   - Repository    (data access)               │
│   - StorageAdapter (file/photo)               │
│   - AuthProvider   (identity, optional)       │
├─────────────────────────────────────────────┤
│  Infra (Prisma + SQLite, local FS)             │  concrete technology
└─────────────────────────────────────────────┘
```

## Three Extension Points

### 1. Repository — DB independence
```
interface BookRepository {
  list(ownerId, filter): Promise<Book[]>
  getById(ownerId, id): Promise<Book | null>
  create(ownerId, data): Promise<Book>
  update(ownerId, id, data): Promise<Book>
  delete(ownerId, id): Promise<void>
}
```
- **Now**: `PrismaBookRepository` (SQLite behind it)
- **Later**: same interface, Postgres provider — code doesn't change, only `DATABASE_URL` and the Prisma provider
- All methods take `ownerId` → tenancy ready day-1 (see below)

### 2. StorageAdapter — photo storage
```
interface StorageAdapter {
  save(file, key): Promise<string>   // returns path/URL
  getUrl(key): string
  delete(key): Promise<void>
}
```
- **Now**: `LocalStorageAdapter` → `./data/uploads/`, the path is kept in the DB (not a BLOB)
- **Later**: `S3StorageAdapter` / `R2StorageAdapter` — the Service layer sees no difference

### 3. AuthProvider — identity (optional)
```
interface AuthProvider {
  getCurrentUser(req): Promise<User>   // who is the owner?
}
```
- **Now**: `LocalOwnerProvider` → always returns a single fixed `local-owner` user (no login)
- **Later**: `SessionAuthProvider` (Auth.js/Lucia) → real users + sharing

## Tenancy Model (critical decision)

Every table carries an `ownerId`. In single-user mode this is the fixed value `"local-owner"`. As a result:

- Today: query `WHERE ownerId = 'local-owner'` (in practice always the same)
- Tomorrow, multi-user: `WHERE ownerId = session.userId` — **no schema migration needed**, only the `AuthProvider` is swapped
- Sharing: add a separate `Share(bookId, sharedWithUserId, permission)` table; existing queries are not broken

This is the heart of the "simple now / effortless growth later" balance.

## Data Flow (add-a-book example)

```
Phone/Browser
  → POST /api/books  (multipart: photo + metadata)
  → API: zod validate
  → AuthProvider.getCurrentUser() → ownerId
  → StorageAdapter.save(photo) → coverPath
  → BookService.create(ownerId, {..., coverPath})
  → BookRepository.create()  → Prisma → SQLite
  → 201 + book JSON
```

## Folder Structure (suggested)

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
├── data/                    # SQLite file + uploads (gitignored)
└── docs/
```

## Why This Stack

| Decision | Why |
|----------|-----|
| Next.js full-stack | One repo, one command to run; frontend+backend deploy together — the "download-install-run" goal |
| Prisma | DB provider swap is one line; type-safe; migrations built-in |
| SQLite | Zero setup, single file, backup = copy the file; ideal at personal scale |
| Adapter pattern | No rewrite needed for the multi-user/cloud/AI phases |
| TypeScript + zod | Boundary validation + type safety, also to validate AI-generated data |
