import { getSupabase } from './supabase.ts';
import { ensureSession } from './leaderboard.ts';
import { DEFAULT_STATE, type GameState } from './storage.ts';

/**
 * Yedekleme ve kurtarma kodu.
 *
 * NEDEN VAR: ilerleme yalnızca localStorage'daydı. Tarayıcı verisini
 * silen ya da telefon değiştiren oyuncu 300 kelimelik dağarcığını ve
 * bütün seviyelerini kaybediyordu -- oyunun en çok emek isteyen kısmı,
 * tek bir "site verilerini temizle" dokunuşuyla.
 *
 * NEDEN HESAP DEĞİL: uygulamanın vaadi "kayıt yok, e-posta yok, şifre
 * yok" ve mağaza metni bunu söylüyor. Kurtarma bu yüzden oyuncunun bir
 * yere not ettiği bir KODLA yapılıyor.
 *
 * NEDEN İSTEĞE BAĞLI: gizlilik politikası "lider tablosuna katılmadığın
 * sürece uygulama hiçbir dış sunucuya bağlanmaz" diyor. Yedekleme de
 * açıkça açılmadıkça hiçbir istek atmıyor, böylece o cümle doğru kalıyor.
 */

/*
  Karışabilecek harfler alfabede YOK: 0/O, 1/I/L. Kod elle telefondan
  telefona yazılacak; okunurluk burada güvenlikten daha çok hata
  önlüyor. 32 harf x 12 karakter = 60 bit.
*/
const ALFABE = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const KOD_UZUNLUK = 12;

const KOD_KEY = 'worddash_backup_code';
const ACIK_KEY = 'worddash_backup_on';

/** Kullanıcıya gösterilen biçim: XXXX-XXXX-XXXX */
export function kodBicimle(kod: string): string {
  return (kod.match(/.{1,4}/g) ?? []).join('-');
}

/**
 * Yazılan kodu karşılaştırmaya hazır hâle getirir: büyük harf, ayraçsız
 * ve alfabede olmayan karakterler atılmış. Kullanıcı tireyle, boşlukla
 * ya da küçük harfle yazabilsin diye -- kodu yanlış yazdığı için değil,
 * biçimi yüzünden reddedilmek en sinir bozucu hata türü.
 */
export function kodNormalle(ham: string): string {
  return [...ham.toUpperCase()].filter((c) => ALFABE.includes(c)).join('');
}

/**
 * Kriptografik rastgelelikle kod üretir.
 *
 * Math.random() KULLANILMIYOR: tahmin edilebilir ve aynı anda oynayan
 * iki cihazda çakışabilir. crypto.getRandomValues her tarayıcıda var.
 *
 * `% ALFABE.length` ile modulo sapması: 256, 31'e tam bölünmediği için
 * ilk harfler ~%1 daha sık geliyor. 60 bitlik bir kodda bunun pratik
 * karşılığı yok, ama yine de sapmayı eleyip alıyoruz -- ucuz.
 */
export function kodUret(): string {
  const cikti: string[] = [];
  const tampon = new Uint8Array(1);
  const sinir = 256 - (256 % ALFABE.length);
  while (cikti.length < KOD_UZUNLUK) {
    crypto.getRandomValues(tampon);
    if (tampon[0] >= sinir) continue; // sapmalı aralık -- at, yeniden çek
    cikti.push(ALFABE[tampon[0] % ALFABE.length]);
  }
  return cikti.join('');
}

export function kayitliKod(): string | null {
  try {
    return localStorage.getItem(KOD_KEY);
  } catch {
    return null;
  }
}

export function yedeklemeAcikMi(): boolean {
  try {
    return localStorage.getItem(ACIK_KEY) === '1';
  } catch {
    return false;
  }
}

function kodKaydet(kod: string): void {
  try {
    localStorage.setItem(KOD_KEY, kod);
    localStorage.setItem(ACIK_KEY, '1');
  } catch {
    /* Gizli sekme: kod hatırlanmaz. Ekranda gösterildiği için oyuncu
       yine de not edebilir; yedekleme bu oturumda çalışmaya devam eder. */
  }
}

/**
 * Yedeklemeyi açar (kod yoksa üretir) ve durumu sunucuya yazar.
 * @returns oyuncuya gösterilecek kurtarma kodu
 */
export async function yedeklemeyiAc(state: GameState): Promise<string> {
  const kod = kayitliKod() ?? kodUret();
  await yaz(kod, state);
  kodKaydet(kod);
  return kod;
}

/**
 * Mevcut durumu sunucuya yazar. Yedekleme kapalıysa HİÇBİR ŞEY YAPMAZ --
 * çağıran tarafın ayrıca kontrol etmesi gerekmesin diye burada eleniyor.
 */
