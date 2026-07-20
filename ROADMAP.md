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

## Phase 2 — Public multi-user service (code-complete, deploy deferred)

**Goal**: Real accounts, reachable from any network (not just LAN), still single-owner-per-book (no sharing yet).

Superseded the original Auth.js/Postgres/S3 plan below with a leaner one, since the existing adapter layer + SQLite/libSQL already support this without a data-layer rewrite. Full detail: `~/.claude/plans/bu-projeyi-nas-l-farkl-dazzling-frost.md`.

- [x] `User.email` required + `passwordHash`, new `PairingCode` table (migration `20260703104041_add_auth`)
- [x] Backfill script for existing `local-owner` row (`scripts/backfill-auth.ts`)
- [x] `src/lib/auth/password.ts` — hash/verify (Node `scrypt`, not bcryptjs: npm registry unreachable in dev sandbox)
- [x] `prisma/seed.ts` no longer hardcodes owner id
- [x] `SessionAuthProvider` (httpOnly cookie, hand-rolled HMAC JWT — `jose` unreachable in sandbox like `bcryptjs` was) + `/api/auth/{signup,login,logout}` + `/login`, `/signup` pages
- [x] `container.ts`: `createBookService(auth)` — drop hardwired `LocalOwnerProvider`; callers pick `DeviceAuthProvider` (has `x-device-id`) or `SessionAuthProvider`
- [x] `src/proxy.ts` (this Next version renamed `middleware.ts` → `proxy.ts`) — protects all page routes; API routes stay self-authed via `container.ts` since the scanner client can't follow redirects
- [x] Pairing moved to `PairingCode` table (was in-memory `Map`, lost on restart); `ownerId` from session, not hardcoded (`src/lib/auth/pairing.ts`)
- [x] CORS: added `ALLOWED_ORIGINS` (full production origins) alongside the existing `LAN_DEV_ORIGINS` allow-list (wildcard `*` was already gone as of commit `13836e0`)
- [x] Removed `LocalOwnerProvider` + `AUTH_MODE` flag
- [x] Dockerfile + docker-compose + Caddy (VPS deploy, not serverless — SQLite file + `public/uploads/` stay as-is via named volumes). Verified locally: `next build` with `output: 'standalone'` traces `sharp`/`@libsql` native binaries correctly, no Docker daemon available here to build/run the image itself
- [x] Verified locally end-to-end (real HTTP requests against the dev server, no mocks): signup/login/logout, session cookie lifecycle, `proxy.ts` redirects, full book CRUD, multi-tenant isolation between two real accounts, device pairing + `x-device-id` auth
- [ ] **Deferred** — Deploy to VPS, DNS + TLS, cross-network reachability test. Revisit once Phase 3 (security check) and Phase 4 (recommendations) are done; no reason to expose the app publicly before the security pass.

**Note**: No Postgres migration, no S3/R2, no Auth.js/Lucia, no `Share` table — none needed for "real accounts, public reachability." Sharing between users is deferred to Phase 6 (after mobile work starts).

---

## Phase 3 — Security & System Check

**Goal**: Audit what Phase 2 built before adding more feature surface on top of it — auth, session, and transport concerns are cheapest to fix now, before recommendations (Phase 4) and mobile (Phase 5) add more endpoints and more client trust assumptions.

- [ ] Auth/session audit: hand-rolled HMAC session token (`src/lib/auth/session.ts`) and scrypt password hashing (`src/lib/auth/password.ts`) were built under a sandbox constraint (npm registry unreachable, couldn't pull `jose`/`bcryptjs`) — re-check whether that constraint still holds; if the registry is reachable now, evaluate swapping to audited libraries instead of hand-rolled crypto
- [ ] Rate-limit auth endpoints (`/api/auth/{signup,login}`, `/api/pair/{create,claim}`) — currently unlimited, so brute-forcing a password or pairing code is only bounded by the 6-digit code's keyspace and a 5-minute expiry
- [ ] `PairingCode` uses a 6-digit numeric code (1M keyspace) with no attempt limit on `/api/pair/claim` — add a per-IP or per-code attempt counter, or widen the code
- [ ] CORS review: confirm `ALLOWED_ORIGINS` is actually set (not left blank) before any public deploy; audit `requireValidOrigin`'s "missing Origin header is allowed through" exemption (built for native/CLI clients — verify it can't be abused by a same-origin-spoofing browser request)
- [ ] Cookie flags check: `secure` is gated on `NODE_ENV === 'production'` (`session.ts`) — confirm this is actually `production` in the real deploy environment, not just locally
- [ ] Dependency audit: `npm audit`, check for known CVEs in `@prisma/client`, `@libsql/client`, `sharp`, `next` — this couldn't be run in-session (npm registry unreachable in sandbox)
- [ ] Docker image audit: confirm the `runner` stage (Dockerfile) truly excludes dev dependencies and the Prisma CLI as intended; confirm the non-root `nextjs` user actually owns everything it needs to write (`data/`, `public/uploads/`)
- [ ] Input validation sweep: confirm every API route validates with a Zod schema (some, like `/api/pair/claim`, currently do ad-hoc `if (!code || !deviceId)` checks instead) and returns consistent error shapes
- [ ] Error message audit: confirm no route leaks stack traces, internal paths, or DB errors to the client (spot-check the generic `console.error` + generic-message pattern already used in most routes is applied everywhere)
- [ ] Upload path audit: `LocalStorageAdapter` (Phase 1) accepts photo uploads — re-check file-type/size validation now that the app is multi-tenant and will be internet-facing, not LAN-only
- [ ] `SyncEvent`/`Device` cleanup: confirm stale/unpaired devices and old sync events don't accumulate unbounded per user

