# Yol Haritası

Her faz **tek başına çalışan, kullanılabilir** bir ürün bırakır. Sonraki faz öncekini yeniden yazmaz, üstüne bina eder. Adapter katmanı (bkz. ARCHITECTURE.md) bunu mümkün kılan şey.

---

## Faz 1 — Çekirdek CRUD (MVP)

**Hedef**: Kendi kütüphaneni ekle, gör, düzenle; telefondan eriş.

- [ ] Proje iskeleti: Next.js + TypeScript + Tailwind
- [ ] Prisma schema (User, Book, Tag) + migration + seed (`local-owner`)
- [ ] Adapter interface'leri: `BookRepository`, `StorageAdapter`, `AuthProvider`
- [ ] Implementasyonlar: `PrismaBookRepository`, `LocalStorageAdapter`, `LocalOwnerProvider`
- [ ] `BookService` (business logic)
- [ ] API: list / get / create / update / delete
- [ ] UI: kitap listesi (grid + arama/filtre), detay, ekle/düzenle formu
- [ ] Fotoğraf upload + resize/compress + EXIF rotation fix
- [ ] Mobile-first responsive layout
- [ ] `.env.example`, README, `npm run db:setup`
- [ ] Aynı-ağ telefon erişimi (`-H 0.0.0.0` + IP)

**Çıktı**: Tek kullanıcılık, local, tam işlevsel kütüphane.

---

## Faz 2 — Multi-user & Paylaşım

**Hedef**: Birden fazla kişi, kendi kütüphanesi; seçili kitapları paylaş.

- [ ] `AuthProvider` swap → `SessionAuthProvider` (Auth.js veya Lucia)
- [ ] Login/register; `ownerId` artık gerçek `userId`
- [ ] `Share` tablosu (bookId, sharedWithUserId, permission: READ/EDIT)
- [ ] Paylaşım UI: "bu kitabı/listeyi paylaş", gelen paylaşımlar görünümü
- [ ] SQLite → Postgres (concurrent yazma için) + veri taşıma scripti
- [ ] `StorageAdapter` swap opsiyonu → S3/R2 (deploy edilecekse)
- [ ] HTTPS + güvenlik sıkılaştırma (rate limit, input sanitization)
- [ ] Docker Compose (app + Postgres) — "herkes kursun" hedefi

**Not**: Faz 1 query'leri zaten `ownerId` ile filtreli olduğu için iş yükünün çoğu auth + Share tablosu; data layer'a dokunmak minimum.

---

## Faz 3 — AI Öneri & Otomasyon

**Hedef**: Mevcut kütüphaneye göre kişiselleştirilmiş öneri.

- [ ] `RecommendationService` (yeni service, mevcut yapıya eklenir)
- [ ] Yaklaşım seçimi (trade-off):

| Yaklaşım | Artı | Eksi |
|----------|------|------|
| LLM prompt (kitap listesi → öneri) | Hızlı kurulum, zengin gerekçe | API maliyeti, dış bağımlılık |
| Embedding + similarity (local) | Offline, ücretsiz çalışabilir | Vector store gerekir, soğuk başlangıç zayıf |
| Hibrit (embedding + LLM açıklama) | En iyi kalite | En karmaşık |

- [ ] Otomasyon: kitap eklenince otomatik metadata zenginleştirme (yazar/tür/kapak — harici kitap API'si: Open Library / Google Books)
- [ ] "Bunu beğendiysen şunlar" + "okuma listesi önerisi"
- [ ] Öneri kaynaklarını da adapter arkasına al (`RecommenderProvider`) → sağlayıcı değiştirilebilir

---

## Sıralama Mantığı

1. **Önce schema + adapter interface'leri** — yanlış kurulursa her faz acı çeker
2. **Sonra çalışan dikey dilim** (ekle→listele→göster) — erken geri bildirim
3. Polish ve telefon erişimi
4. Faz 2/3 yalnızca Faz 1 günlük kullanımda oturduktan sonra

## İlk Adım Önerisi

`prisma/schema.prisma` + adapter interface'lerini yaz, ardından tek bir dikey dilimi (kitap ekle + listele) uçtan uca çalıştır. Geri kalan her şey bu iskeletin üstüne oturur.
