/**
 * Yedekleme/kurtarma sağlık kontrolü. `npm run check:cloudsave`
 *
 * İki sınıf hatayı kovalıyor, ikisi de oynayarak fark edilmesi zor:
 *
 * 1. KOD. Kod elle bir telefondan diğerine yazılıyor. Alfabede
 *    karışabilecek harf (0/O, 1/I/L) olması, kodun kısa olması ya da
 *    rastgeleliğin zayıf olması ancak iş işten geçtikten sonra anlaşılır.
 *
 * 2. AĞDAN GELEN KAYIT. `guvenliDurum` sunucudan gelen JSON'u oyunun
 *    beklediği şekle sokuyor. Bir alan eksik geçerse oyun beyaz ekrana
 *    düşer -- hem de tam kurtarma anında, yani oyuncunun her şeyini
 *    kaybettiğini sandığı anda. Bozuk girdilerle burada zorlanıyor.
 */
import { kodUret, kodNormalle, kodBicimle, guvenliDurum } from '../src/lib/cloudSave.ts';
import { DEFAULT_STATE } from '../src/lib/storage.ts';

let bad = 0;
const chk = (c, m) => { if (!c) { console.error('  HATA:', m); bad++; } };

// 1. Kod alfabesi ve uzunluğu.
{
  const kod = kodUret();
  chk(kod.length === 12, `kod 12 karakter olmali, ${kod.length} geldi`);
  chk(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/.test(kod), `kod alfabe disi karakter tasiyor: ${kod}`);
  // Karışan harfler ASLA üretilmemeli -- elle yazımda en sık hata kaynağı.
  chk(!/[01OIL]/.test(kod), `kod karisabilen harf iceriyor: ${kod}`);
}

// 2. Rastgelelik: 500 kod, hepsi farklı olmalı ve alfabe geniş kullanılmalı.
{
  const kodlar = new Set();
  const harfler = new Set();
  for (let i = 0; i < 500; i++) {
    const k = kodUret();
    kodlar.add(k);
    for (const c of k) harfler.add(c);
  }
  chk(kodlar.size === 500, `500 kodun ${500 - kodlar.size} tanesi tekrarladi -- rastgelelik bozuk`);
  chk(harfler.size >= 28, `alfabenin yalnizca ${harfler.size}/31 harfi kullanildi -- dagilim bozuk`);
}

// 3. Normalleştirme: kullanıcı nasıl yazarsa yazsın aynı koda varmalı.
{
  const kod = 'ABCD2345EFGH';
  const yazimlar = [kod, kod.toLowerCase(), kodBicimle(kod), ` ${kodBicimle(kod).toLowerCase()} `, kod.split('').join(' ')];
  for (const y of yazimlar) {
    chk(kodNormalle(y) === kod, `"${y}" -> ${kodNormalle(y)}, beklenen ${kod}`);
  }
  chk(kodBicimle(kod) === 'ABCD-2345-EFGH', `bicimleme yanlis: ${kodBicimle(kod)}`);
}

// 4. Bozuk/eksik kayıtlar oyunu çökertmemeli.
{
  const bozuklar = [
    null,
    undefined,
    {},
    { level: -5, coins: 'cok', vocabulary: 'dizi degil' },
    { level: 1.7, vocabulary: [{ word: 'cat' }, { tr: 'kedi' }, { word: 'dog', tr: 'kopek' }] },
    { unlockedThemes: [1, 'ocean', null], activeTheme: 42, lang: 'de' },
    { coins: Number.NaN, level: Number.POSITIVE_INFINITY, dailyStreak: -3 },
  ];
  for (const ham of bozuklar) {
    const s = guvenliDurum(ham);
    const etiket = JSON.stringify(ham);
    for (const alan of Object.keys(DEFAULT_STATE)) {
      chk(alan in s, `${etiket}: "${alan}" alani eksik kaldi`);
    }
    chk(Number.isInteger(s.level) && s.level >= 0, `${etiket}: level gecersiz -> ${s.level}`);
    chk(Number.isInteger(s.coins) && s.coins >= 0, `${etiket}: coins gecersiz -> ${s.coins}`);
    chk(Array.isArray(s.vocabulary), `${etiket}: vocabulary dizi degil`);
    chk(
      s.vocabulary.every((v) => typeof v.word === 'string' && typeof v.tr === 'string'),
      `${etiket}: eksik alanli kelime suzulmedi`,
    );
    chk(Array.isArray(s.unlockedThemes) && s.unlockedThemes.every((x) => typeof x === 'string'),
      `${etiket}: unlockedThemes temizlenmedi`);
    chk(s.lang === 'tr' || s.lang === 'en', `${etiket}: lang gecersiz -> ${s.lang}`);
  }
}

// 5. Geçerli bir kayıt AYNEN korunmalı -- temizleyici veri yememeli.
{
  const gercek = {
    ...DEFAULT_STATE,
    level: 128,
    coins: 340,
    vocabulary: [{ word: 'apple', tr: 'elma', learnedAt: 1, box: 3, dueAt: 2 }],
    unlockedThemes: ['aurora', 'ocean'],
    activeTheme: 'ocean',
    lang: 'en',
  };
  const s = guvenliDurum(gercek);
  chk(s.level === 128 && s.coins === 340, 'gecerli sayilar degisti');
  chk(s.vocabulary.length === 1 && s.vocabulary[0].box === 3, 'gecerli kelime kaybedildi');
  chk(s.unlockedThemes.join(',') === 'aurora,ocean', 'temalar degisti');
  chk(s.activeTheme === 'ocean' && s.lang === 'en', 'tema/dil degisti');
}

if (bad) { console.error(`\n${bad} hata.`); process.exit(1); }
console.log('Yedekleme: 12 karakterlik kod, 500 benzersiz uretim, 7 bozuk kayit senaryosu. Sorun yok.');
