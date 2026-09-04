import { useEffect, useRef, useState } from 'react';

/**
 * Jeton/seri gibi sayaçlar için: değer değiştiğinde kısa bir "zıplama"
 * (scale bounce) tetikler. Gerçek bir sayı-yukarı-sayma animasyonu yerine
 * bunu seçtik -- coin kazanımları küçük (genelde +10), sayıyı 0'dan
 * saydırmak gereksiz gecikme katardı; zıplama tek başına "bir şey oldu"
 * hissini yeterince veriyor.
 */
export default function CoinBadge({ icon, value, label }: { icon: string; value: number; label: string }) {
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
        className={`text-lg font-black leading-none transition-transform duration-200 ${
          bump ? 'scale-125 text-amber-300' : 'text-amber-400'
        }`}
      >
        {icon} {value}
      </p>
      <p className="text-[10px] text-white/50 font-semibold uppercase tracking-wide">{label}</p>
    </div>
  );
}
