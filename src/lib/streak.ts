/**
 * Seri (streak) kuralları ve kutlama anları.
 *
 * NEDEN AYRI DOSYA: "kutlama ne zaman çıkar" sorusu gözle doğrulanamıyor.
 * Yanlış kurulursa iki uçtan biri olur: ya her kelimede kutlama çıkıp
 * anlamını yitirir, ya da hiç çıkmaz. İkisi de oyunu oynayarak fark
 * edilmesi zor hatalar, o yüzden kurallar saf fonksiyon olarak burada ve
 * scripts/check-streak.mjs ile tek tek doğrulanıyor.
 */

/**
 * Serinin "oluştuğu" eşik. Bu sayıya ULAŞANA kadar sayaç işliyor ama
 * arayüzde sönük duruyor: 1-2 doğru cevap bir seri değil, henüz sadece
 * iki doğru cevap. Seri, kaybedilecek bir şey haline geldiğinde anlam
 * kazanıyor -- o da üçüncü kelimede oluyor.
 */
export const SERI_ESIGI = 3;

/**
 * Bir kelimede kaç yanlışa izin var. 1: tek yanlış seriyi bitiriyor.
 *
 * 2 iken seri neredeyse hiç kırılmıyordu -- oyuncu her kelimede iki hak
 * bulduğu için seri "bedava" birikiyordu ve Seri Kalkanı'nın da bir anlamı
 * kalmıyordu. Tek hak, seriyi gerçekten korunması gereken bir şey yapıyor.
 */
export const MAX_WRONG_ATTEMPTS = 1;

/** Çarpanın değiştiği eşikler (bkz. storage.ts streakMultiplier). */
const CARPAN_ESIKLERI = [7, 15];

export interface SeriKutlamasi {
  /** 'ilk': hayatındaki ilk serisi. 'carpan': kazanç çarpanı yükseldi. 'rekor': eski en iyisini geçti. */
  tur: 'ilk' | 'carpan' | 'rekor';
  seri: number;
  /** 'carpan' türünde yeni çarpan. */
  carpan?: number;
  /** Bu aynı zamanda kişisel rekor mu -- kutlamanın alt satırında belirtiliyor. */
  rekorMu: boolean;
}

/**
 * Bu cevaptan sonra bir kutlama gösterilmeli mi?
 *
 * @param yeniSeri        cevap işlendikten SONRAKİ seri
 * @param oncekiEnIyi     cevap işlenmeden ÖNCEKİ en iyi seri
 * @param rekorKutlandiMi bu seri turunda rekor kutlaması ZATEN gösterildi mi
 *
 * ÜÇÜNCÜ PARAMETRE OLMADAN BU FONKSİYON BOZUK. İlk yazılışında rekor
 * kuralı "yeniSeri === oncekiEnIyi + 1" idi ve mantıklı görünüyordu; ama
 * `bestStreak` her doğru cevapta yeniSeri'ye eşitlendiği için bir sonraki
 * kelimede de, ondan sonraki kelimede de aynı koşul sağlanıyordu. Sonuç:
 * rekor bölgesine girdikten sonra HER kelimede tam ekran kutlama. Tarayıcı
 * testinde yakalandı (5, 6, 8 -> hepsi "Yeni rekor seri!").
 *
 * Doğrusu: bir seri turunda rekor bir kez kutlanır. Tur bittiğinde (seri
 * sıfırlandığında) çağıran taraf bayrağı sıfırlar.
 *
 * ÇAĞIRAN TARAF SÖZLEŞMESİ: dönen kutlamanın rekorMu alanı true ise
 * bayrak set edilmeli -- yalnızca tur === 'rekor' olduğunda değil. Sebep:
 * "İlk serin!" ekranı da oyuncuya rekor kırdığını zaten söylüyor; bayrak
 * yalnızca 'rekor' türünde set edilseydi yeni oyuncu 3'te "İlk serin",
 * hemen ardından 4'te "Yeni rekor" görürdü. (Akış simülasyonu yakaladı.)
 */
export function seriKutlamasi(
  yeniSeri: number,
  oncekiEnIyi: number,
  rekorKutlandiMi: boolean,
): SeriKutlamasi | null {
  if (yeniSeri < SERI_ESIGI) return null;
  const rekorMu = yeniSeri > oncekiEnIyi;

  // Hayatındaki ilk seri -- bir kez, asla tekrarlamaz.
  if (yeniSeri === SERI_ESIGI && oncekiEnIyi < SERI_ESIGI) {
    return { tur: 'ilk', seri: yeniSeri, rekorMu };
  }
  // Çarpan eşiği: kazanç gerçekten değiştiği için "ilk"ten sonra en güçlü an.
  if (CARPAN_ESIKLERI.includes(yeniSeri)) {
    return { tur: 'carpan', seri: yeniSeri, carpan: yeniSeri >= 15 ? 3 : 2, rekorMu };
  }
  // Kişisel rekorun aşıldığı AN -- bu tur içinde yalnızca bir kez.
  if (rekorMu && !rekorKutlandiMi && yeniSeri > SERI_ESIGI) {
    return { tur: 'rekor', seri: yeniSeri, rekorMu: true };
  }
  return null;
}

/** Seri arayüzde "yanıyor" mu -- eşiğe ulaşmış mı. */
export function seriAktif(seri: number): boolean {
  return seri >= SERI_ESIGI;
}
