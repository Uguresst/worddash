/**
 * Bir kelimenin harflerini karıştırır. Sonucun ORİJİNAL kelimeyle aynı
 * çıkmaması garanti -- kısa kelimelerde (örn. "beach") Fisher-Yates şansla
 * kelimeyi olduğu gibi bırakabiliyor, bu yüzden aynı çıkarsa tekrar karıştırıyoruz.
 * Tek harfli kelimede (pratikte hiç yok, ama güvenlik için) sonsuz döngüye
 * girmemek adına 20 denemede pes edip elindekini döndürüyor.
 */
export function scrambleWord(word: string): string {
  const letters = word.split('');
  let attempt = letters;

  for (let tries = 0; tries < 20; tries++) {
    attempt = [...letters];
    for (let i = attempt.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [attempt[i], attempt[j]] = [attempt[j], attempt[i]];
    }
    if (attempt.join('') !== word) break;
  }
  return attempt.join('');
}
