import confetti from 'canvas-confetti';

/** Seviye tamamlanınca ekranın ortasından çift patlamalı konfeti. */
export function celebrateWin() {
  const colors = ['#fbbf24', '#f472b6', '#a78bfa', '#34d399'];
  confetti({ particleCount: 60, spread: 70, origin: { y: 0.55 }, colors, startVelocity: 35 });
  setTimeout(() => {
    confetti({ particleCount: 40, spread: 100, origin: { y: 0.6 }, colors, startVelocity: 25 });
  }, 150);
}
