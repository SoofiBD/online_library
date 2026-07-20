# Multi-stage build -> .next/standalone (see next.config.ts `output: 'standalone'`).
# Alpine + musl: @libsql and sharp both ship prebuilt linux-musl binaries, so
# no build toolchain is needed for native deps.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL only needs to be well-formed for `prisma generate` (no DB
# connection made at build time) — the real value comes from .env at runtime.
ENV DATABASE_URL="file:./data/biblio.db"
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# data/ and public/uploads are named volumes (see docker-compose.yml) so the
# SQLite file and uploaded covers survive image rebuilds.
RUN mkdir -p data public/uploads && chown -R nextjs:nodejs data public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
