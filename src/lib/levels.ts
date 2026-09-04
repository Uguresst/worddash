import { WORD_LIST, type WordEntry } from './wordList';

/**
 * Seviye -> kelime eşlemesi. Liste bitince baştan dönüyor (60 kelime,
 * 60 seviyeden sonra tekrar 1'den başlıyor) -- kelime dağarcığı listesine
 * zaten eklenmiş olsa da tekrar çözmek dil öğreniminde zararsız, hatta
 * pekiştirici.
 */
export function wordForLevel(level: number): WordEntry {
  const idx = ((level % WORD_LIST.length) + WORD_LIST.length) % WORD_LIST.length;
  return WORD_LIST[idx];
}

export const TOTAL_WORDS = WORD_LIST.length;

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Harf sayısına göre kabaca zorluk -- WORD_LIST zaten bu sıraya göre dizili. */
export function difficultyOf(word: string): Difficulty {
  if (word.length <= 4) return 'easy';
  if (word.length <= 6) return 'medium';
  return 'hard';
}
