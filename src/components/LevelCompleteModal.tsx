import type { WordEntry } from '../lib/wordList';
import type { Lang } from '../lib/i18n';
import { t } from '../lib/i18n';

interface Props {
  word: WordEntry;
  coinsEarned: number;
  isNewBest: boolean;
  lang: Lang;
  onContinue: () => void;
}

export default function LevelCompleteModal({ word, coinsEarned, isNewBest, lang, onContinue }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-xs rounded-3xl bg-gradient-to-b from-violet-600 to-fuchsia-700 p-6 text-center shadow-2xl animate-[popIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)]">
        <p className="text-5xl mb-2">🎉</p>
        <h2 className="text-2xl font-black text-white mb-1">{t('win', lang)}</h2>

        <div className="my-4 rounded-2xl bg-white/15 px-4 py-3">
          <p className="text-2xl font-black uppercase tracking-widest text-amber-300">{word.word}</p>
          <p className="text-sm text-white/80 mt-1">{word.tr}</p>
        </div>

        <p className="text-amber-300 font-bold mb-1">+{coinsEarned} 🪙</p>
        {isNewBest && <p className="text-xs text-emerald-300 font-semibold mb-2">🔥 {t('newBest', lang)}</p>}

        <button
          onClick={onContinue}
          className="mt-3 w-full rounded-2xl bg-white text-fuchsia-700 font-black py-3 shadow-lg active:scale-95 transition-transform"
        >
          {t('continueBtn', lang)} →
        </button>
      </div>
    </div>
  );
}
