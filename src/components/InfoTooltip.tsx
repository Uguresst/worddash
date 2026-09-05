import { useState } from 'react';

/**
 * Küçük "ⓘ" düğmesi -- dokununca kısa bir açıklama balonu açar. Hover yok
 * (dokunmatik ekranda hover diye bir şey yok), bu yüzden tıkla-aç/tıkla-kapa.
 * Bir güçlendirme kartının İÇİNDE, kartın kendisi de tıklanabilir bir satın
 * alma düğmesi/alanı olduğunda kullanılıyor -- bu yüzden bilerek AYRI bir
 * <button> olarak duruyor (satın alma düğmesinin içine gömülü değil), yoksa
 * tarayıcı iç içe <button> render edemez ve tıklama olayları karışır.
 */
export default function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-label="info"
        aria-expanded={open}
        className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/30 text-white/80 text-[9px] font-bold flex items-center justify-center leading-none"
      >
        i
      </button>
      {open && (
        <>
          {/* Kapatma katmanı: baloncuğun dışına her dokunuş kapatır. Balondan
              önce render ediliyor ki z-index'te altında kalsın. */}
          <span
            className="fixed inset-0 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <span
            role="tooltip"
            className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-xl bg-slate-900 text-white text-[10px] leading-snug px-3 py-2 shadow-xl border border-white/15 animate-[popIn_0.15s_ease-out] text-left"
          >
            {text}
            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-white/15" />
          </span>
        </>
      )}
    </span>
  );
}
