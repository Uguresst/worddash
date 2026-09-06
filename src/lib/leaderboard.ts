import { supabase } from './supabase';
import type { GameState } from './storage';

const NICKNAME_KEY = 'worddash_nickname';

export interface LeaderboardRow {
  id: string;
  nickname: string;
  best_level: number;
  total_coins: number;
  best_streak: number;
  updated_at: string;
}

export function getSavedNickname(): string | null {
  try {
    return localStorage.getItem(NICKNAME_KEY);
  } catch {
    return null;
  }
}

function saveNicknameLocally(nickname: string): void {
  try {
    localStorage.setItem(NICKNAME_KEY, nickname);
  } catch {
    // localStorage kapalı olabilir -- sorun değil, satır yine de Supabase'e yazılıyor.
  }
}

/**
 * Oturum yoksa anonim oturum açar (Supabase'in kendi auth.users satırını
 * arka planda oluşturur, e-posta/şifre yok). Zaten oturum varsa onu döner --
 * her çağrıda yeni bir anonim kullanıcı YARATMAMAK önemli, yoksa her
 * ziyarette skor sıfırdan yeni bir satıra yazılır.
 */
export async function ensureSession(): Promise<string> {
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session?.user.id) return existing.session.user.id;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    throw new Error(`Anonim oturum açılamadı: ${error?.message ?? 'bilinmeyen hata'}`);
  }
  return data.session.user.id;
}

/**
 * Takma adı hem yerelde hem lider tablosu satırında günceller.
 *
 * ÖNEMLİ SIRA: yerel kayıt, sunucu KABUL ettikten SONRA yapılıyor. Önce
 * yerelde kaydedip sunucu reddederse (isim denetim tetikleyicisi),
 * uygulama "zaten katıldın" sanıp katılım ekranını bir daha hiç
 * göstermezdi -- oysa lider tablosunda hiç satırı olmazdı.
 */
export async function setNickname(nickname: string, state: GameState): Promise<void> {
  const trimmed = nickname.trim().slice(0, 20);
  if (!trimmed) return;
  const userId = await ensureSession();
  const { error } = await supabase.from('leaderboard').upsert({
    id: userId,
    nickname: trimmed,
    best_level: state.level,
    total_coins: state.coins,
    best_streak: state.bestStreak,
  });
  if (error) throw error;
  saveNicknameLocally(trimmed);
}

/**
 * Her seviye tamamlandığında çağrılır. Takma ad henüz yoksa hiçbir şey
 * yazmaz -- App.tsx bu durumda takma ad sorma ekranını gösteriyor zaten.
 * Çağıran taraf (App.tsx) hatayı zaten yutup sadece konsola yazıyor --
 * bir seviye tamamlamayı skor gönderimi başarısız oldu diye bozmayalım.
 */
export async function submitScore(state: GameState): Promise<void> {
  const nickname = getSavedNickname();
  if (!nickname) return;
  const userId = await ensureSession();
  const { error } = await supabase.from('leaderboard').upsert({
    id: userId,
    nickname,
    best_level: state.level,
    total_coins: state.coins,
    best_streak: state.bestStreak,
  });
  if (error) throw error;
}

/**
 * Kullanıcının lider tablosu satırını siler ve oturumu kapatır.
 *
 * SIRA ÖNEMLİ: önce satır silinir (silme için oturum lazım), sonra oturum
 * kapatılır. Oturum kapanınca cihaz bir daha aynı anonim kimliğe dönemez --
 * yani "sildim ama eski skorum geri geldi" durumu oluşmaz. Takma ad da
 * yerelden siliniyor, böylece uygulama kullanıcıyı yeniden katılım
 * ekranına alır.
 *
 * Google Play, hesap oluşturan uygulamalarda uygulama İÇİNDEN ulaşılabilir
 * bir veri silme yolu şart koşuyor; bu fonksiyon o gerekliliği karşılıyor.
 */
export async function deleteMyScore(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (userId) {
    const { error } = await supabase.from('leaderboard').delete().eq('id', userId);
    if (error) throw error;
  }
  await supabase.auth.signOut();
  try {
    localStorage.removeItem(NICKNAME_KEY);
  } catch {
    // localStorage kapaliysa satir zaten sunucudan silindi -- asil is bitti.
  }
}

export async function fetchTopScores(limit = 20): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('id, nickname, best_level, total_coins, best_streak, updated_at')
    .order('best_level', { ascending: false })
    .order('total_coins', { ascending: false })
    .limit(limit);
  if (error) {
    console.warn('Lider tablosu alınamadı:', error.message);
    return [];
  }
  return (data ?? []) as LeaderboardRow[];
}
