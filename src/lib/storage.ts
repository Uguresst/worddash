import type { WordEntry } from './wordList';
import { difficultyOf, type Difficulty } from './levels';

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
  /**
   * Harcansa bile ÖMÜR BOYU kazanılan toplam jeton -- `coins` tema alınca
   * azalabildiği için jeton rozetlerinin (100/500 jeton) bir kere açılıp
   * sonra "geri kapanması" gibi tuhaf bir davranışı önlemek için ayrı
   * tutuluyor. Sadece artar, hiç düşmez.
   */
  totalCoinsEarned: number;
  /** Günlük ödül serisi -- art arda gün (üst sınır 7, oradan sonra ödül sabitleniyor). */
  dailyStreak: number;
  /** Son ödülün toplandığı gün, 'YYYY-MM-DD' -- bugünle aynıysa tekrar toplanamaz. */
  lastClaimDate: string | null;
  /** Mağazadan jetonla alınan, oyun içinde harcanan sarf malzemeleri (bkz. buyPowerup). */
  streakShields: number; // ipucu kullanınca seriyi kırılmaktan koruyor, kullanılınca 1 azalıyor
  skipTokens: number; // mevcut kelimeyi cezasız atlıyor
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
  totalCoinsEarned: 0,
  dailyStreak: 0,
  lastClaimDate: null,
  streakShields: 0,
  skipTokens: 0,
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

/**
 * Kazanç artık zorluğa göre -- eskiden her kelime düz 10 jetondu, bu da
 * (liste kolaydan zora sıralı ama sonsuz döngüyle tekrar ettiği için) jetonu
 * gereğinden hızlı biriktiriyordu. Kolay kelimeler artık daha az, zor
 * kelimeler daha çok kazandırıyor -- hem "çok kolay geliyor" şikayetini
 * çözüyor hem de zorlanmayı anlamlı kılıyor.
 */
const COINS_BY_DIFFICULTY: Record<Difficulty, number> = { easy: 5, medium: 8, hard: 13 };
const HINT_COIN_PENALTY_RATIO = 0.5; // ipucu kullanılırsa kazanılacak jetonun yarısı

/** Bir seviyeyi kazanınca: sıradaki seviyeye geç, coin ver, kelime dağarcığına ekle. */
export function completeLevel(
  state: GameState,
  entry: WordEntry,
  usedHint: boolean,
  /** Kalkan varsa (bkz. streakShields) ipucu kullanılmış olsa da seri KIRILMAZ, kalkan tüketilir. */
  shieldConsumed = false,
): GameState {
  const currentStreak = !usedHint
    ? state.currentStreak + 1
    : shieldConsumed
    ? state.currentStreak
    : 0;
  const base = COINS_BY_DIFFICULTY[difficultyOf(entry.word)];
  const gained = Math.max(Math.round(base * (usedHint ? HINT_COIN_PENALTY_RATIO : 1)), 1);
  const next: GameState = {
    ...state,
    level: state.level + 1,
    coins: state.coins + gained,
    totalCoinsEarned: state.totalCoinsEarned + gained,
    currentStreak,
    bestStreak: Math.max(state.bestStreak, currentStreak),
    vocabulary: [...state.vocabulary, { ...entry, learnedAt: Date.now() }],
    streakShields: state.streakShields - (shieldConsumed ? 1 : 0),
  };
  saveState(next);
  return next;
}

/** Kalkanı yoksa hiçbir şey yapmaz. Mevcut kelimeyi jeton/sözcük kazanmadan,
 *  seriyi de bozmadan atlar -- "bu kelime imkansız" anındaki supap. */
export function skipLevel(state: GameState): GameState {
  if (state.skipTokens <= 0) return state;
  const next: GameState = { ...state, level: state.level + 1, skipTokens: state.skipTokens - 1 };
  saveState(next);
  return next;
}

const POWERUP_PRICES = { shield: 40, skip: 25 } as const;
export type PowerupKind = keyof typeof POWERUP_PRICES;
export { POWERUP_PRICES };

/** Yeterli jeton varsa sarf malzemesi envanterine bir tane ekler. */
export function buyPowerup(state: GameState, kind: PowerupKind): GameState {
  const price = POWERUP_PRICES[kind];
  if (state.coins < price) return state;
  const next: GameState = {
    ...state,
    coins: state.coins - price,
    streakShields: state.streakShields + (kind === 'shield' ? 1 : 0),
    skipTokens: state.skipTokens + (kind === 'skip' ? 1 : 0),
  };
  saveState(next);
  return next;
}

const DAILY_BASE = 15;
const DAILY_STEP = 5;
const DAILY_STREAK_CAP = 7;

function todayKeyStr(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function isConsecutiveDay(prevKey: string | null, todayKey: string): boolean {
  if (!prevKey) return false;
  const prev = new Date(`${prevKey}T00:00:00Z`).getTime();
  const today = new Date(`${todayKey}T00:00:00Z`).getTime();
  return today - prev === 86_400_000;
}

/** Bugün zaten toplandıysa false -- buton disable etmek/modalı gizlemek için. */
export function canClaimDaily(state: GameState): boolean {
  return state.lastClaimDate !== todayKeyStr();
}

/**
 * State'i DEĞİŞTİRMEDEN bugün toplarsa ne kadar jeton alacağını ve serisinin
 * kaça çıkacağını hesaplar -- modalda "topla" düğmesine basmadan önce
 * gösterilecek önizleme için.
 */
export function previewDailyReward(state: GameState): { amount: number; streak: number } {
  const today = todayKeyStr();
  if (state.lastClaimDate === today) return { amount: 0, streak: state.dailyStreak };
  const streak = isConsecutiveDay(state.lastClaimDate, today)
    ? Math.min(state.dailyStreak + 1, DAILY_STREAK_CAP)
    : 1;
  return { amount: DAILY_BASE + (streak - 1) * DAILY_STEP, streak };
}

/** Günlük ödülü gerçekten toplar -- jetonu ekler, seriyi ilerletir, kaydeder. */
export function claimDailyReward(state: GameState): { state: GameState; amount: number; streak: number } {
  const { amount, streak } = previewDailyReward(state);
  if (amount === 0) return { state, amount: 0, streak };
  const next: GameState = {
    ...state,
    coins: state.coins + amount,
    totalCoinsEarned: state.totalCoinsEarned + amount,
    dailyStreak: streak,
    lastClaimDate: todayKeyStr(),
  };
  saveState(next);
  return { state: next, amount, streak };
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
