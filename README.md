# Biblio — Kişisel Kütüphane

Kendi kitap koleksiyonunu yöneten, self-hosted bir web app. Kitabın fotoğrafını, adını, yazarını ve senin notlarını/puanını saklar. GitHub'dan indir, kur, çalıştır — kendi veritabanın senin makinende kalır. Aynı ağdaki telefonundan da erişip ekleme/düzenleme yapabilirsin.

## Temel Fikir

Her install **tek kullanıcılıdır**: projeyi çalıştıran kişi yalnızca kendi veritabanını görür. Mimari, ileride **multi-user ve paylaşım** eklenebilecek şekilde tasarlandı; bunun için yeniden yazım gerekmez (bkz. [ROADMAP](docs/ROADMAP.md)).

## Hızlı Başlangıç

```bash
git clone <repo-url> biblio
cd biblio
cp .env.example .env        # ayarları düzenle
npm install
npm run db:setup            # schema + migration + seed
npm run dev                 # http://localhost:3000
```

## Telefondan Erişim (aynı Wi-Fi)

```bash
npm run dev -- -H 0.0.0.0   # tüm ağ arayüzlerini dinle
```

Telefonun tarayıcısında `http://<makine-local-ip>:3000` adresine git. Dışarıdan (farklı ağ) erişim için [SETUP.md](docs/SETUP.md) → Tailscale / Cloudflare Tunnel bölümü.

## Dökümanlar

| Dosya | İçerik |
|-------|--------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Katmanlar, adapter pattern, genişletme noktaları |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema, tenancy modeli, migration stratejisi |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fazlar: CRUD → paylaşım → AI öneri |
| [docs/SETUP.md](docs/SETUP.md) | Kurulum, telefon/uzak erişim, deployment |

## Stack

Next.js (full-stack) · Prisma · SQLite (→ Postgres) · TypeScript · Tailwind CSS

## Lisans

MIT (öneri — kendine göre değiştir).