**Note**: This phase produces no new user-facing feature — it's a punch-list pass over Phase 2's auth/security surface. Small, mechanical fixes expected; anything that turns out to need a bigger redesign gets its own follow-up rather than blocking this phase.

---

## Phase 4 — AI Recommendations & Automation

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
- [ ] Rate-limit and cache recommendation calls if using an external LLM API — same abuse-vector reasoning as Phase 3's auth rate-limiting, now that the app is public

---

## Phase 5 — Website & Mobile Clients

**Goal**: Grow beyond the single Next.js app — a marketing/public site, and a native mobile app, both built on top of the same backend instead of forking logic.

- [ ] Treat `src/app/api/**` as a real public API surface: version it (`/api/v1/...`), document it (OpenAPI/Swagger spec generated from the Zod schemas already in use), add per-route rate limiting
- [ ] Mobile app: reuse the existing `DeviceAuthProvider` + pairing-code flow as the mobile login path (it's already device-identity-based, which is exactly what a mobile client needs) — build with Expo/React Native, or Flutter if native performance matters more than code-sharing with the web app
- [ ] Marketing/landing site: can be a separate lightweight static site (Astro/plain HTML) pointing users to sign up on the main app, rather than merging into the Next.js app's route tree — keeps the app's auth/session logic from leaking into public marketing pages
- [ ] If the mobile app needs offline-first behavior, the existing `SyncEvent` append-log (built for multi-device sync in Phase 1) is already the right primitive — extend it rather than building a separate offline store
- [ ] Push notifications (new book added to a shared list, share invite received) — new `NotificationProvider` adapter, swappable (APNs/FCM/web push). The share-invite trigger depends on Phase 6 existing; the "new book added" trigger does not.

**Note**: Don't start this phase by rewriting the backend "to be API-first" — it already is (Next.js API routes + adapter layer). The work here is mostly new clients and a bit of API hardening (versioning, rate limits), not backend redesign.

---

## Phase 6 — Sharing & Social

**Goal**: Let users share books/lists with each other; light social layer on top of private-by-default libraries.

Deliberately sequenced after mobile work starts (Phase 5) — sharing is a feature users will want on their phone as much as (or more than) on the web, so building the share UI once mobile exists avoids building it twice.

- [ ] `Share` table (`bookId`, `sharedWithUserId`, `permission: READ | EDIT`) — or share a whole list/tag rather than one book at a time
- [ ] Sharing UI: "share this book" action, incoming-shares view, revoke access
- [ ] Public profile page (optional, opt-in): `/u/<username>` showing a curated public shelf
- [ ] Activity feed (optional): "X finished reading Y", follow another user's public shelf
- [ ] Reuse the existing `PairingCode`-style one-time-code pattern for share invites (generate code → recipient claims it) instead of inventing a new invite mechanism
- [ ] Rate-limit sharing endpoints (abuse vector once the app is public) — covered generally by Phase 3's rate-limiting pass, but sharing endpoints need their own limits once they exist

**Note**: Keep this behind Phase 2 (real, stable multi-tenant auth) and Phase 5 (mobile client exists) — building `Share` before auth was solid would've meant redoing it, and building it before mobile exists risks a web-only share UI that gets redesigned once mobile lands.

---

## Ordering Rationale

1. **Schema + adapter interfaces first** — if set up wrong, every phase suffers
2. **Then a working vertical slice** (add → list → show) — early feedback
3. Polish and phone access
4. Public multi-user (Phase 2) only after Phase 1 settled into daily use
5. **Security check (Phase 3) before new feature surface** — Phase 2 added auth, sessions, and public reachability; audit that before Phase 4 adds a new external-API-calling service and Phase 5 adds new clients, each of which is cheaper to build securely from the start than to retrofit
6. Recommendations (Phase 4) before mobile (Phase 5) — ships a differentiating feature on the existing web app first, rather than building two clients before either has anything new to show
7. Mobile (Phase 5) before sharing (Phase 6) — sharing is a feature both clients want; build the client surface once, then add sharing to both at once instead of building a web-only share UI first
8. VPS deployment (end of Phase 2) is intentionally deferred until Phase 3 closes — no reason to expose the app publicly before the security pass

## Suggested First Step

Write `prisma/schema.prisma` + the adapter interfaces, then get a single vertical slice (add book + list) working end-to-end. Everything else sits on top of this skeleton. *(Historical — Phase 1 is done; the current first step is Phase 3's security punch-list.)*
