/**
 * Kelime havuzu sağlık kontrolü. `npm run check:words`
 *
 * wordPacks.ts elle yazılan, artık BİNİN üzerinde satırlık bir veri dosyası --
 * bu boyutta mükerrer kelimeyi ya da tekerleğe sığmayan bir kelimeyi gözle
 * yakalamak mümkün değil. Oyunda sessizce bozulan şeyler bunlar:
 *   - aynı kelime iki pakette -> oyuncu "bunu zaten çözmüştüm" der, içerik
 *     hacmi göründüğünden az olur
 *   - 10+ harf -> WordWheel geometrisi harfleri üst üste bindirir
 *   - a-z dışı karakter -> tekerlek o harfi çizemez, kelime çözülemez hale gelir
 *   - boş Türkçe karşılık -> ipucu modunda hiçbir şey görünmez
 *
 * Bulduğu her sorunu yazıp çıkış kodu 1 ile biter, sessizce geçmez.
 *
 * wordPacks.ts'i Node'un yerel tip soyma özelliğiyle doğrudan içe aktarıyor;
 * dosyanın hiç import'u olmadığı için `@/` gibi bir yol çözümlemesine gerek
 * kalmıyor (aynı numara Afsar Gym Lab'daki gen-builtin-programs.mjs'te de var).
 */
import { WORD_PACKS } from '../src/lib/wordPacks.ts';

const MIN_LEN = 2;
const MAX_LEN = 9; // WordWheel 10 harfte harfleri üst üste bindiriyor

const problems = [];
/** kelime -> onu ilk içeren paket (mükerrer tespiti için) */
const seen = new Map();

for (const pack of WORD_PACKS) {
  if (!pack.id || !pack.name || !pack.nameEn || !pack.icon) {
    problems.push(`paket "${pack.id ?? '?'}": id/name/nameEn/icon alanlarından biri eksik`);
  }

  for (const { word, tr } of pack.words) {
    const where = `${pack.id} / "${word}"`;

    if (!/^[a-z]+$/.test(word)) {
      problems.push(`${where}: yalnızca küçük a-z olmalı`);
    }
    if (word.length < MIN_LEN || word.length > MAX_LEN) {
      problems.push(`${where}: ${word.length} harf -- ${MIN_LEN}-${MAX_LEN} arası olmalı`);
    }
    if (!tr || !tr.trim()) {
      problems.push(`${where}: Türkçe karşılık boş`);
    }

    const first = seen.get(word);
    if (first) {
      problems.push(`${where}: "${word}" zaten "${first}" paketinde var (mükerrer)`);
    } else {
      seen.set(word, pack.id);
    }
  }
}

// Paket içi sıra = zorluk eğrisi. Kısa kelimeden uzuna gitmeli, yoksa
// oyuncu paketin ortasında 9 harfli bir kelimeye çarpıp duvara toslar.
for (const pack of WORD_PACKS) {
  for (let i = 1; i < pack.words.length; i++) {
    const prev = pack.words[i - 1].word.length;
    const cur = pack.words[i].word.length;
    if (cur < prev) {
      problems.push(
        `${pack.id}: "${pack.words[i].word}" (${cur} harf) "${pack.words[i - 1].word}" (${prev} harf) sonrasında -- paket içi sıra kısadan uzuna olmalı`,
      );
    }
  }
}

const total = WORD_PACKS.reduce((n, p) => n + p.words.length, 0);

console.log(`${WORD_PACKS.length} paket, ${total} kelime, ${seen.size} benzersiz.`);
for (const p of WORD_PACKS) {
  const lens = p.words.map((w) => w.word.length);
  console.log(
    `  ${p.icon} ${p.id.padEnd(11)} ${String(p.words.length).padStart(3)} kelime  ` +
      `(${Math.min(...lens)}-${Math.max(...lens)} harf)`,
  );
}

if (problems.length) {
  console.error(`\n${problems.length} sorun:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('\nSorun yok.');
