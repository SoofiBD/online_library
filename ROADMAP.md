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
- [ ] Deploy to VPS, DNS + TLS
- [ ] **Cross-network reachability test**: open the deployed URL from outside the home LAN (mobile data, different Wi-Fi) — this is the actual point of the VPS+Caddy move, since LAN-only access (`-H 0.0.0.0` + local IP) cannot cross networks. TLS must show no warnings; two separate real accounts must be able to sign up and use the app concurrently without seeing each other's books.

**Note**: No Postgres migration, no S3/R2, no Auth.js/Lucia, no `Share` table — none needed for "real accounts, public reachability." Sharing between users is deferred to Phase 3.

---

## Phase 3 — Sharing & Social

**Goal**: Let users share books/lists with each other; light social layer on top of private-by-default libraries.

- [ ] `Share` table (`bookId`, `sharedWithUserId`, `permission: READ | EDIT`) — or share a whole list/tag rather than one book at a time
- [ ] Sharing UI: "share this book" action, incoming-shares view, revoke access
- [ ] Public profile page (optional, opt-in): `/u/<username>` showing a curated public shelf
- [ ] Activity feed (optional): "X finished reading Y", follow another user's public shelf
- [ ] Reuse the existing `PairingCode`-style one-time-code pattern for share invites (generate code → recipient claims it) instead of inventing a new invite mechanism
- [ ] Rate-limit sharing endpoints (abuse vector once the app is public)

**Note**: Keep this behind Phase 2 — sharing requires real, stable multi-tenant auth first (which Phase 2 delivers). Building `Share` before auth was solid would've meant redoing it.

---

## Phase 4 — Website & Mobile Clients

**Goal**: Grow beyond the single Next.js app — a marketing/public site, and a native mobile app, both built on top of the same backend instead of forking logic.

- [ ] Treat `src/app/api/**` as a real public API surface: version it (`/api/v1/...`), document it (OpenAPI/Swagger spec generated from the Zod schemas already in use), add per-route rate limiting
- [ ] Mobile app: reuse the existing `DeviceAuthProvider` + pairing-code flow as the mobile login path (it's already device-identity-based, which is exactly what a mobile client needs) — build with Expo/React Native, or Flutter if native performance matters more than code-sharing with the web app
- [ ] Marketing/landing site: can be a separate lightweight static site (Astro/plain HTML) pointing users to sign up on the main app, rather than merging into the Next.js app's route tree — keeps the app's auth/session logic from leaking into public marketing pages
- [ ] If the mobile app needs offline-first behavior, the existing `SyncEvent` append-log (built for multi-device sync in Phase 1) is already the right primitive — extend it rather than building a separate offline store
- [ ] Push notifications (new book added to a shared list, share invite received) — new `NotificationProvider` adapter, swappable (APNs/FCM/web push)

**Note**: Don't start this phase by rewriting the backend "to be API-first" — it already is (Next.js API routes + adapter layer). The work here is mostly new clients and a bit of API hardening (versioning, rate limits), not backend redesign.

---

## Phase 5 — AI Recommendations & Automation

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
4. Public multi-user (Phase 2) only after Phase 1 settled into daily use
5. Sharing (Phase 3) only after real multi-user auth is solid — don't build `Share` on top of the old hardcoded-owner model
6. Website/mobile clients (Phase 4) and AI recommendations (Phase 5) are independent of each other — order between them is whichever the user wants next, not a hard dependency

## Suggested First Step

Write `prisma/schema.prisma` + the adapter interfaces, then get a single vertical slice (add book + list) working end-to-end. Everything else sits on top of this skeleton.
