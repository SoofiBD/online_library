# Biblium — Personal Library

A self-hosted web app for managing your own book collection. It stores each book's photo, title, author, and your notes/rating. Clone it from GitHub, install, and run — your database stays on your own machine. You can also reach it from your phone on the same network to add or edit books.

## Core Idea

Every install is **single-user**: whoever runs the project sees only their own database. The architecture is designed so that **multi-user and sharing** can be added later without a rewrite (see [ROADMAP](ROADMAP.md)).

## Quick Start

```bash
git clone <repo-url> biblio
cd biblio
cp .env.example .env        # edit settings
npm install
npm run db:setup            # schema + migration + seed
npm run dev                 # http://localhost:3000
```

## Phone Access (same Wi-Fi)

```bash
npm run dev -- -H 0.0.0.0   # listen on all network interfaces
```

In your phone's browser, go to `http://<machine-local-ip>:3000`. For access from outside your network, see [SETUP.md](SETUP.md) → Tailscale / Cloudflare Tunnel section.

## Documentation

| File | Contents |
|------|----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layers, adapter pattern, extension points |
| [DATABASE.md](DATABASE.md) | Schema, tenancy model, migration strategy |
| [ROADMAP.md](ROADMAP.md) | Phases: CRUD → sharing → AI recommendations |
| [SETUP.md](SETUP.md) | Installation, phone/remote access, deployment |

## Stack

Next.js (full-stack) · Prisma · SQLite (→ Postgres) · TypeScript · Tailwind CSS

## License

MIT (suggested — change to suit your needs).
