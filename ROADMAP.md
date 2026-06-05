# Roadmap

Each phase leaves behind a **standalone, usable** product. The next phase does not rewrite the previous one; it builds on top. The adapter layer (see ARCHITECTURE.md) is what makes this possible.

---

## Phase 1 — Core CRUD (MVP)

**Goal**: Add, view, and edit your own library; reach it from your phone.

- [ ] Project skeleton: Next.js + TypeScript + Tailwind
- [ ] Prisma schema (User, Book, Tag) + migration + seed (`local-owner`)
- [ ] Adapter interfaces: `BookRepository`, `StorageAdapter`, `AuthProvider`
- [ ] Implementations: `PrismaBookRepository`, `LocalStorageAdapter`, `LocalOwnerProvider`
- [ ] `BookService` (business logic)
- [ ] API: list / get / create / update / delete
- [ ] UI: book list (grid + search/filter), detail, add/edit form
- [ ] Photo upload + resize/compress + EXIF rotation fix
- [ ] Mobile-first responsive layout
- [ ] `.env.example`, README, `npm run db:setup`
- [ ] Same-network phone access (`-H 0.0.0.0` + IP)

**Output**: A single-user, local, fully functional library.

---

## Phase 2 — Multi-user & Sharing

**Goal**: Multiple people, each with their own library; share selected books.

- [ ] `AuthProvider` swap → `SessionAuthProvider` (Auth.js or Lucia)
- [ ] Login/register; `ownerId` is now a real `userId`
- [ ] `Share` table (bookId, sharedWithUserId, permission: READ/EDIT)
- [ ] Sharing UI: "share this book/list", view of incoming shares
- [ ] SQLite → Postgres (for concurrent writes) + data-move script
- [ ] `StorageAdapter` swap option → S3/R2 (if deploying)
- [ ] HTTPS + security hardening (rate limit, input sanitization)
- [ ] Docker Compose (app + Postgres) — the "anyone can install it" goal

**Note**: Since Phase 1 queries are already filtered by `ownerId`, most of the work is auth + the Share table; touching the data layer is minimal.

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
