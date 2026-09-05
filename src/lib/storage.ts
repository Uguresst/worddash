import type { WordEntry } from './wordList';
import { THEMES } from './themes';

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
  /** Bir sonraki ücretsiz sandığa kadar kazanılan doğru cevap sayısı (bkz. CHEST_WIN_TARGET). */
  chestProgress: number;
  /** Açılmayı bekleyen sandık sayısı -- ücretsiz kazanılmış veya jetonla satın alınmış olabilir. */
  chestsReady: number;
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
  chestProgress: 0,
  chestsReady: 0,
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
 * Kazanç bilerek DÜŞÜK ve zorluktan bağımsız düz bir sayı -- güçlendirmeler
 * artık ana ekrandan doğrudan alınabildiği için (bkz. App.tsx) jetonun
 * "değerli" hissettirmesi, birkaç doğru cevapta bir kalkan/joker alınıp
 * bitmemesi gerekiyor. Yavaş biriken jeton daha fazla oynanış süresi
 * demek -- bilinçli bir tercih, "kolay kazanılıyor" şikayetinin devamı.
 */
const COINS_PER_WIN = 2;
const HINT_COIN_PENALTY_RATIO = 0.5; // ipucu kullanılırsa kazanılacak jetonun yarısı

/**
 * Seri ne kadar uzunsa kazanç o kadar büyür -- düz +2'yi TEK BAŞINA
 * bırakmak yerine, seriyi canlı tutmayı (ve onu koruyan Seri Kalkanı'nı)
 * doğrudan ödüllendiriyor. Eşikler bilinçli: 3'te ısınıyorsun, 7'de
 * ateşlisin (zaten CoinBadge'in alev ikonu burada yanıyor), 15'te nadir.
 */
export function streakMultiplier(streak: number): number {
  if (streak >= 15) return 3;
  if (streak >= 7) return 2;
  if (streak >= 3) return 1.5;
  return 1;
}

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
  // Çarpan, BU cevaba girerken zaten sahip olduğun seriye göre hesaplanıyor --
  // "şu an ne kadar ateşlisin" o anki serine bakar, henüz artmamış hâline değil.
  const gained = Math.max(
    Math.round(COINS_PER_WIN * streakMultiplier(state.currentStreak) * (usedHint ? HINT_COIN_PENALTY_RATIO : 1)),
    1,
  );
  const chestProgress = state.chestProgress + 1;
  const chestRollover = chestProgress >= CHEST_WIN_TARGET;
  const next: GameState = {
    ...state,
    level: state.level + 1,
    coins: state.coins + gained,
    totalCoinsEarned: state.totalCoinsEarned + gained,
    currentStreak,
    bestStreak: Math.max(state.bestStreak, currentStreak),
    vocabulary: [...state.vocabulary, { ...entry, learnedAt: Date.now() }],
    streakShields: state.streakShields - (shieldConsumed ? 1 : 0),
    chestProgress: chestRollover ? 0 : chestProgress,
    chestsReady: state.chestsReady + (chestRollover ? 1 : 0),
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

/**
 * Bir kelimede art arda 2 yanlış tahmin (App.tsx'te sayılıyor) ya da
 * ipucu kullanımı seriyi kırar -- ama Seri Kalkanı varsa hangi tetikleyici
 * olursa olsun önce kalkanı tüketir, seri dokunulmamış kalır. Zaten 0'sa
 * hiçbir şey yapmadan aynı state'i döner (gereksiz kayıt yok).
 */
export function breakStreakIfNeeded(state: GameState): GameState {
  if (state.currentStreak === 0) return state;
  if (state.streakShields > 0) {
    const next = { ...state, streakShields: state.streakShields - 1 };
    saveState(next);
    return next;
  }
  const next = { ...state, currentStreak: 0 };
  saveState(next);
  return next;
}

export const CHEST_WIN_TARGET = 5; // her 5 doğru cevapta bir ücretsiz sandık
export const CHEST_PRICE = 30; // beklemeden jetonla anında bir sandık

export type ChestReward =
  | { kind: 'coins'; amount: number }
  | { kind: 'skip'; amount: number }
  | { kind: 'shield'; amount: number }
  | { kind: 'theme'; themeId: string };

/**
 * Ödül dağılımı bilinçli: en sık jeton (beklenti dengesini korur), orta
 * sıklıkta bir güçlendirme, NADİREN (yüzde 5) henüz alınmamış bir tema --
 * bu, jeton biriktirmenin "büyük ödül" ihtimaliyle heyecanlı hissetmesini
 * sağlıyor. Alınacak tema kalmadıysa (hepsi açıksa) o dilim büyük bir
 * jeton ikramiyesine düşüyor, böylece hiçbir ihtimal "boşa" gitmiyor.
 */
function rollChestReward(state: GameState): ChestReward {
  const roll = Math.random();
  const lockedThemes = THEMES.filter((th) => th.price > 0 && !state.unlockedThemes.includes(th.id));
  if (roll < 0.05 && lockedThemes.length > 0) {
    const th = lockedThemes[Math.floor(Math.random() * lockedThemes.length)];
    return { kind: 'theme', themeId: th.id };
  }
  if (roll < 0.05) return { kind: 'coins', amount: 50 }; // tema dilimi ama hepsi zaten açık
  if (roll < 0.2) return { kind: 'shield', amount: 1 };
  if (roll < 0.45) return { kind: 'skip', amount: 1 };
  return { kind: 'coins', amount: 5 + Math.floor(Math.random() * 11) }; // 5-15
}

/** Bekleme sırasını atlayıp jetonla anında bir sandık ekler -- açılışı ayrı adım (openChest). */
export function buyChest(state: GameState): GameState {
  if (state.coins < CHEST_PRICE) return state;
  const next: GameState = { ...state, coins: state.coins - CHEST_PRICE, chestsReady: state.chestsReady + 1 };
  saveState(next);
  return next;
}

/** Sırada sandık yoksa hiçbir şey yapmadan (0 jetonluk sahte bir ödülle) döner --
 *  çağıran taraf zaten chestsReady > 0 kontrolü yapmalı, bu son bir güvenlik. */
export function openChest(state: GameState): { state: GameState; reward: ChestReward } {
  if (state.chestsReady <= 0) return { state, reward: { kind: 'coins', amount: 0 } };
  const reward = rollChestReward(state);
  let next: GameState = { ...state, chestsReady: state.chestsReady - 1 };
  if (reward.kind === 'coins') {
    next = { ...next, coins: next.coins + reward.amount, totalCoinsEarned: next.totalCoinsEarned + reward.amount };
  } else if (reward.kind === 'skip') {
    next = { ...next, skipTokens: next.skipTokens + reward.amount };
  } else if (reward.kind === 'shield') {
    next = { ...next, streakShields: next.streakShields + reward.amount };
  } else {
    next = { ...next, unlockedThemes: [...next.unlockedThemes, reward.themeId] };
  }
  saveState(next);
  return { state: next, reward };
}

/** Zaten sahip olunan bir temayı aktif eder -- satın alma değil, sadece seçim. */
export function selectTheme(state: GameState, themeId: string): GameState {
  if (!state.unlockedThemes.includes(themeId)) return state;
  const next = { ...state, activeTheme: themeId };
  saveState(next);
  return next;
}
