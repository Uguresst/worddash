/**
 * Sentezlenmiş ses efektleri -- hiçbir ses DOSYASI yok, Web Audio API'de
 * anlık üretiliyor. Sebep: bir oyun için "gerçek" ses tasarımı (kayıt,
 * mastering) bu projenin ölçeğine göre aşırı yatırım olurdu, ama SIFIR
 * ses de "ucuz" hissettirir. Basit osilatör + zarf (envelope) ikisinin
 * ortası -- doğru/yanlış/seviye-atlama gibi anlarda net bir geri bildirim
 * veriyor, dosya indirmeye gerek kalmadan.
 *
 * Tek bir AudioContext -- her çalmada yeniden oluşturmak hem gereksiz
 * hem de bazı tarayıcılarda "too many contexts" uyarısına yol açıyor.
 * İlk kullanıcı etkileşiminde (tıklama/dokunma) oluşturuluyor, çünkü
 * tarayıcılar kullanıcı jesti olmadan ses başlatmayı engelliyor.
 */
let ctx: AudioContext | null = null;
const MUTE_KEY = 'worddash_muted';

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function toggleMuted(): boolean {
  const next = !isMuted();
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  } catch {
    // localStorage kapalı olabilir -- oturum içinde sessize alma yine de çalışır
    // ama kalıcı olmaz, kabul edilebilir bir sınır.
  }
  return next;
}

/** Tek bir ton: frekans, süre, dalga şekli ve yumuşak bir attack/release zarfı. */
function tone(freq: number, startAt: number, duration: number, type: OscillatorType = 'sine', gain = 0.12) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + startAt);
  g.gain.setValueAtTime(0, c.currentTime + startAt);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + startAt + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + startAt + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(c.currentTime + startAt);
  osc.stop(c.currentTime + startAt + duration + 0.05);
}

function play(fn: () => void) {
  if (isMuted()) return;
  try {
    fn();
  } catch {
    // Ses API'si bazı ortamlarda (ör. bazı webview'lar) kısıtlı olabilir --
    // oyunun kendisi sesle bloklanmasın.
  }
}

/** Harf seçimi -- çok kısa, çok sessiz bir "tık". */
export function playTap() {
  play(() => tone(880, 0, 0.05, 'square', 0.03));
}

/** Yanlış tahmin -- kısa, alçalan iki nota. */
export function playWrong() {
  play(() => {
    tone(220, 0, 0.14, 'sawtooth', 0.08);
    tone(180, 0.08, 0.16, 'sawtooth', 0.07);
  });
}

/** Doğru tahmin -- yükselen, parlak bir üçlü. */
export function playCorrect() {
  play(() => {
    tone(523.25, 0, 0.12, 'sine', 0.1); // C5
    tone(659.25, 0.07, 0.12, 'sine', 0.1); // E5
    tone(783.99, 0.14, 0.22, 'sine', 0.12); // G5
  });
}

/** Coin kazanımı -- tek, parlak "cin" sesi. */
export function playCoin() {
  play(() => tone(1046.5, 0, 0.1, 'sine', 0.08));
}

/** Yıldız/streak gibi büyük bir kutlama -- kısa bir arpej. */
export function playCelebrate() {
  play(() => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.06, 0.18, 'triangle', 0.09));
  });
}
