# WordDash — Daily Word Scramble

Günün İngilizce kelimesini karışık harflerden çözdüğün, seri (streak) tuttuğun
ve çözdükçe kişisel kelime dağarcığı biriktiren bir dil öğrenme oyunu.
Afsar Gym Lab ile **aynı teknoloji seçimi**, ama tamamen ayrı bir proje —
ayrı klasör, ayrı git geçmişi, ayrı (henüz kurulmamış) Supabase projesi.

## Komutlar

```
npm run dev      # Vite dev sunucusu
npm run build    # production build
npm run lint     # oxlint
```

Henüz test/typecheck script'i yok (proje küçük) — build zaten `tsc -b` içeriyor,
tip hatası varsa build patlar.

## Mimari kararlar

- **Vite + React 19 + TypeScript + Tailwind v4.** Tailwind v4, v3'ten farklı
  çalışıyor: `tailwind.config.js` yok, PostCSS yok — `@tailwindcss/vite`
  eklentisi `vite.config.ts`'e ekli, `src/index.css`'te tek satır
  `@import "tailwindcss";` yeterli.
- **Hesap sistemi YOK (v1'de bilinçli).** Seri, kelime dağarcığı ve dil
  tercihi `localStorage`'da (`src/lib/storage.ts`). Sebep: önce temel oyun
  döngüsünün (günlük kelime → çöz → seri) tutup tutmadığını görmek, kayıt
  ekranı inşa etmeden önce. Tutarsa Afsar Gym Lab'daki gibi Supabase
  eklenecek — ama **ayrı bir Supabase projesiyle**, mevcut projenin
  kullanıcı/veri tabanına hiç karışmadan.
- **Günün kelimesi deterministik** (`src/lib/dailyWord.ts`): sabit bir
  epoch tarihinden bugüne kaç gün geçtiğini sayıp kelime listesinin
  uzunluğuna göre mod alıyor — Wordle'ın yaptığı gibi. Herkes aynı gün
  aynı kelimeyi görüyor, sunucu/backend gerektirmiyor.
- **Kelime listesi** (`src/lib/wordList.ts`): şu an 60 kelime, İngilizce +
  Türkçe karşılığıyla. Büyütülmesi gerekecek — 60 günde liste baştan
  dönüyor.

## Yapılacaklar (henüz eksik)

- **Uygulama ikonu / logo yok.** `vite.config.ts`'teki PWA manifest'i
  `/icons/icon-192.png` vb. dosyalara işaret ediyor ama bu dosyalar henüz
  yok — bir marka/görsel kimlik kararı gerekiyor (Afsar Gym Lab'daki gibi).
- **Android'e TWA olarak paketleme** — Afsar Gym Lab'da kullandığımız
  Bubblewrap akışı burada da aynen uygulanabilir, ama önce bir web
  adresine (ücretsiz Vercel/Netlify alt alan adı yeterli) deploy edilmesi
  lazım.
- **Kelime listesini büyütmek** ve zorluk seviyelerine ayırmak
  (başlangıç/orta/ileri) düşünülebilir.
