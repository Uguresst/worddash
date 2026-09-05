import type { WordEntry } from '../lib/wordList';
import type { Lang } from '../lib/i18n';
import { t } from '../lib/i18n';
import type { Rank } from '../lib/ranks';

interface Props {
  word: WordEntry;
  coinsEarned: number;
  isNewBest: boolean;
  stars: 1 | 2 | 3;
  lang: Lang;
  /** Bu seviyeyi geçince yeni bir rütbeye geçildiyse -- kısa bir kutlama şeridi eklenir. */
  rankUp?: Rank | null;
  onContinue: () => void;
}

export default function LevelCompleteModal({ word, coinsEarned, isNewBest, stars, lang, rankUp, onContinue }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-xs rounded-3xl bg-gradient-to-b from-violet-600 to-fuchsia-700 p-6 text-center shadow-2xl animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
        {/* Yıldızlar sırayla, kısa gecikmelerle patlayarak beliriyor --
            hepsi aynı anda gelseydi "tek bir şey" gibi hissettirirdi,
            art arda gelmek bir sayım/ödül hissi veriyor. */}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`text-3xl ${n > stars ? 'opacity-25 grayscale' : ''}`}
              style={{ animation: `starPop 0.4s ease-out ${(n - 1) * 0.12}s both` }}
            >
              ⭐
            </span>
          ))}
        </div>

        <h2 className="font-display text-2xl font-extrabold text-white mb-1">{t('win', lang)}</h2>

        <div className="my-4 rounded-2xl bg-white/15 px-4 py-3">
          <p className="font-display text-2xl font-extrabold uppercase tracking-widest text-amber-300">
            {word.word}
          </p>
          <p className="text-sm text-white/80 mt-1">{word.tr}</p>
        </div>

        <p className="font-display text-amber-300 font-bold mb-1">+{coinsEarned} 🪙</p>
        {isNewBest && <p className="text-xs text-emerald-300 font-semibold mb-2">🔥 {t('newBest', lang)}</p>}

        {rankUp && (
          <div
            className={`mt-1 mb-3 rounded-xl bg-gradient-to-r ${rankUp.gradientClass} px-3 py-2 flex items-center justify-center gap-2 text-slate-900 animate-[popIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]`}
          >
            <span className="text-xl">{rankUp.icon}</span>
            <span className="font-display font-extrabold text-sm">
              {t('newRank', lang)} {t(rankUp.nameKey, lang)}
            </span>
          </div>
        )}

        <button
          onClick={onContinue}
          className="font-display mt-3 w-full rounded-2xl bg-white text-fuchsia-700 font-extrabold py-3 shadow-lg active:scale-95 transition-transform"
        >
          {t('continueBtn', lang)} →
        </button>
      </div>
    </div>
  );
}
