import type { Lang } from '../lib/i18n';
import { t } from '../lib/i18n';

/**
 * İlk açılışta bir kere gösterilen tanıtım. Tekerlek mekaniği (basılı
 * tutup harften harfe sürükleme) ilk bakışta apaçık değil -- bir yazı
 * kutusuna alışkın biri için "neden yazamıyorum" kafası karışıklığı
 * yaratabilir. Bu ekran, gerçek bir kelimeyi (CAT) hedef alarak parmağın
 * nasıl gezdiğini SAF CSS animasyonuyla gösteriyor -- video/GIF değil,
 * hiçbir asset ağırlığı eklemiyor.
 */
export default function OnboardingOverlay({ lang, onDismiss }: { lang: Lang; onDismiss: () => void }) {
  const letters = ['C', 'A', 'T'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md px-4 animate-[fadeIn_0.25s_ease-out]">
      <div className="w-full max-w-xs rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 p-6 text-center shadow-2xl animate-[popIn_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
        <p className="font-display text-xl font-extrabold text-white mb-1">{t('welcomeTitle', lang)}</p>
        <p className="text-sm text-white/60 mb-6">{t('welcomeBody', lang)}</p>

        {/* Demo: 3 harf + üzerinde gezinen bir parmak ikonu. */}
        <div className="relative h-20 mb-6 flex items-center justify-center gap-4">
          {letters.map((ch) => (
            <div
              key={ch}
              className="w-12 h-12 rounded-full bg-white text-slate-900 font-display font-extrabold text-lg flex items-center justify-center"
              style={{ boxShadow: '0 3px 0 rgba(15,23,42,0.25), inset 0 2px 0 rgba(255,255,255,0.6)' }}
            >
              {ch}
            </div>
          ))}
          <div
            className="absolute text-3xl"
            style={{ animation: 'tutorialSwipe 1.8s ease-in-out infinite', left: 0, top: '2px' }}
          >
            👆
          </div>
        </div>

        <ul className="text-left text-xs text-white/70 space-y-2 mb-6">
          <li>👉 {t('welcomeStep1', lang)}</li>
          <li>✅ {t('welcomeStep2', lang)}</li>
          <li>🇹🇷 {t('welcomeStep3', lang)}</li>
        </ul>

        <button
          onClick={onDismiss}
          className="font-display w-full rounded-2xl bg-white text-slate-900 font-extrabold py-3 shadow-lg active:scale-95 transition-transform"
        >
          {t('welcomeStart', lang)} →
        </button>
      </div>
    </div>
  );
}
