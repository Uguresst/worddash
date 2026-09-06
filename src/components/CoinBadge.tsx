import { useEffect, useRef, useState } from 'react';

/**
 * Jeton/seri gibi sayaçlar için: değer değiştiğinde kısa bir "zıplama"
 * (scale bounce) tetikler. Gerçek bir sayı-yukarı-sayma animasyonu yerine
 * bunu seçtik -- coin kazanımları küçük (genelde +10), sayıyı 0'dan
 * saydırmak gereksiz gecikme katardı; zıplama tek başına "bir şey oldu"
 * hissini yeterince veriyor.
 *
 * `hot`: seri (streak) belli bir eşiği geçince alev ikonu sürekli hafif
 * nabız atar -- "şu an iyi gidiyorsun" sinyalini rakamı okumadan verir.
 */
export default function CoinBadge({
  icon,
  value,
  label,
  hot,
  dim,
  suffix,
  suffixTitle,
}: {
  icon: string;
  value: number;
  label: string;
  hot?: boolean;
  /** Sayac henuz "anlamli" degilse sonuk cizilir -- seri esigin altindayken
   *  parlak amber bir rakam gostermek, olmayan bir seriyi varmis gibi
   *  gosteriyordu. */
  dim?: boolean;
  /** Değerin yanına küçük bir rozet olarak eklenir -- örn. seri çarpanı "×2". */
  suffix?: string;
  suffixTitle?: string;
}) {
  const [bump, setBump] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      prev.current = value;
      setBump(true);
      const id = setTimeout(() => setBump(false), 280);
      return () => clearTimeout(id);
    }
  }, [value]);

  return (
    <div className="text-right">
      <p
        className={`font-display text-lg font-extrabold leading-none transition-transform duration-200 ${
          bump ? 'scale-125 text-amber-300' : dim ? 'text-white/45' : 'text-amber-400'
        }`}
      >
        <span
          className="inline-block"
          style={hot ? { animation: 'flamePulse 0.9s ease-in-out infinite' } : undefined}
        >
          <span className={dim ? 'grayscale opacity-60' : undefined}>{icon}</span>
        </span>{' '}
        {value}
        {suffix && (
          <span
            title={suffixTitle}
            className="ml-1 align-top text-[10px] font-display font-extrabold text-emerald-300"
          >
            {suffix}
          </span>
        )}
      </p>
      <p className="text-[10px] text-white/50 font-bold uppercase tracking-wide">{label}</p>
    </div>
  );
}
