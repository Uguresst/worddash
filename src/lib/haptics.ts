/**
 * Dokunsal geri bildirim. Sadece Android Chrome destekliyor (iOS Safari'de
 * Vibration API hiç yok) -- bu yüzden hep feature-detect ediliyor ve
 * desteklenmediği yerde sessizce hiçbir şey yapmıyor.
 */
function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Bazı tarayıcılar izin/politika yüzünden reddedebilir -- oyunu bozmasın.
  }
}

export const haptics = {
  tap: () => vibrate(8),
  wrong: () => vibrate([30, 40, 30]),
  correct: () => vibrate(15),
  levelUp: () => vibrate([15, 30, 15, 30, 40]),
};
