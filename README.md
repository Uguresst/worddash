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
- **Konu paketleri** ([`wordPacks.ts`](src/lib/wordPacks.ts)): 18 paket,
  **1.293 kelime**. Temel'den başlayıp yiyecek, hayvanlar, ev, vücut, aile,
  giyim, doğa, şehir, seyahat, okul, meslekler, zaman, spor, teknoloji,
  duygular, fiiller ve sıfatlara gidiyor. İlgili kelimelerin art arda
  gelmesi hem hatırlamayı kolaylaştırıyor hem de oyuna görünür bir hedef
  veriyor.
- **Paket haritası** ([`PackMap.tsx`](src/components/PackMap.tsx)): 18
  paketin tamamı, kilitliler dahil, adı ve ikonuyla görünüyor. Kilitli paket
  bir ceza değil **reklam** -- oyuncuya sonraki oturumun sebebini veriyor.
  Bir paketi bitirmek +40 jeton (tek kelime +2 iken).
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
npm run dev           # Vite dev sunucusu (http://localhost:5173)
npm run build         # production build (tsc -b + vite build)
npm run lint          # oxlint
npm run preview       # build'i yerelde önizle
npm run check:words   # kelime havuzu: mükerrer, harf sınırı, zorluk sırası
npm run check:levels  # seviye <-> paket eşlemesi (1.293 seviyenin tamamı)
npm run check         # yukarıdakilerin hepsi + tsc + oxlint
npm run store:assets  # Play Console görselleri (önce build + preview gerekir)
```

Ayrı bir test koşucusu yok ama **iki mekanik doğrulayıcı var** ve ikisi de
gözle yakalanamayacak hataları yakalamak için yazıldı:

- [`check-words.mjs`](scripts/check-words.mjs) — 1.293 kelimelik elle
  yazılmış bir veri dosyasında mükerrer kelimeyi ya da tekerleğe sığmayan
  bir kelimeyi gözle bulmak mümkün değil. İlk çalıştırmada 11 mükerrer
  kelime + 8 sıralama hatası buldu.
- [`check-levels.mjs`](scripts/check-levels.mjs) — seviye/paket
  eşlemesinin **tamamını** tarıyor (örnekleme değil; sınır hataları tam
  olarak paket geçişlerinde saklanır). Bu hataların hiçbiri derlemede
  patlamaz, hepsi oyuncuya sessizce yanlış bilgi gösterirdi.

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
- **Kelime içeriği** ([`wordPacks.ts`](src/lib/wordPacks.ts)): 18 paket,
  1.293 kelime, 2–9 harf. Paket sırası ve paket içi sıra **zorluk eğrisidir**.
  Kelime eklerken kurallar `npm run check:words` tarafından zorlanıyor:
  yalnızca küçük a-z, 2–9 harf, hiçbir kelime iki pakette birden, Türkçe
  karşılık tek ve net.
- **`state.level` tek küresel sayaç olarak KALDI**, paketler onun üstüne
  türetiliyor ([`levels.ts`](src/lib/levels.ts)). Ayrı bir "hangi
  paketteyim" state'i yok. Sebep: mevcut localStorage kayıtları ve lider
  tablosundaki `best_level` hiçbir göç gerektirmeden çalışmaya devam
  ediyor, rozet metrikleri de hâlâ geri gidemeyen tek bir sayıya bakıyor
  (bkz. `achievements.ts`).

## Play Store

Mağaza metinleri, veri güvenliği formu cevapları, içerik derecelendirme
cevapları ve adım adım yayına alma sırası: **[`store/magaza-metni.md`](store/magaza-metni.md)**.

Görseller `store/` içinde hazır (öne çıkan görsel 1024×500, beş telefon
ekran görüntüsü 1080×1920); `npm run store:assets` ile yeniden üretiliyor.

### Gizlilik ve veri silme

[`public/gizlilik.html`](public/gizlilik.html) — TR + EN, Play Console'un
zorunlu tuttuğu canlı URL. Toplanan verinin tamamı sayılıyor.

Google, hesap oluşturan uygulamalarda (WordDash'in anonim `auth.users`
satırı da buna dahil) **uygulama içinden** ulaşılabilir bir silme yolu şart
koşuyor. Rekabet sekmesindeki "Lider tablosundan ayrıl" bunu karşılıyor.

> **Dikkat:** İlk lider tablosu göçünde SELECT/INSERT/UPDATE politikaları
> vardı ama **DELETE yoktu** — RLS açık bir tabloda politikası olmayan işlem
> varsayılan olarak reddedilir, yani silme sessizce başarısız oluyordu.
> `20260906090000_leaderboard_self_delete.sql` **elle çalıştırılmalı**
> (projede bağlı CLI yok). Çalıştırılmazsa veri silme beyanı yalan olur.

## Yapılacaklar

- ~~**Deploy.**~~ **Bitti** — [worddash-seven.vercel.app](https://worddash-seven.vercel.app),
  GitHub'a bağlı ([github.com/Uguresst/worddash](https://github.com/Uguresst/worddash)),
  push'ta otomatik yeniden deploy oluyor (Afsar Gym Lab'la aynı akış).
- ~~**Kelime listesini büyütmek / temalandırmak.**~~ **Bitti** — 198 → 1.293
  kelime, 18 konu paketi.
- **Android'e TWA olarak paketleme.** Bubblewrap akışı hazır, sıra
  `store/magaza-metni.md` 8. bölümdeki adımlarda. Parmak izleri için
  [`public/.well-known/README.txt`](public/.well-known/README.txt).

## Görsel kimlik

Uygulama ikonu hazır: aurora gradyan zemin üzerinde tekerlek halkası + "W"
monogramı. Kaynaklar:

- [`public/favicon.svg`](public/favicon.svg) — tarayıcı sekmesi ikonu (vektör).
- `public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png` —
  PWA manifest ikonları (maskable sürüm güvenli bölgeye göre daha bol
  boşluklu). Windows `System.Drawing` ile üretildi; yeniden üretmek için
  tasarım tek dosyada parametrik.
