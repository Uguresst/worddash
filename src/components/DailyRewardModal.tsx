import type { Lang } from '../lib/i18n';
import { t } from '../lib/i18n';

interface Props {
  lang: Lang;
  /** claimDailyReward() henüz ÇAĞRILMADAN önceki önizleme -- "topla" düğmesine
   *  basınca App bu miktarı gerçekten ekleyecek. */
  previewAmount: number;
  previewStreak: number;
  onClaim: () => void;
}

/**
 * Günde bir kez, açılışta karşılayan ödül modalı. 7 günlük bir seri şeridi
 * gösteriyor (Duolingo/çoğu mobil oyunun kullandığı, kanıtlanmış bir geri
 * dönüş teşviki) -- art arda gelmek jetonu büyütüyor, bir gün atlanınca 1'e
 * dönüyor (mantık storage.ts'de).
 */
export default function DailyRewardModal({ lang, previewAmount, previewStreak, onClaim }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-xs rounded-3xl bg-gradient-to-b from-amber-500 to-orange-600 p-6 text-center shadow-2xl animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
        <p className="text-4xl mb-2">🎁</p>
        <h2 className="font-display text-xl font-extrabold text-white mb-1">{t('dailyRewardTitle', lang)}</h2>
        <p className="text-xs text-white/80 mb-4">{t('dailyRewardBody', lang)}</p>

        <div className="flex justify-center gap-1 mb-4">
          {days.map((d) => {
            const reached = d <= previewStreak;
            const isToday = d === previewStreak;
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-8 rounded-lg flex items-center justify-center text-[13px] border-2 ${
                    isToday
                      ? 'bg-white text-orange-600 border-white scale-110'
                      : reached
                      ? 'bg-white/30 border-white/50 text-white'
                      : 'bg-black/10 border-white/20 text-white/40'
                  }`}
                >
                  {reached ? '🪙' : d}
                </div>
                <span className="text-[9px] text-white/60">{d}</span>
              </div>
            );
          })}
        </div>

        <p className="font-display text-2xl font-extrabold text-white mb-4">+{previewAmount} 🪙</p>

        <button
          onClick={onClaim}
          className="font-display w-full rounded-2xl bg-white text-orange-700 font-extrabold py-3 shadow-lg active:scale-95 transition-transform"
        >
          {t('dailyRewardClaim', lang)}
        </button>
      </div>
    </div>
  );
}
