# WordDash — Kelime Tekerleği

Daire şeklindeki harf tekerleğinden İngilizce kelimeler kurduğun, Türkçe
ipuçlarıyla öğrendiğin, seviye atlayıp jetonla tema açtığın bir dil
öğrenme oyunu. Wordscapes / Word Cookies tarzı tekerlek mekaniği + çeviri
egzersizi.

Afsar Gym Lab ile **aynı teknoloji seçimi**, ama tamamen ayrı bir proje —
ayrı klasör, ayrı git geçmişi, ayrı (henüz kurulmamış) Supabase projesi.

## Oyun nasıl çalışıyor?

- **Harf tekerleği** ([`WordWheel.tsx`](src/components/WordWheel.tsx)):
  harfler bir çember üzerinde durur, basılı tutup sürükleyerek harften
  harfe geçer, parmağını kaldırınca seçtiğin harfler tahmin olarak
  gönderilir. Geometri tamamen matematikle hesaplanır (DOM sorgusu yok),
  dokunmatik ekranda tek elle rahat kullanılır.
- **Türkçe ipucu modu** (varsayılan **AÇIK**): açıkken kelimenin Türkçe
  karşılığı tekerlekten önce gösterilir — oyun "harfleri karıştır"
  bulmacasından "Türkçesini bil, İngilizcesini kur" çeviri egzersizine
  dönüşür. Üstteki düğmeyle kapatılıp saf anagram moduna geçilebilir.
- **Seviye ilerlemesi** ([`levels.ts`](src/lib/levels.ts)): sınırsız, art
  arda kelime çözersin; liste bitince baştan döner. Zorluk harf sayısına
  göre kolay/orta/zor rozetiyle gösterilir.
- **Jeton + tema mağazası** ([`themes.ts`](src/lib/themes.ts)): her doğru
  cevap +10 jeton (ipucu kullandıysan −3). Jetonla 5 görsel temadan
  (Aurora ücretsiz, diğerleri 50–150) satın alıp seçebilirsin.
- **Kelime dağarcığım**: çözdüğün her kelime tarihiyle birlikte listeye
  eklenir. **Seri (streak)**: ipucu kullanmadan art arda doğru bilme sayısı,
  en iyisi kalıcı tutulur.
- **TR/EN arayüz dili** ([`i18n.ts`](src/lib/i18n.ts)): metin yüzeyi küçük
  olduğu için context yerine saf `t(key, lang)` fonksiyonu.

## Komutlar

```
npm run dev      # Vite dev sunucusu (http://localhost:5173)
npm run build    # production build (tsc -b + vite build)
npm run lint     # oxlint
npm run preview  # build'i yerelde önizle
```

Ayrı test/typecheck script'i yok (proje küçük) — build zaten `tsc -b`
içeriyor, tip hatası varsa build patlar.

## Mimari kararlar

- **Vite + React 19 + TypeScript + Tailwind v4.** Tailwind v4, v3'ten
  farklı çalışıyor: `tailwind.config.js` yok, PostCSS yok —
  `@tailwindcss/vite` eklentisi `vite.config.ts`'e ekli, `src/index.css`'te
  tek satır `@import "tailwindcss";` yeterli. Not: temaların Tailwind
  sınıfları [`themes.ts`](src/lib/themes.ts)'te **harfi harfine** yazılı
  (string birleştirme yok) — Tailwind sadece kaynakta gerçekten görünen
  sınıfları derler, `bg-${x}-950` gibi dinamik birleştirme sessizce kaybolur.
- **Hesap sistemi YOK (bilinçli).** Seri, kelime dağarcığı, jeton, tema ve
  dil tercihi `localStorage`'da (`src/lib/storage.ts`, anahtar
  `worddash_state_v2`). Sebep: önce temel oyun döngüsünün tutup tutmadığını
  görmek, kayıt ekranı inşa etmeden önce. Tutarsa Afsar Gym Lab'daki gibi
  Supabase eklenecek — ama **ayrı bir Supabase projesiyle**, mevcut projenin
  kullanıcı/veri tabanına hiç karışmadan.
- **Seviye tabanlı, günlük kilit yok (v2).** v1 "günde bir kelime" (Wordle
  mantığı) kullanıcıyı sınırlıyordu — bir kere çözünce yapacak şey
  kalmıyordu. v2 sınırsız ilerleme veriyor. v1'den kalan kelime dağarcığı
  varsa `storage.ts` içindeki migrasyon onu v2'ye taşıyor.
- **Kelime listesi** ([`wordList.ts`](src/lib/wordList.ts)): 198 kelime,
  2–10 harf, **artan zorlukta sıralı** (dizideki sıra = oyundaki zorluk
  eğrisi). Her kelime İngilizce + Türkçe karşılığıyla. Yeni kelime eklerken
  tek kural: doğru uzunluk grubunun içine ekle.

## Yapılacaklar

- **Deploy.** Henüz hiçbir yere yayınlanmadı. Ücretsiz bir Vercel/Netlify
  alt alan adına deploy edilmesi lazım — hem telefonda test, hem de aşağıdaki
  TWA adımının ön koşulu.
- **Android'e TWA olarak paketleme.** Afsar Gym Lab'da kullandığımız
  Bubblewrap akışı burada da aynen uygulanabilir; önce yukarıdaki deploy
  şart (Bubblewrap 512×512 PNG ikonu ağdan okuyor —
  [`public/icons/icon-512.png`](public/icons/icon-512.png) hazır).
- **Kelime listesini büyütmek / temalandırmak** (ör. yiyecek, hayvan,
  seyahat paketleri) düşünülebilir. Şu an 198 kelime, tek havuz.

## Görsel kimlik

Uygulama ikonu hazır: aurora gradyan zemin üzerinde tekerlek halkası + "W"
monogramı. Kaynaklar:

- [`public/favicon.svg`](public/favicon.svg) — tarayıcı sekmesi ikonu (vektör).
- `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` —
  PWA manifest ikonları (maskable sürüm güvenli bölgeye göre daha bol
  boşluklu). Windows `System.Drawing` ile üretildi; yeniden üretmek için
  tasarım tek dosyada parametrik.
