import type { VocabEntry } from './storage';

/**
 * Aralıklı tekrar (spaced repetition) -- Leitner kutu sistemi.
 *
 * NEDEN VAR: oyun "İngilizce öğret" iddiasında ama v3'e kadar öğrenmenin
 * tek kanıtı, çözülen kelimenin tarihiyle birlikte bir listeye eklenmesiydi.
 * O bir DEFTER, öğretme değil. Bir kelimeyi bir kez bilmek onu öğrenmek
 * demek değil; unutma eğrisinin üstesinden gelen tek yöntem, kelimeyi
 * ARTAN ARALIKLARLA tekrar görmek.
 *
 * İkinci sebep aynı ölçüde önemli: oyuna yarın geri dönmek için somut bir
 * sebep veriyor. "Bugün 12 kelimen tekrara hazır" cümlesi, günlük jeton
 * ödülünden çok daha güçlü bir açılış sebebi -- çünkü kaybedilen şey jeton
 * değil, kullanıcının kendi emeğiyle öğrendiği kelimeler.
 *
 * NEDEN LEITNER (SM-2 yerine): kutular tam sayı, aralıklar sabit, durum tek
 * bir küçük sayıda tutuluyor. SM-2'nin kolaylık faktörü (ondalık, her
 * cevapta yeniden hesaplanan) buradaki veri modeline değmez -- oyuncu
 * kendine "kolay/zor" notu vermiyor, sadece bildi ya da bilemedi.
 */

/** Kutu -> bir sonraki tekrara kaç GÜN kalacağı. Kutu 1'den başlanır. */
const ARALIKLAR_GUN = [1, 3, 7, 16, 35];

/** Bu kutuya ulaşan kelime "öğrenildi" sayılır (son aralık da geçilmiş olur). */
export const USTA_KUTU = ARALIKLAR_GUN.length; // 5

/** Bir oturumda en fazla kaç kelime sorulur.
 *
 *  Sınır ŞART: 400 kelime biriktirmiş bir oyuncunun karşısına 400 kelimelik
 *  bir tekrar listesi çıkarsa oturumu hiç başlatmaz. Küçük ve bitirilebilir
 *  bir yığın, büyük ve bitirilemez bir yığından her zaman daha çok tekrar
 *  yaptırır. */
export const OTURUM_SINIRI = 12;

const GUN_MS = 86_400_000;

/** Yeni öğrenilen kelimenin başlangıç durumu -- 1. kutu, yarın tekrar. */
export function ilkTekrar(simdi = Date.now()): { box: number; dueAt: number } {
  return { box: 1, dueAt: simdi + ARALIKLAR_GUN[0] * GUN_MS };
}

/**
 * Cevaba göre kelimenin yeni durumu.
 *
 * Bildiyse bir üst kutuya çıkar, aralık uzar. Bilemediyse DOĞRUDAN 1. kutuya
 * düşer -- kademeli düşürmek (ör. bir kutu geri) unutulmuş bir kelimeyi
 * haftalarca tekrar dışında bırakır, oysa unutulan kelime tam da en sık
 * görülmesi gereken kelimedir.
 */
export function sonrakiTekrar(
  entry: VocabEntry,
  dogru: boolean,
  simdi = Date.now(),
): { box: number; dueAt: number } {
  const box = dogru ? Math.min((entry.box ?? 1) + 1, USTA_KUTU) : 1;
  const gun = ARALIKLAR_GUN[Math.min(box, ARALIKLAR_GUN.length) - 1];
  return { box, dueAt: simdi + gun * GUN_MS };
}

/** Kelime öğrenilmiş sayılıyor mu -- son kutuya ulaşmış olanlar. */
export function ustalasti(entry: VocabEntry): boolean {
  return (entry.box ?? 1) >= USTA_KUTU;
}

/**
 * Tekrar zamanı gelmiş kelimeler. Ustalaşmış kelimeler listeye GİRMEZ;
 * 35 gün sonra tekrar sorulmaları teorik olarak faydalı olurdu ama oyunun
 * amacı sonsuz bir çalışma listesi değil, bitirilebilir bir günlük hedef.
 */
export function tekrarBekleyenler(vocab: VocabEntry[], simdi = Date.now()): VocabEntry[] {
  return vocab.filter((v) => !ustalasti(v) && (v.dueAt ?? 0) <= simdi);
}

/**
 * Bugünkü tekrar oturumu: en gecikmiş kelimeler önce (en çok unutulmuş
 * olanlar), oturum sınırı kadar.
 */
export function tekrarOturumu(vocab: VocabEntry[], simdi = Date.now()): VocabEntry[] {
  return tekrarBekleyenler(vocab, simdi)
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0))
    .slice(0, OTURUM_SINIRI);
}

/** Kelime dağarcığı özeti -- Kelimelerim sekmesinin başlığı için. */
export function dagarcikOzeti(vocab: VocabEntry[], simdi = Date.now()) {
  // Aynı kelime birden çok kez çözülmüş olabilir (liste başa sarınca):
  // sayımlar BENZERSİZ kelime üzerinden yapılmalı, yoksa "480 kelime
  // öğrendin" gibi gerçek olmayan bir sayı çıkar.
  const benzersiz = new Map<string, VocabEntry>();
  for (const v of vocab) {
    const onceki = benzersiz.get(v.word);
    // En ileri kutudaki kayıt tutulur -- ilerleme geri gitmemeli.
    if (!onceki || (v.box ?? 1) > (onceki.box ?? 1)) benzersiz.set(v.word, v);
  }
  const hepsi = [...benzersiz.values()];
  return {
    toplam: hepsi.length,
    usta: hepsi.filter(ustalasti).length,
    bekleyen: tekrarBekleyenler(hepsi, simdi).length,
    hepsi,
  };
}
