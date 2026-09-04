/**
 * Tamamen dekoratif: arkaplanda yavaşça süzülen 3 bulanık ışık topu.
 * Düz tek renk gradyanın üstüne derinlik katıyor -- oyun temalarının
 * hepsinde çalışsın diye renk `currentColor`/tema sınıfından değil,
 * kendi hafif beyaz/renkli opaklığından geliyor, hangi temada da
 * "ışıldıyor" hissi versin.
 */
export default function BackgroundOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
      <div
        className="absolute w-72 h-72 rounded-full bg-fuchsia-400/20 blur-3xl"
        style={{ top: '-5%', left: '-10%', animation: 'drift 14s ease-in-out infinite' }}
      />
      <div
        className="absolute w-80 h-80 rounded-full bg-amber-300/15 blur-3xl"
        style={{ top: '55%', right: '-15%', animation: 'drift 18s ease-in-out infinite reverse' }}
      />
      <div
        className="absolute w-56 h-56 rounded-full bg-cyan-300/15 blur-3xl"
        style={{ bottom: '-10%', left: '20%', animation: 'drift 20s ease-in-out infinite' }}
      />
    </div>
  );
}
