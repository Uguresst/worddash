import { todayKey } from './dailyWord';
import type { WordEntry } from './wordList';

/**
 * WordDash v1'de hesap YOK, bilerek: oyunun temel döngüsü (günlük kelime,
 * seri, kelime dağarcığı) çalışıyor mu diye önce cihazda deneyip
 * doğrulamak, kayıt/giriş ekranı inşa etmekten daha öncelikli. Hesap ve
 * cihazlar-arası senkron, bu döngü kullanıcıda tuttuysa eklenecek --
 * Afsar Gym Lab'daki gibi ayrı bir Supabase projesiyle, bu projeninkiyle
 * KARIŞMADAN.
 */
const KEY = 'worddash_state_v1';

export interface VocabEntry extends WordEntry {
  learnedDate: string; // todayKey() formatı
}

export interface GameState {
  streak: number;
  longestStreak: number;
  lastPlayedDate: string | null;
  lastResult: 'won' | 'lost' | null;
  vocabulary: VocabEntry[];
  lang: 'tr' | 'en';
}

const DEFAULT_STATE: GameState = {
  streak: 0,
  longestStreak: 0,
  lastPlayedDate: null,
  lastResult: null,
  vocabulary: [],
  lang: 'tr',
};

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    // Bozuk/eski format -- sıfırdan başlamak, çökmekten iyidir.
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // localStorage kapalı/dolu olabilir (gizli sekme vb.) -- sessizce yut,
    // oyun localStorage olmadan da o oturum içinde çalışmaya devam etsin.
  }
}

export function hasPlayedToday(state: GameState): boolean {
  return state.lastPlayedDate === todayKey();
}

/** Dünün tarih anahtarı -- seri devam mı ediyor, kırıldı mı ona bakmak için. */
function yesterdayKey(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return todayKey(d);
}

/**
 * Bugünün sonucunu kaydeder ve seriyi günceller.
 *
 * Seri mantığı: son oynanan gün DÜN ise ve bugün kazanıldıysa seri +1;
 * son oynanan gün bugünden daha eskiyse (bir gün atlanmışsa) seri 1'e
 * (kazanıldıysa) ya da 0'a (kaybedildiyse) sıfırlanıyor -- Wordle/Duolingo
 * gibi günlük seri oyunlarının standart davranışı bu.
 */
export function recordResult(state: GameState, won: boolean, entry: WordEntry): GameState {
  if (hasPlayedToday(state)) return state; // aynı gün ikinci kez sayılmasın

  const continuesStreak = state.lastPlayedDate === yesterdayKey();
  const newStreak = won ? (continuesStreak ? state.streak + 1 : 1) : 0;

  const vocabulary = won
    ? [...state.vocabulary, { ...entry, learnedDate: todayKey() }]
    : state.vocabulary;

  const next: GameState = {
    ...state,
    streak: newStreak,
    longestStreak: Math.max(state.longestStreak, newStreak),
    lastPlayedDate: todayKey(),
    lastResult: won ? 'won' : 'lost',
    vocabulary,
  };
  saveState(next);
  return next;
}

export function setLang(state: GameState, lang: 'tr' | 'en'): GameState {
  const next = { ...state, lang };
  saveState(next);
  return next;
}
