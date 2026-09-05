import { useState } from 'react';
import type { Lang } from '../lib/i18n';
import { t } from '../lib/i18n';
import type { ChestReward } from '../lib/storage';
import { themeById, themeName } from '../lib/themes';

interface Props {
  lang: Lang;
  /** Gerçek state mutasyonunu App.tsx yapıyor (setState + ses/titreşim) --
   *  bu bileşen sadece "aç" anını gösterip sonucu döndürüyor. */
  onOpen: () => ChestReward;
  onClose: () => void;
}

/**
 * Tek bir yetkilendirilmiş an: dokun -> kutu açılır -> ödül belirir. Ayrı
 * ayrı zıplama/patlama efektleri üst üste binmesin diye kutu-bekleme ve
 * ödül-belirme birbirini KESİYOR (ikisi asla aynı anda ekranda değil).
 */
export default function ChestModal({ lang, onOpen, onClose }: Props) {
  const [reward, setReward] = useState<ChestReward | null>(null);

  function handleTap() {
    if (reward) return;
    setReward(onOpen());
  }

  const rewardLine = (() => {
    if (!reward) return null;
    if (reward.kind === 'coins') return `+${reward.amount} 🪙`;
    if (reward.kind === 'skip') return `+${reward.amount} 🎟️`;
    if (reward.kind === 'shield') return `+${reward.amount} 🛡️`;
    const th = themeById(reward.themeId);
    return `🎨 ${themeName(th, lang)}!`;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-xs rounded-3xl bg-gradient-to-b from-amber-800 via-amber-700 to-yellow-800 p-8 text-center shadow-2xl animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
        {!reward ? (
          <button type="button" onClick={handleTap} className="flex flex-col items-center gap-4 w-full">
            <span className="text-6xl" style={{ animation: 'chestFloat 1.4s ease-in-out infinite' }}>
              📦
            </span>
            <span className="font-display text-lg font-extrabold text-white">{t('chestTapToOpen', lang)}</span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <span className="text-6xl animate-[popIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">🎉</span>
            <p className="font-display text-2xl font-extrabold text-yellow-200">{rewardLine}</p>
            <button
              onClick={onClose}
              className="font-display mt-2 w-full rounded-2xl bg-white text-amber-800 font-extrabold py-3 shadow-lg active:scale-95 transition-transform"
            >
              {t('continueBtn', lang)} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
