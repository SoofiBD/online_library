# GSAP Animasyonları — Tasarım

Tarih: 2026-06-03

## Amaç
Biblio (kişisel kütüphane) uygulamasına GSAP ile ince ve hızlı animasyonlar
eklemek. Mobil öncelikli, akıcı, rahatsız etmeyen mikro etkileşimler.

## Teknik yaklaşım
- `gsap` + `@gsap/react` (`useGSAP` hook) kullanılır. `useGSAP` otomatik
  cleanup ve scope yönetimi sağlar; React 19 / Next 16 ile uyumlu.
- Animasyonlu parçalar `"use client"`. Server component'lerin veri akışı
  değişmez; animasyon yalnızca sunum katmanında.
- Tüm animasyonlar `prefers-reduced-motion: reduce` ayarına saygı duyar:
  ayar açıksa animasyon atlanır, içerik anında görünür.

## Tarz sabitleri (`src/lib/animations.ts`)
- süre: `0.3s` (giriş), easing: `power2.out`
- stagger: `0.04s`
- `prefersReducedMotion()` yardımcı fonksiyonu

## Alanlar
1. **Kitap listesi girişi** — `AnimatedBookList` (client) mevcut `BookList`'i
   sarmalar. Kartlar `opacity 0→1`, `y 12→0`, stagger ile belirir. Liste
   yeniden render olunca (arama/filtre) tekrar oynar (key bağımlılığı).
2. **Kitap kartı hover/tap** — `BookCard` üzerinde hover'da hafif `scale` +
   kapak gölgesi (CSS destekli, hafif).
3. **Sayfa geçiş / detay** — `FadeIn` (client) sarmalayıcı; detay sayfasında
   başlık/kapak/notlar açılışta yumuşakça belirir.
4. **Form & buton geri bildirimi** — Kaydet/+Ekle butonlarında tap'te `scale`
   pulse; `StarRating` seçiminde küçük pop; kapak yüklenince önizleme fade.

## Dosyalar
- `package.json` — `gsap`, `@gsap/react` (kuruldu)
- `src/lib/animations.ts` — yeni
- `src/components/AnimatedBookList.tsx` — yeni (client)
- `src/components/FadeIn.tsx` — yeni (client)
- `src/app/page.tsx` — `AnimatedBookList` kullan
- `src/app/books/[id]/page.tsx` — `FadeIn` sarmala
- `src/components/BookCard.tsx`, `BookForm.tsx`, `StarRating.tsx` — mikro etkiler

## Kapsam dışı (YAGNI)
- Scroll-trigger / parallax
- Sayfalar arası route geçiş animasyonu (Next geçişi olduğu gibi kalır)
- Tema/karanlık mod geçiş animasyonu
