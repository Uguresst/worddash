import { useEffect } from 'react';
import { celebrateStreak } from '../lib/celebrate';
import { playCelebrate } from '../lib/sound';
import { haptics } from '../lib/haptics';
import { t, type Lang } from '../lib/i18n';
import type { SeriKutlamasi } from '../lib/streak';

interface Props {
  kutlama: SeriKutlamasi;
  lang: Lang;
  onClose: () => void;
}

/**
 * Seri kutlama ekranı. Seviye tamamlama penceresinden SONRA, ayrı bir an
 * olarak açılıyor.
 *
 * Neden ayrı bir ekran: bu anlar (ilk seri, çarpanın yükselmesi, kişisel
 * rekor) seviye tamamlama penceresine sıkıştırılmış küçük bir satır olarak
 * duruyordu ve kimse fark etmiyordu. Nadir olan şey, kendi ekranını hak
 * eder -- kutlamanın işe yaraması için oyuncunun akışını bir saniyeliğine
 * durdurması gerekiyor.
 *
 * Sıklık kontrolü streak.ts'te: kutlama yalnızca eşikte, çarpan
 * eşiklerinde ve rekorun TAM bir üstünde çıkıyor. Rekor bölgesindeki her
 * kelimede açılsaydı tam tersi etkiyi yapardı.
 */
export default function StreakCelebration({ kutlama, lang, onClose }: Props) {
  // Kutlama bir engel değil bir ödül: kendiliğinden kapanıyor, ama
  // dokunmak da kapatıyor (hızlı oyuncu beklemek zorunda kalmasın).
  useEffect(() => {
    celebrateStreak();
    playCelebrate();
    haptics.correct();
    const id = setTimeout(onClose, 2600);
    return () => clearTimeout(id);
  }, [onClose]);

  const baslik =
    kutlama.tur === 'ilk'
      ? t('streakFirstTitle', lang)
      : kutlama.tur === 'carpan'
        ? t('streakMultiplierTitle', lang).replace('{n}', String(kutlama.carpan))
        : t('streakRecordTitle', lang);

  const altyazi =
    kutlama.tur === 'ilk'
      ? t('streakFirstBody', lang)
      : kutlama.tur === 'carpan'
        ? t('streakMultiplierBody', lang).replace('{n}', String(kutlama.carpan))
        : t('streakRecordBody', lang);

  return (
    <button
      onClick={onClose}
      aria-label={baslik}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md px-6 animate-[fadeIn_0.2s_ease-out]"
    >
      {/* Alevin arkasındaki halka: sayı büyük ve tek başına dursun diye
          süsleme minimum, dikkat rakamda kalıyor. */}
      <div className="relative flex items-center justify-center mb-4">
        <span
          className="absolute w-40 h-40 rounded-full bg-amber-400/20 blur-2xl"
          style={{ animation: 'flamePulse 1.4s ease-in-out infinite' }}
        />
        <span
          className="relative text-7xl"
          style={{ animation: 'starPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}
        >
          🔥
        </span>
      </div>

      <p
        className="font-display text-6xl font-extrabold text-amber-300 leading-none"
        style={{ animation: 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}
      >
        {kutlama.seri}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50 mt-2">
        {t('streak', lang)}
      </p>

      <h2
        className="font-display text-2xl font-extrabold text-white mt-5 text-center"
        style={{ animation: 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }}
      >
        {baslik}
      </h2>
      <p className="text-[14px] text-white/70 mt-2 text-center max-w-xs leading-relaxed">{altyazi}</p>

      {/* Çarpan/ilk kutlamasında ayrıca rekor da kırıldıysa onu da söyle --
          iki ayrı ekran açmak yerine tek ekranda iki satır. */}
      {kutlama.rekorMu && kutlama.tur !== 'rekor' && (
        <p className="mt-3 text-[12px] font-bold text-emerald-300">🏅 {t('streakAlsoRecord', lang)}</p>
      )}

      <p className="absolute bottom-10 text-[11px] text-white/40">{t('tapToContinue', lang)}</p>
    </button>
  );
}
