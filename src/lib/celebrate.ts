import confetti from 'canvas-confetti';

/** Seviye tamamlanınca ekranın ortasından çift patlamalı konfeti. */
export function celebrateWin() {
  const colors = ['#fbbf24', '#f472b6', '#a78bfa', '#34d399'];
  confetti({ particleCount: 60, spread: 70, origin: { y: 0.55 }, colors, startVelocity: 35 });
  setTimeout(() => {
    confetti({ particleCount: 40, spread: 100, origin: { y: 0.6 }, colors, startVelocity: 25 });
  }, 150);
}

/**
 * Seri kutlaması için, seviye kutlamasından daha büyük ve alev renkli bir
 * patlama. Ayrı bir fonksiyon çünkü seri kutlaması nadir bir an: seviye
 * konfetisiyle aynı görünseydi "bir şey daha oldu" der, "özel bir şey oldu"
 * demezdi. İki kenardan birden atılıyor, ortadan değil -- ekranın ortasında
 * duran büyük rakamın üstünü kapatmasın diye.
 */
export function celebrateStreak() {
  const colors = ['#fbbf24', '#fb923c', '#f87171', '#fde68a'];
  const ortak = { particleCount: 55, spread: 70, colors, startVelocity: 45, ticks: 200 };
  confetti({ ...ortak, angle: 60, origin: { x: 0, y: 0.7 } });
  confetti({ ...ortak, angle: 120, origin: { x: 1, y: 0.7 } });
  setTimeout(() => {
    confetti({ ...ortak, particleCount: 35, angle: 60, origin: { x: 0.1, y: 0.75 } });
    confetti({ ...ortak, particleCount: 35, angle: 120, origin: { x: 0.9, y: 0.75 } });
  }, 220);
}
