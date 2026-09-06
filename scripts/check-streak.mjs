/**
 * Seri kutlama kuralları sağlık kontrolü. `npm run check:streak`
 *
 * Buradaki hatalar iki uçtan biriyle görünür ve ikisi de oynayarak fark
 * edilmesi zordur: ya kutlama arka arkaya her kelimede çıkıp anlamını
 * yitirir, ya da hiç çıkmaz.
 *
 * 4. testteki AKIŞ SİMÜLASYONU özellikle önemli: ilk sürümdeki rekor kuralı
 * tek tek çağrılarda doğru görünüyordu ama gerçek akışta (bestStreak her
 * doğru cevapta yükseliyor) her kelimede kutlama veriyordu. Tek çağrıyı
 * değil, ARDIŞIK CEVAPLARI test etmek gerekiyor.
 */
import { seriKutlamasi, seriAktif, SERI_ESIGI, MAX_WRONG_ATTEMPTS } from '../src/lib/streak.ts';

let bad = 0;
const chk = (c, m) => { if (!c) { console.error('  HATA:', m); bad++; } };

/**
 * Gerçek oyun akışını taklit eder: art arda doğru cevaplar, her cevapta
 * bestStreak güncelleniyor, rekor bayrağı tur boyunca taşınıyor.
 * @returns her cevaptan sonraki kutlama türü dizisi (null = kutlama yok)
 */
function turSimule(baslangicEnIyi, cevapSayisi) {
  let seri = 0;
  let enIyi = baslangicEnIyi;
  let rekorKutlandi = false;
  const cikti = [];
  for (let n = 0; n < cevapSayisi; n++) {
    const oncekiEnIyi = enIyi;
    seri += 1;
    enIyi = Math.max(enIyi, seri); // completeLevel'in yaptığı
    const k = seriKutlamasi(seri, oncekiEnIyi, rekorKutlandi);
    // Sozlesme: rekorMu true olan HER kutlama rekoru bildirmis sayilir
    // ("Ilk serin!" ekrani da rekor kirildigini soyluyor).
    if (k?.rekorMu) rekorKutlandi = true;
    cikti.push(k ? (k.tur === 'carpan' ? `carpan x${k.carpan}` : k.tur) : null);
  }
  return cikti;
}

// 1. Eşiğin altında kutlama YOK.
for (let s = 0; s < SERI_ESIGI; s++) {
  chk(seriKutlamasi(s, 0, false) === null, `seri ${s} kutlama vermemeli (esik ${SERI_ESIGI})`);
  chk(!seriAktif(s), `seri ${s} aktif sayilmamali`);
}
chk(seriAktif(SERI_ESIGI), `seri ${SERI_ESIGI} aktif olmali`);

// 2. Hayattaki ilk seri -- tam eşikte ve önceki en iyi eşiğin altındayken.
{
  const k = seriKutlamasi(SERI_ESIGI, 0, false);
  chk(k?.tur === 'ilk', `ilk seri kutlamasi cikmali, ${k?.tur} geldi`);
  chk(k?.rekorMu === true, 'ilk seri ayni zamanda rekor olmali');
  chk(seriKutlamasi(SERI_ESIGI, 5, false) === null, 'rekoru 5 olana esikte kutlama cikmamali');
  chk(seriKutlamasi(SERI_ESIGI, SERI_ESIGI, false) === null, 'rekoru esige esit olana kutlama cikmamali');
  chk(seriKutlamasi(3, 2, false)?.tur === 'ilk', 'seri 3 / rekor 2 -> "ilk" olmali, "rekor" degil');
}

// 3. Çarpan eşikleri.
{
  const k7 = seriKutlamasi(7, 20, true);
  chk(k7?.tur === 'carpan' && k7.carpan === 2, `seri 7 -> carpan x2, ${JSON.stringify(k7)}`);
  const k15 = seriKutlamasi(15, 20, true);
  chk(k15?.tur === 'carpan' && k15.carpan === 3, `seri 15 -> carpan x3, ${JSON.stringify(k15)}`);
  chk(seriKutlamasi(7, 6, false)?.tur === 'carpan', 'seri 7 rekor bolgesinde de carpan gostermeli');
  chk(seriKutlamasi(7, 6, false)?.rekorMu === true, 'seri 7 rekor bolgesindeyse rekorMu true olmali');
}

// 4. GERÇEK AKIŞ -- kutlamayı değersizleştiren hata tam burada yakalanır.
{
  // Yepyeni oyuncu, 16 dogru cevap ust uste.
  const yeni = turSimule(0, 16);
  chk(yeni[2] === 'ilk', `3. cevapta "ilk" olmali, ${yeni[2]} geldi`);
  chk(yeni[6] === 'carpan x2', `7. cevapta carpan x2 olmali, ${yeni[6]} geldi`);
  chk(yeni[14] === 'carpan x3', `15. cevapta carpan x3 olmali, ${yeni[14]} geldi`);
  const beklenmeyen = yeni.map((v, i) => [i + 1, v]).filter(([n, v]) => v && ![3, 7, 15].includes(n));
  chk(beklenmeyen.length === 0, `yeni oyuncuda fazladan kutlama: ${JSON.stringify(beklenmeyen)}`);

  // Rekoru 4 olan oyuncu, 8 dogru cevap ust uste.
  // 5'te rekor kirilir (bir kez), 6'da HICBIR SEY, 7'de carpan, 8'de yine hicbir sey.
  const eski = turSimule(4, 8);
  chk(eski[4] === 'rekor', `5. cevapta rekor olmali, ${eski[4]} geldi`);
  chk(eski[5] === null, `6. cevapta kutlama OLMAMALI, ${eski[5]} geldi`);
  chk(eski[6] === 'carpan x2', `7. cevapta carpan olmali, ${eski[6]} geldi`);
  chk(eski[7] === null, `8. cevapta kutlama OLMAMALI, ${eski[7]} geldi`);
  const rekorSayisi = eski.filter((v) => v === 'rekor').length;
  chk(rekorSayisi === 1, `bir turda rekor kutlamasi 1 kez olmali, ${rekorSayisi} kez cikti`);

  // Uzun tur: rekoru 10 olan oyuncu 20 cevap. Rekor 1 kez, carpan 15'te 1 kez.
  const uzun = turSimule(10, 20);
  chk(uzun.filter((v) => v === 'rekor').length === 1, 'uzun turda rekor 1 kez olmali');
  chk(uzun.filter((v) => v === 'carpan x3').length === 1, 'uzun turda x3 carpani 1 kez olmali');
  chk(uzun.filter(Boolean).length <= 3, `uzun turda toplam kutlama cok fazla: ${uzun.filter(Boolean).length}`);
}

// 5. Rekor bayragi set edildikten sonra ayni tur icinde bir daha rekor YOK.
chk(seriKutlamasi(9, 8, true) === null, 'rekor zaten kutlandiysa tekrar cikmamali');

// 6. Tek yanlis hakki.
chk(MAX_WRONG_ATTEMPTS === 1, `MAX_WRONG_ATTEMPTS 1 olmali, ${MAX_WRONG_ATTEMPTS} geldi`);

if (bad) { console.error(`\n${bad} hata.`); process.exit(1); }
console.log(`Seri kurallari: esik ${SERI_ESIGI}, ${MAX_WRONG_ATTEMPTS} yanlis hakki, akis simulasyonu dahil. Sorun yok.`);
