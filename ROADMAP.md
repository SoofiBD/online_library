# Roadmap

Each phase leaves behind a **standalone, usable** product. The next phase does not rewrite the previous one; it builds on top. The adapter layer (see ARCHITECTURE.md) is what makes this possible.

---

## Phase 1 — Core CRUD (MVP)

**Goal**: Add, view, and edit your own library; reach it from your phone.

- [x] Project skeleton: Next.js + TypeScript + Tailwind
- [x] Prisma schema (User, Book, Tag) + migration + seed (`local-owner`)
- [x] Adapter interfaces: `BookRepository`, `StorageAdapter`, `AuthProvider`
- [x] Implementations: `PrismaBookRepository`, `LocalStorageAdapter`, `LocalOwnerProvider`
- [x] `BookService` (business logic)
- [x] API: list / get / create / update / delete
- [x] UI: book list (grid + search/filter), detail, add/edit form
- [x] Photo upload + resize/compress + EXIF rotation fix
- [x] Mobile-first responsive layout
- [x] `.env.example`, README, `npm run db:setup`
- [x] Same-network phone access (`-H 0.0.0.0` + IP), device pairing + sync (Device/SyncEvent tables)

**Output**: A single-user, LAN-reachable, fully functional library. Done.

---

## Phase 2 — Public multi-user service (in progress)

**Goal**: Real accounts, reachable from any network (not just LAN), still single-owner-per-book (no sharing yet — see revised plan).

Superseded the original Auth.js/Postgres/S3 plan below with a leaner one, since the existing adapter layer + SQLite/libSQL already support this without a data-layer rewrite. Full detail: `~/.claude/plans/bu-projeyi-nas-l-farkl-dazzling-frost.md`.

- [x] `User.email` required + `passwordHash`, new `PairingCode` table (migration `20260703104041_add_auth`)
- [x] Backfill script for existing `local-owner` row (`scripts/backfill-auth.ts`)
- [x] `src/lib/auth/password.ts` — hash/verify (Node `scrypt`, not bcryptjs: npm registry unreachable in dev sandbox)
- [x] `prisma/seed.ts` no longer hardcodes owner id
- [ ] `SessionAuthProvider` (httpOnly cookie, `jose` JWT) + `/api/auth/{signup,login,logout}` + `/login`, `/signup` pages
- [ ] `container.ts`: `createBookService(auth)` — drop hardwired `LocalOwnerProvider`; callers pick `DeviceAuthProvider` (has `x-device-id`) or `SessionAuthProvider`
- [ ] `middleware.ts` — protect all routes except `/login`, `/signup`, `/api/auth/*`, device-authed APIs
- [ ] Pairing moved to `PairingCode` table (was in-memory `Map`, lost on restart); `ownerId` from session, not hardcoded
- [ ] CORS: wildcard `*` → `ALLOWED_ORIGINS` allow-list
- [ ] Remove `LocalOwnerProvider` + transitional `AUTH_MODE` flag once cut over
- [ ] Dockerfile + docker-compose + Caddy (VPS deploy, not serverless — SQLite file + `public/uploads/` stay as-is via named volumes)
- [ ] Deploy to VPS, DNS + TLS, prod smoke test from outside LAN

**Note**: No Postgres migration, no S3/R2, no Auth.js/Lucia, no `Share` table — none needed for "real accounts, public reachability." Sharing between users is deferred to a later phase if wanted.

---

## Phase 3 — AI Recommendations & Automation

**Goal**: Personalized recommendations based on the existing library.

- [ ] `RecommendationService` (new service, added to the existing structure)
- [ ] Approach selection (trade-off):

| Approach | Pros | Cons |
|----------|------|------|
| LLM prompt (book list → recommendation) | Fast setup, rich rationale | API cost, external dependency |
| Embedding + similarity (local) | Offline, can run for free | Needs a vector store, weak cold start |
| Hybrid (embedding + LLM explanation) | Best quality | Most complex |

- [ ] Automation: auto-enrich metadata when a book is added (author/genre/cover — external book API: Open Library / Google Books)
- [ ] "If you liked this, try these" + "reading list suggestion"
- [ ] Put recommendation sources behind an adapter too (`RecommenderProvider`) → provider is swappable

---

## Ordering Rationale

1. **Schema + adapter interfaces first** — if set up wrong, every phase suffers
2. **Then a working vertical slice** (add → list → show) — early feedback
3. Polish and phone access
4. Phase 2/3 only after Phase 1 has settled into daily use

## Suggested First Step

Write `prisma/schema.prisma` + the adapter interfaces, then get a single vertical slice (add book + list) working end-to-end. Everything else sits on top of this skeleton.
