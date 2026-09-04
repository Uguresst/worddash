import type { WordEntry } from './wordList';

/**
 * v1: "günde bir kelime" (Wordle mantığı) kullanıcıyı sınırlıyordu --
 * bir kere çözünce uygulamada yapacak başka bir şey kalmıyordu. v2:
 * SEVİYE tabanlı, sınırsız ilerleme -- Wordscapes/Word Cookies gibi,
 * istediğin kadar art arda kelime çözebiliyorsun. Günlük kilit yok.
 *
 * Hesap sistemi hâlâ YOK (bilerek, README'de gerekçe var) -- ilerleme
 * cihazda (localStorage) tutuluyor.
 */
const KEY = 'worddash_state_v2';

export interface VocabEntry extends WordEntry {
  learnedAt: number; // Date.now() -- gösterimde "az önce/dün" gibi göreceli çevrilebilsin diye
}

export interface GameState {
  level: number; // bir sonraki oynanacak seviye (0-tabanlı index, WORD_LIST'e göre)
  coins: number;
  bestStreak: number; // art arda ipucu kullanmadan doğru bilme serisi (oturum boyunca, kalıcı en iyi)
  currentStreak: number;
  vocabulary: VocabEntry[];
  lang: 'tr' | 'en';
  unlockedThemes: string[]; // theme id'leri -- 'aurora' ücretsiz, hep açık
  activeTheme: string;
  /**
   * Açıkken kelimenin TÜRKÇE karşılığı, tekerlekten önce ipucu olarak
   * gösteriliyor -- yani oyun "harfleri karıştır" bulmacasından "Türkçesini
   * bilip İngilizce'sini kur" çeviri egzersizine dönüşüyor. Varsayılan
   * AÇIK: bu, kullanıcının istediği en önemli değişiklikti.
   */
  showTranslationHint: boolean;
}

const DEFAULT_STATE: GameState = {
  level: 0,
  coins: 0,
  bestStreak: 0,
  currentStreak: 0,
  vocabulary: [],
  lang: 'tr',
  showTranslationHint: true,
  unlockedThemes: ['aurora'],
  activeTheme: 'aurora',
};

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return migrateFromV1() ?? { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

/** v1'de biriktirilmiş kelime dağarcığı varsa kaybetmeyelim, seviyeye taşıyalım. */
function migrateFromV1(): GameState | null {
  try {
    const raw = localStorage.getItem('worddash_state_v1');
    if (!raw) return null;
    const old = JSON.parse(raw);
    if (!Array.isArray(old?.vocabulary)) return null;
    return {
      ...DEFAULT_STATE,
      lang: old.lang === 'en' ? 'en' : 'tr',
      coins: old.vocabulary.length * 10,
      level: old.vocabulary.length,
      vocabulary: old.vocabulary.map((v: { word: string; tr: string }) => ({
        word: v.word,
        tr: v.tr,
        learnedAt: Date.now(),
      })),
    };
  } catch {
    return null;
  }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // localStorage kapalı/dolu olabilir -- sessizce yut, oturum içinde
    // oyun yine de çalışsın.
  }
}

const COINS_PER_WIN = 10;
const HINT_COIN_PENALTY = 3;

/** Bir seviyeyi kazanınca: sıradaki seviyeye geç, coin ver, kelime dağarcığına ekle. */
export function completeLevel(
  state: GameState,
  entry: WordEntry,
  usedHint: boolean,
): GameState {
  const currentStreak = usedHint ? 0 : state.currentStreak + 1;
  const next: GameState = {
    ...state,
    level: state.level + 1,
    coins: state.coins + Math.max(COINS_PER_WIN - (usedHint ? HINT_COIN_PENALTY : 0), 1),
    currentStreak,
    bestStreak: Math.max(state.bestStreak, currentStreak),
    vocabulary: [...state.vocabulary, { ...entry, learnedAt: Date.now() }],
  };
  saveState(next);
  return next;
}

export function setLang(state: GameState, lang: 'tr' | 'en'): GameState {
  const next = { ...state, lang };
  saveState(next);
  return next;
}

export function toggleTranslationHint(state: GameState): GameState {
  const next = { ...state, showTranslationHint: !state.showTranslationHint };
  saveState(next);
  return next;
}

/** Yeterli jeton varsa ve henüz alınmadıysa temayı satın alıp otomatik seçer. */
export function buyTheme(state: GameState, themeId: string, price: number): GameState {
  if (state.unlockedThemes.includes(themeId) || state.coins < price) return state;
  const next: GameState = {
    ...state,
    coins: state.coins - price,
    unlockedThemes: [...state.unlockedThemes, themeId],
    activeTheme: themeId,
  };
  saveState(next);
  return next;
}

/** Zaten sahip olunan bir temayı aktif eder -- satın alma değil, sadece seçim. */
export function selectTheme(state: GameState, themeId: string): GameState {
  if (!state.unlockedThemes.includes(themeId)) return state;
  const next = { ...state, activeTheme: themeId };
  saveState(next);
  return next;
}
