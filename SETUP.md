# Kurulum & Erişim

## Gereksinimler

- Node.js 20+ ve npm
- Git

## Kurulum

```bash
git clone <repo-url> biblio
cd biblio
cp .env.example .env
npm install
npm run db:setup     # prisma migrate deploy + seed (local-owner user)
npm run dev
```

`.env` (örnek):
```
DATABASE_URL="file:./data/biblio.db"
STORAGE_DRIVER="local"          # local | s3
UPLOAD_DIR="./data/uploads"
AUTH_MODE="local"               # local | session  (faz 2'de session)
```

## Telefondan Erişim

### Seçenek A — Aynı Wi-Fi (en kolay)

```bash
npm run dev -- -H 0.0.0.0       # tüm ağ arayüzlerini dinle
```

Makinenin local IP'sini bul:
- macOS/Linux: `ipconfig getifaddr en0` veya `ip addr`
- Windows: `ipconfig` → IPv4 Address

Telefonda: `http://<local-ip>:3000` (örn. `http://192.168.1.42:3000`)

**Sorun çıkarsa**: bilgisayarın firewall'u 3000 portuna izin vermeli; telefon ve bilgisayar aynı ağda olmalı (misafir Wi-Fi'ı cihazları izole edebilir).

### Seçenek B — Her yerden (farklı ağ)

| Yöntem | Artı | Eksi |
|--------|------|------|
| **Tailscale** | Port forwarding yok, şifreli VPN, kurulum 5 dk | Her cihaza Tailscale kurulur |
| **Cloudflare Tunnel** | Public HTTPS URL, cihaza kurulum yok | Cloudflare hesabı + biraz config |
| Port forwarding | Bağımsız | Güvenlik riski, ISP'ye bağlı — önerilmez |

**Önerilen: Tailscale.** Kur, makineyi ve telefonu aynı tailnet'e al, `http://<makine-tailscale-ip>:3000` ile eriş. Trafik şifreli, internete açık port yok.

## Production / Kalıcı Çalıştırma

```bash
npm run build
npm run start                   # veya pm2 / systemd ile servis olarak
```

Faz 2 sonrası Docker:
```bash
docker compose up -d            # app + (postgres)
```

## Veri & Backup

Her şey `./data/` altında:
```
data/biblio.db        # veritabanı
data/uploads/         # fotoğraflar
```
Backup = bu klasörü kopyala. Bu klasör `.gitignore`'dadır — kişisel veri repo'ya gitmez.

## Sık Sorunlar

- **Telefonda foto yüklenmiyor / dönük geliyor**: EXIF rotation server'da düzeltilir; büyük dosyalar resize edilir. Yine sorun varsa upload limitini (`next.config`) kontrol et.
- **`db:setup` hata veriyor**: `data/` klasörü yazılabilir mi? `DATABASE_URL` path'i doğru mu?
- **Telefon bağlanamıyor**: firewall + aynı ağ kontrolü (yukarı bak).
