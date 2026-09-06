/**
 * Yazı tiplerini Google'dan indirip public/fonts/ altına yerleştirir ve
 * src/fonts.css'i üretir. `npm run fonts`
 *
 * NEDEN KENDİMİZ BARINDIRIYORUZ:
 *
 * 1. GİZLİLİK BEYANIMIZ. public/gizlilik.html'de "üçüncü taraf izleme yok"
 *    yazıyor. Yazı tipleri fonts.googleapis.com'dan çekilirken her
 *    kullanıcının IP adresi Google'a gidiyordu -- yani beyan ile gerçek
 *    örtüşmüyordu. Kendimiz barındırınca beyan doğru hale geliyor.
 *
 * 2. ÇEVRİMDIŞI. Oyun çevrimdışı çalışıyor ama ağ yokken yazı tipleri
 *    inmiyor ve arayüz yedek sistem fontuna düşüyordu -- Play Store'a
 *    çıkacak bir uygulamada kabul edilemez.
 *
 * 3. HIZ. Üçüncü bir alan adına DNS + TLS + istek zinciri, üstelik
 *    render'ı bloklayan bir stylesheet olarak.
 *
 * İKİ ÖNEMLİ KÜÇÜLTME:
 *
 * - Yalnızca latin + latin-ext. Türkçe'nin ğ/ş/ı/İ/ç/ö/ü harfleri
 *   latin-ext'te; Kiril/Devanagari/Vietnamca alt kümeleri bu oyunda asla
 *   kullanılmayacak.
 * - DEĞİŞKEN FONT TEKİLLEŞTİRME: Google, bir ailenin her ağırlığı için
 *   AYNI değişken font dosyasını veriyor (md5 ile doğrulandı). Naif bir
 *   indirici aynı 38 KB'ı dört kez kaydedip 410 KB yazıyordu; dosyaları
 *   içeriğe göre tekilleştirip @font-face'te ağırlık ARALIĞI ilan edince
 *   132 KB'a düşüyor. Tarayıcı aradaki ağırlıkları dosyadan kendisi üretir.
 */
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
// Yalnızca gerçekten kullanılan ağırlıklar (kod taraması: extrabold/bold/
// semibold + gövde için normal).
const URL =
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;600;700;800&display=swap';
const TUTULAN_ALTKUMELER = ['latin', 'latin-ext'];

// Eski çalıştırmalardan kalan dosyalar birikmesin.
try {
  for (const f of readdirSync('public/fonts')) rmSync(`public/fonts/${f}`);
} catch {
  /* klasör henüz yok */
}
mkdirSync('public/fonts', { recursive: true });

const css = await (await fetch(URL, { headers: { 'User-Agent': UA } })).text();

// Google'ın CSS'i her @font-face'in önüne "/* latin */" gibi bir yorum koyuyor.
const bloklar = css
  .split('/*')
  .slice(1)
  .map((b) => ({
    altkume: b.slice(0, b.indexOf('*/')).trim(),
    govde: b.slice(b.indexOf('*/') + 2),
  }))
  .filter((b) => TUTULAN_ALTKUMELER.includes(b.altkume));

/** hash -> { dosya, aile, altkume, unicodeRange, agirliklar[] } */
const dosyalar = new Map();
let toplamBayt = 0;

for (const { altkume, govde } of bloklar) {
  const aile = govde.match(/font-family:\s*'([^']+)'/)?.[1];
  const agirlik = Number(govde.match(/font-weight:\s*(\d+)/)?.[1]);
  const kaynak = govde.match(/url\((https:\/\/[^)]+\.woff2)\)/)?.[1];
  if (!aile || !agirlik || !kaynak) continue;

  const veri = Buffer.from(await (await fetch(kaynak)).arrayBuffer());
  const hash = createHash('md5').update(veri).digest('hex').slice(0, 8);

  const mevcut = dosyalar.get(hash);
  if (mevcut) {
    mevcut.agirliklar.push(agirlik); // aynı değişken font, sadece ağırlık ekle
    continue;
  }
  const dosya = `${aile.replace(/\s+/g, '')}-${altkume}-${hash}.woff2`;
  writeFileSync(`public/fonts/${dosya}`, veri);
  toplamBayt += veri.length;
  dosyalar.set(hash, {
    dosya,
    aile,
    altkume,
    unicodeRange: govde.match(/unicode-range:\s*([^;]+);/)?.[1]?.trim() ?? '',
    agirliklar: [agirlik],
    boyut: veri.length,
  });
}

let cikti = `/* OTOMATİK ÜRETİLDİ -- elle düzenleme. Yeniden üretmek: npm run fonts
   Kaynak: ${URL}
   Yalnızca ${TUTULAN_ALTKUMELER.join(' + ')} (Türkçe için yeterli).
   Ağırlıklar aralık olarak ilan ediliyor: bunlar DEĞİŞKEN font, tek dosya
   aradaki bütün ağırlıkları üretiyor. */\n\n`;

for (const f of dosyalar.values()) {
  const min = Math.min(...f.agirliklar);
  const max = Math.max(...f.agirliklar);
  cikti += `@font-face {
  font-family: '${f.aile}';
  font-style: normal;
  font-weight: ${min === max ? min : `${min} ${max}`};
  /* swap: font inerken metin GÖRÜNMEZ kalmaz, yedekle çizilip sonra
     değişir -- boş ekran her zaman daha kötü. */
  font-display: swap;
  src: url('/fonts/${f.dosya}') format('woff2');
  unicode-range: ${f.unicodeRange};
}\n\n`;
  console.log(
    `  ${f.dosya.padEnd(34)} ${(f.boyut / 1024).toFixed(1).padStart(5)} KB  ` +
      `agirlik ${min === max ? min : `${min}-${max}`}`,
  );
}

writeFileSync('src/fonts.css', cikti, 'utf8');
console.log(
  `\n${bloklar.length} @font-face -> ${dosyalar.size} dosya (tekillestirildi), ` +
    `toplam ${(toplamBayt / 1024).toFixed(0)} KB.`,
);
