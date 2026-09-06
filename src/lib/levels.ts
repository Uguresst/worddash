import { WORD_PACKS, ALL_WORDS, TOTAL_WORDS, TOTAL_PACKS, type WordEntry, type WordPack } from './wordPacks.ts';

export { TOTAL_WORDS, TOTAL_PACKS };
export type { WordEntry, WordPack };

/**
 * Seviye -> kelime eşlemesi.
 *
 * `state.level` TEK bir küresel sayaç olarak kaldı (0'dan başlayıp artan) --
 * paketler bu sayacın üstüne TÜRETİLEREK biniyor, ayrı bir "hangi paketteyim"
 * state'i yok. Bunun üç sebebi var:
 *   - mevcut kayıtlar (localStorage) ve lider tablosundaki `best_level`
 *     hiçbir göç işlemi olmadan aynen çalışmaya devam ediyor,
 *   - rütbe/rozet metrikleri tek bir artan sayıya bakmaya devam ediyor,
 *     yani "geri gidebilen metrik" riski doğmuyor (bkz. achievements.ts),
 *   - oyuncu paketler arasında zıplayamadığı için ilerleme çizgisel ve
 *     anlaşılır kalıyor -- Wordscapes'in yaptığı da bu.
 */

/** Her paketin ALL_WORDS içindeki başlangıç index'i. Modül yüklenirken bir kez. */
const PACK_STARTS: number[] = (() => {
  const starts: number[] = [];
  let acc = 0;
  for (const p of WORD_PACKS) {
    starts.push(acc);
    acc += p.words.length;
  }
  return starts;
})();

export function wordForLevel(level: number): WordEntry {
  const idx = ((level % TOTAL_WORDS) + TOTAL_WORDS) % TOTAL_WORDS;
  return ALL_WORDS[idx];
}

export interface PackPosition {
  pack: WordPack;
  packIndex: number;
  /** Paket içinde kaçıncı kelimedesin (0-tabanlı). */
  indexInPack: number;
  packSize: number;
  /** Bu paketin ilk kelimesinin küresel seviye numarası. */
  startLevel: number;
}

/** Verilen seviyede hangi pakette olunduğu. Liste bitmişse başa sarar. */
export function packForLevel(level: number): PackPosition {
  const idx = ((level % TOTAL_WORDS) + TOTAL_WORDS) % TOTAL_WORDS;
  let packIndex = 0;
  for (let i = 0; i < PACK_STARTS.length; i++) {
    if (idx >= PACK_STARTS[i]) packIndex = i;
    else break;
  }
  const pack = WORD_PACKS[packIndex];
  return {
    pack,
    packIndex,
    indexInPack: idx - PACK_STARTS[packIndex],
    packSize: pack.words.length,
    startLevel: PACK_STARTS[packIndex],
  };
}

/**
 * Bir paketin kaç kelimesi çözülmüş (0..packSize). Paket haritasındaki
 * ilerleme çubuğu bunu okuyor. `level` TOTAL_WORDS'ü aştıysa (liste başa
 * sardıysa) tüm paketler tamamlanmış sayılır -- oyuncu zaten hepsini bir
 * kez bitirmiştir, çubukları yeniden sıfırlamak yaptığı işi silmek olur.
 */
export function packProgress(packIndex: number, level: number): number {
  const size = WORD_PACKS[packIndex].words.length;
  if (level >= TOTAL_WORDS) return size;
  const done = level - PACK_STARTS[packIndex];
  if (done <= 0) return 0;
  return Math.min(done, size);
}

/** Paket açıldı mı: önceki paketin son kelimesi çözülmüşse açıktır. */
export function isPackUnlocked(packIndex: number, level: number): boolean {
  return level >= PACK_STARTS[packIndex];
}

/** Bu seviyeyi çözmek bir paketi TAM olarak bitiriyor mu? (kutlama için) */
export function completesPack(levelJustFinished: number): WordPack | null {
  const nextLevel = levelJustFinished + 1;
  if (nextLevel > TOTAL_WORDS) return null;
  const i = PACK_STARTS.indexOf(nextLevel % TOTAL_WORDS);
  if (i > 0) return WORD_PACKS[i - 1];
  if (nextLevel === TOTAL_WORDS) return WORD_PACKS[WORD_PACKS.length - 1];
  return null;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Harf sayısına göre kabaca zorluk -- her paket zaten kısadan uzuna dizili. */
export function difficultyOf(word: string): Difficulty {
  if (word.length <= 4) return 'easy';
  if (word.length <= 6) return 'medium';
  return 'hard';
}
