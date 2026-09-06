/**
 * Seviye <-> paket eşlemesi sağlık kontrolü. `npm run check:levels`
 *
 * check-words.mjs kelime VERİSİNİ doğruluyor; bu dosya o veriyi seviyelere
 * bağlayan MANTIĞI doğruluyor. Buradaki hatalar sessiz olur: paket ilerleme
 * çubuğu yanlış paketi gösterir, paket bitirme ödülü yanlış kelimede (ya da
 * hiç) verilir, liste başa sarınca tamamlanmış paketler "sıfırlanmış" görünür.
 * Hiçbiri derlemede patlamaz, hepsi oyuncuya yanlış bilgi gösterir.
 *
 * 1293 seviyenin TAMAMINI tarıyor -- örnekleme değil, çünkü sınır hataları
 * tam olarak paket geçişlerinde saklanır.
 */
import { WORD_PACKS } from '../src/lib/wordPacks.ts';
import {
  packForLevel,
  packProgress,
  completesPack,
  isPackUnlocked,
  wordForLevel,
  TOTAL_WORDS,
} from '../src/lib/levels.ts';

const starts = [];
{
  let acc = 0;
  for (const p of WORD_PACKS) {
    starts.push(acc);
    acc += p.words.length;
  }
}

let bad = 0;
const chk = (cond, msg) => {
  if (!cond) {
    console.error('  HATA:', msg);
    bad++;
  }
};

// 1. Her paketin ilk ve son seviyesi kendi paketine düşmeli.
WORD_PACKS.forEach((pack, i) => {
  const first = starts[i];
  const last = starts[i] + pack.words.length - 1;
  chk(packForLevel(first).packIndex === i, `${pack.id}: ilk seviye yanlış pakette`);
  chk(packForLevel(last).packIndex === i, `${pack.id}: son seviye yanlış pakette`);
  chk(packForLevel(first).indexInPack === 0, `${pack.id}: ilk seviyenin paket içi indexi 0 değil`);
  chk(packForLevel(last).indexInPack === pack.words.length - 1, `${pack.id}: son index yanlış`);
});

// 2. completesPack YALNIZCA bir paketin son kelimesinde dönmeli -- erken
//    tetiklenirse ödül yanlış kelimede verilir, hiç tetiklenmezse paket
//    bitirmenin ödülü sessizce kaybolur.
let fired = 0;
for (let lvl = 0; lvl < TOTAL_WORDS; lvl++) {
  const done = completesPack(lvl);
  const isLast = starts.some((s, i) => lvl === s + WORD_PACKS[i].words.length - 1);
  if (done) fired++;
  chk(!!done === isLast, `seviye ${lvl}: completesPack=${done?.id ?? 'null'}, son-kelime=${isLast}`);
  if (done) chk(done.id === packForLevel(lvl).pack.id, `seviye ${lvl}: yanlış paket döndü (${done.id})`);
}
chk(fired === WORD_PACKS.length, `completesPack ${fired} kez tetiklendi, ${WORD_PACKS.length} olmalı`);

// 3. İlerleme çubuğu sınırları.
chk(packProgress(0, 0) === 0, 'ilk pakette 0. seviye = 0 ilerleme olmalı');
chk(
  packProgress(0, WORD_PACKS[0].words.length) === WORD_PACKS[0].words.length,
  'ilk paket kendi uzunluğunda tam bitmeli',
);
chk(packProgress(5, 0) === 0, 'ulaşılmamış paket 0 göstermeli');
// Liste başa sardığında hiçbir çubuk geri gitmemeli: oyuncunun bitirdiği
// paketleri "sıfırlanmış" göstermek yaptığı işi silmek olur.
WORD_PACKS.forEach((p, i) =>
  chk(packProgress(i, TOTAL_WORDS + 50) === p.words.length, `${p.id}: başa sarınca ilerleme geri gitti`),
);

// 4. Kilit mantığı.
chk(isPackUnlocked(0, 0), 'ilk paket her zaman açık olmalı');
chk(!isPackUnlocked(1, 0), 'ikinci paket 0. seviyede kilitli olmalı');
chk(isPackUnlocked(1, starts[1]), 'ikinci paket kendi başlangıcında açılmalı');

// 5. Başa sarma.
chk(wordForLevel(0).word === wordForLevel(TOTAL_WORDS).word, 'başa sarma çalışmıyor');
chk(wordForLevel(-1).word === wordForLevel(TOTAL_WORDS - 1).word, 'negatif seviye sarmıyor');

if (bad) {
  console.error(`\n${bad} hata.`);
  process.exit(1);
}
console.log(`${TOTAL_WORDS} seviye tarandı, ${fired} paket bitişi doğru yerde. Sorun yok.`);
