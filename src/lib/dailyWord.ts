import { WORD_LIST, type WordEntry } from './wordList';

/**
 * Günün kelimesi -- Wordle'ın yaptığı gibi: sabit bir başlangıç tarihinden
 * bugüne kaç gün geçtiğini sayıp, listenin uzunluğuna göre mod alıyoruz.
 * Böylece HERKES aynı gün aynı kelimeyi çözüyor (paylaşılabilir, "bugünkü
 * WordDash'i çözdün mü" deneyimi) ve liste bitince baştan dönüyor.
 *
 * Tarih UTC gün sınırına göre hesaplanıyor -- yerel saat dilimine göre
 * hesaplasaydık, gece yarısına yakın farklı ülkelerdeki kullanıcılar aynı
 * "gün" içinde farklı kelimeler görebilirdi.
 */
const EPOCH = Date.UTC(2026, 0, 1); // 1 Ocak 2026 -- kelime #0

export function dayIndexFor(date: Date = new Date()): number {
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((utcMidnight - EPOCH) / 86400000);
}

export function wordForDay(dayIndex: number): WordEntry {
  const idx = ((dayIndex % WORD_LIST.length) + WORD_LIST.length) % WORD_LIST.length;
  return WORD_LIST[idx];
}

export function todaysWord(): WordEntry {
  return wordForDay(dayIndexFor());
}

/** `2026-09-04` biçiminde, streak/localStorage anahtarları için. */
export function todayKey(date: Date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}
