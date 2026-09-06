/**
 * Aralıklı tekrar mantığı sağlık kontrolü. `npm run check:srs`
 *
 * Buradaki hatalar oyunda GÖRÜNMEZ ama öğrenmeyi sessizce bozar:
 * yanlış bilinen kelime uzun aralığa atılırsa bir daha haftalarca
 * sorulmaz; oturum sınırı çalışmazsa 300 kelimelik bir liste çıkar ve
 * oyuncu tekrarı hiç başlatmaz; aynı kelimenin iki kaydı ayrışırsa aynı
 * kelime aynı gün iki kez sorulur.
 */
import {
  ilkTekrar,
  sonrakiTekrar,
  ustalasti,
  tekrarBekleyenler,
  tekrarOturumu,
  dagarcikOzeti,
  USTA_KUTU,
  OTURUM_SINIRI,
} from '../src/lib/srs.ts';

const GUN = 86_400_000;
const T0 = 1_700_000_000_000; // sabit "şimdi" -- test saate göre değişmesin

let bad = 0;
const chk = (c, m) => { if (!c) { console.error('  HATA:', m); bad++; } };
const kelime = (word, box, dueAt) => ({ word, tr: word, learnedAt: T0, box, dueAt });

// 1. Yeni kelime: 1. kutu, yarın tekrar.
{
  const ilk = ilkTekrar(T0);
  chk(ilk.box === 1, `yeni kelime 1. kutuda olmalı, ${ilk.box} geldi`);
  chk(ilk.dueAt === T0 + GUN, 'yeni kelimenin tekrarı yarın olmalı');
}

// 2. Doğru cevap kutuyu yükseltir VE aralığı uzatır.
{
  let e = kelime('cat', 1, T0);
  let onceki = 0;
  for (let i = 1; i < USTA_KUTU; i++) {
    const n = sonrakiTekrar(e, true, T0);
    chk(n.box === i + 1, `${i}. kutudan sonra ${i + 1} bekleniyordu, ${n.box} geldi`);
    const aralik = n.dueAt - T0;
    chk(aralik > onceki, `aralık uzamadı: kutu ${n.box}, önceki ${onceki / GUN}g, yeni ${aralik / GUN}g`);
    onceki = aralik;
    e = { ...e, ...n };
  }
  // Son kutuda kalır, taşmaz.
  const tasma = sonrakiTekrar({ ...e, box: USTA_KUTU }, true, T0);
  chk(tasma.box === USTA_KUTU, `son kutu ${USTA_KUTU} aşıldı: ${tasma.box}`);
}

// 3. Yanlış cevap DOĞRUDAN 1. kutuya düşürür -- kademeli düşürmek unutulmuş
//    bir kelimeyi haftalarca tekrar dışında bırakırdı.
for (let box = 1; box <= USTA_KUTU; box++) {
  const n = sonrakiTekrar(kelime('dog', box, T0), false, T0);
  chk(n.box === 1, `yanlış cevapta ${box}. kutudan 1'e düşmeliydi, ${n.box} geldi`);
  chk(n.dueAt === T0 + GUN, 'yanlış bilinen kelime yarın tekrar sorulmalı');
}

// 4. Ustalaşmış kelime tekrar listesine GİRMEZ.
{
  const v = [kelime('a', USTA_KUTU, T0 - GUN), kelime('b', 2, T0 - GUN)];
  const bekleyen = tekrarBekleyenler(v, T0);
  chk(bekleyen.length === 1 && bekleyen[0].word === 'b', 'ustalaşmış kelime listeye girdi');
  chk(ustalasti(v[0]) && !ustalasti(v[1]), 'ustalasti() yanlış');
}

// 5. Vadesi GELMEMİŞ kelime listeye girmez.
{
  const v = [kelime('a', 1, T0 + GUN), kelime('b', 1, T0 - 1)];
  const bekleyen = tekrarBekleyenler(v, T0);
  chk(bekleyen.length === 1 && bekleyen[0].word === 'b', 'vadesi gelmemiş kelime listeye girdi');
}

// 6. Oturum sınırı + en gecikmiş önce.
{
  const v = Array.from({ length: 40 }, (_, i) => kelime(`w${i}`, 1, T0 - i * GUN));
  const oturum = tekrarOturumu(v, T0);
  chk(oturum.length === OTURUM_SINIRI, `oturum ${OTURUM_SINIRI} olmalı, ${oturum.length} geldi`);
  // w39 en eski vadeli (en gecikmiş) -> ilk sırada olmalı
  chk(oturum[0].word === 'w39', `en gecikmiş kelime ilk olmalı, ${oturum[0].word} geldi`);
  for (let i = 1; i < oturum.length; i++) {
    chk(oturum[i - 1].dueAt <= oturum[i].dueAt, 'oturum vadeye göre sıralı değil');
  }
}

// 7. Özet BENZERSİZ kelime üzerinden sayar ve en ileri kutuyu tutar --
//    liste başa sardığında aynı kelime dağarcığa ikinci kez ekleniyor.
{
  const v = [
    kelime('cat', 1, T0 - GUN),
    kelime('cat', 4, T0 + GUN), // aynı kelime, daha ileri kutu
    kelime('dog', USTA_KUTU, T0 - GUN),
  ];
  const o = dagarcikOzeti(v, T0);
  chk(o.toplam === 2, `benzersiz kelime 2 olmalı, ${o.toplam} geldi`);
  chk(o.usta === 1, `ustalaşan 1 olmalı, ${o.usta} geldi`);
  // 'cat' en ileri kaydıyla (kutu 4, vadesi gelmemiş) sayıldığı için bekleyen 0
  chk(o.bekleyen === 0, `bekleyen 0 olmalı (cat'in ileri kaydı geçerli), ${o.bekleyen} geldi`);
}

// 8. Boş dağarcık çökmemeli.
{
  const o = dagarcikOzeti([], T0);
  chk(o.toplam === 0 && o.usta === 0 && o.bekleyen === 0, 'boş dağarcık özeti yanlış');
  chk(tekrarOturumu([], T0).length === 0, 'boş dağarcıkta oturum boş olmalı');
}

// 9. Eski kayıt (box/dueAt yok) çökmemeli -- göç öncesi state okunabilir.
{
  const eski = [{ word: 'old', tr: 'eski', learnedAt: T0 }];
  chk(tekrarBekleyenler(eski, T0).length === 1, 'alanı olmayan eski kayıt tekrara girmeli');
  chk(sonrakiTekrar(eski[0], true, T0).box === 2, 'alanı olmayan kayıt doğru cevapta 2. kutuya gitmeli');
}

if (bad) { console.error(`\n${bad} hata.`); process.exit(1); }
console.log(`Aralıklı tekrar: 9 senaryo, ${USTA_KUTU} kutu, oturum sınırı ${OTURUM_SINIRI}. Sorun yok.`);