export async function yedekle(state: GameState): Promise<void> {
  const kod = kayitliKod();
  if (!kod || !yedeklemeAcikMi()) return;
  await yaz(kod, state);
}

async function yaz(kod: string, state: GameState): Promise<void> {
  await ensureSession();
  const supabase = await getSupabase();
  const { error } = await supabase.rpc('push_save', { p_code: kod, p_state: state });
  if (error) throw new Error(`Yedeklenemedi: ${error.message}`);
}

/**
 * Yedeklemeyi kapatır ve sunucudaki kaydı SİLER.
 *
 * Sıra önemli: önce satır siliniyor, sonra yerel iz temizleniyor. Ters
 * olsaydı silme başarısız olduğunda oyuncu "sildim" sanır, kayıt
 * sunucuda kalırdı -- gizlilik politikasındaki silme sözü de yalan olurdu.
 */
export async function yedeklemeyiKapat(): Promise<void> {
  const supabase = await getSupabase();
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (uid) {
    const { error } = await supabase.from('saves').delete().eq('id', uid);
    if (error) throw new Error(`Yedek silinemedi: ${error.message}`);
  }
  try {
    localStorage.removeItem(KOD_KEY);
    localStorage.removeItem(ACIK_KEY);
  } catch {
    /* Silinemese bile sunucudaki kayıt gitti -- asıl olan o. */
  }
}

/**
 * Koda karşılık gelen kaydı getirir. Bulunamazsa null.
 *
 * Dönen şey AĞDAN GELEN ham JSON: doğrudan oyuna verilmiyor, önce
 * `guvenliDurum` süzüyor.
 */
export async function geriYukle(hamKod: string): Promise<GameState | null> {
  const kod = kodNormalle(hamKod);
  if (kod.length < 8) return null;
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('claim_save', { p_code: kod });
  if (error) throw new Error(`Kurtarılamadı: ${error.message}`);
  if (!data) return null;
  return guvenliDurum(data);
}

/**
 * Ağdan gelen kaydı oyunun beklediği şekle sokar.
 *
 * ŞART: bu veri sunucudan geliyor ve oyunun bütün ekranları alanların
 * var olduğunu varsayıyor. Eski sürümde kaydedilmiş (alanı eksik) ya da
 * bozulmuş bir JSON doğrudan state'e konsaydı, oyun `vocabulary.map`
 * satırında beyaz ekrana düşerdi. DEFAULT_STATE üstüne yayarak her alanın
 * varlığını garantiliyoruz; tipi tutmayanlar tek tek düzeltiliyor.
 */
export function guvenliDurum(ham: unknown): GameState {
  const o = (ham ?? {}) as Partial<GameState>;
  const sayi = (v: unknown, varsayilan: number): number =>
    typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : varsayilan;

  return {
    ...DEFAULT_STATE,
    ...o,
    level: sayi(o.level, 0),
    coins: sayi(o.coins, 0),
    bestStreak: sayi(o.bestStreak, 0),
    currentStreak: sayi(o.currentStreak, 0),
    totalCoinsEarned: sayi(o.totalCoinsEarned, 0),
    dailyStreak: sayi(o.dailyStreak, 0),
    streakShields: sayi(o.streakShields, 0),
    skipTokens: sayi(o.skipTokens, 0),
    chestProgress: sayi(o.chestProgress, 0),
    chestsReady: sayi(o.chestsReady, 0),
    lang: o.lang === 'en' ? 'en' : 'tr',
    showTranslationHint: o.showTranslationHint !== false,
    unlockedThemes: Array.isArray(o.unlockedThemes)
      ? o.unlockedThemes.filter((t): t is string => typeof t === 'string')
      : [...DEFAULT_STATE.unlockedThemes],
    activeTheme: typeof o.activeTheme === 'string' ? o.activeTheme : DEFAULT_STATE.activeTheme,
    lastClaimDate: typeof o.lastClaimDate === 'string' ? o.lastClaimDate : null,
    vocabulary: Array.isArray(o.vocabulary)
      ? o.vocabulary.filter(
          (v): v is GameState['vocabulary'][number] =>
            !!v && typeof v.word === 'string' && typeof v.tr === 'string',
        )
      : [],
  };
}

/**
 * Kurtarılan kayıt yerel olandan daha ileri mi?
 *
 * Kurtarma yerel ilerlemenin ÜSTÜNE YAZIYOR, o yüzden oyuncuya neyi
 * neyle değiştirdiğini göstermek gerekiyor. Tek bir "seviye" sayısına
 * bakmak yetmiyor: seviyesi düşük ama dağarcığı geniş bir kayıt da
 * kaybedilmemesi gereken bir kayıt.
 */
export function kayitOzeti(state: GameState): { seviye: number; kelime: number; jeton: number } {
  return { seviye: state.level + 1, kelime: state.vocabulary.length, jeton: state.coins };
}
