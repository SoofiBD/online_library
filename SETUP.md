# Setup & Access

## Requirements

- Node.js 20+ and npm
- Git

## Installation

```bash
git clone <repo-url> biblio
cd biblio
cp .env.example .env
npm install
npm run db:setup     # prisma migrate deploy + seed (local-owner user)
npm run dev
```

`.env` (example):
```
DATABASE_URL="file:./data/biblio.db"
STORAGE_DRIVER="local"          # local | s3
UPLOAD_DIR="./data/uploads"
AUTH_MODE="local"               # local | session  (session in phase 2)
```

## Phone Access

### Option A — Same Wi-Fi (easiest)

```bash
npm run dev -- -H 0.0.0.0       # listen on all network interfaces
```

Find the machine's local IP:
- macOS/Linux: `ipconfig getifaddr en0` or `ip addr`
- Windows: `ipconfig` → IPv4 Address

On the phone: `http://<local-ip>:3000` (e.g. `http://192.168.1.42:3000`)

**If it doesn't work**: the computer's firewall must allow port 3000; the phone and computer must be on the same network (guest Wi-Fi can isolate devices).

### Option B — From anywhere (different network)

| Method | Pros | Cons |
|--------|------|------|
| **Tailscale** | No port forwarding, encrypted VPN, 5-min setup | Tailscale installed on each device |
| **Cloudflare Tunnel** | Public HTTPS URL, no install on device | Cloudflare account + some config |
| Port forwarding | Independent | Security risk, depends on ISP — not recommended |

**Recommended: Tailscale.** Install it, put the machine and phone on the same tailnet, and access via `http://<machine-tailscale-ip>:3000`. Traffic is encrypted, no port is exposed to the internet.

## Production / Persistent Run

```bash
npm run build
npm run start                   # or run as a service via pm2 / systemd
```

After phase 2, Docker:
```bash
docker compose up -d            # app + (postgres)
```

## Data & Backup

Everything lives under `./data/`:
```
data/biblio.db        # the database
data/uploads/         # the photos
```
Backup = copy this folder. This folder is in `.gitignore` — personal data does not go to the repo.

## Common Issues

- **Photo won't upload / comes in rotated on phone**: EXIF rotation is fixed server-side; large files are resized. If problems persist, check the upload limit (`next.config`).
- **`db:setup` throws an error**: Is the `data/` folder writable? Is the `DATABASE_URL` path correct?
- **Phone can't connect**: check firewall + same network (see above).
