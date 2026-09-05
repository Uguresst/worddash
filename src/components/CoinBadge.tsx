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
}: {
  icon: string;
  value: number;
  label: string;
  hot?: boolean;
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
          bump ? 'scale-125 text-amber-300' : 'text-amber-400'
        }`}
      >
        <span
          className="inline-block"
          style={hot ? { animation: 'flamePulse 0.9s ease-in-out infinite' } : undefined}
        >
          {icon}
        </span>{' '}
        {value}
      </p>
      <p className="text-[10px] text-white/50 font-bold uppercase tracking-wide">{label}</p>
    </div>
  );
}
