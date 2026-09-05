import { useEffect, useMemo, useState } from 'react';
import WordWheel from './components/WordWheel';
import CoinBadge from './components/CoinBadge';
import LevelCompleteModal from './components/LevelCompleteModal';
import BackgroundOrbs from './components/BackgroundOrbs';
import Leaderboard from './components/Leaderboard';
import { submitScore } from './lib/leaderboard';
import { wordForLevel, TOTAL_WORDS, difficultyOf, type Difficulty } from './lib/levels';
import { scrambleWord } from './lib/scramble';
import {
  loadState,
  completeLevel,
  setLang,
  buyTheme,
  selectTheme,
  toggleTranslationHint,
  type GameState,
} from './lib/storage';
import { celebrateWin } from './lib/celebrate';
import { THEMES, themeById } from './lib/themes';
import { t } from './lib/i18n';
import type { WordEntry } from './lib/wordList';

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  easy: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40',
  medium: 'bg-amber-400/15 text-amber-300 border-amber-400/40',
  hard: 'bg-rose-400/15 text-rose-300 border-rose-400/40',
};

export default function App() {
  const [state, setState] = useState<GameState>(() => loadState());
  const [view, setView] = useState<'game' | 'vocab' | 'shop' | 'leaderboard'>('game');
  const word = useMemo(() => wordForLevel(state.level), [state.level]);
  // Harfler dogrudan kelimeden turetiliyor -- ayri bir state+effect cifti
  // yerine memo yeterli, cunku "yeniden karistir" gibi bagimsiz bir eylem yok.
  const letters = useMemo(() => scrambleWord(word.word).split(''), [word.word]);
  const [revealedHint, setRevealedHint] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'wrong'>('idle');
  const [solvedWord, setSolvedWord] = useState<WordEntry | null>(null);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [wasNewBest, setWasNewBest] = useState(false);
  const [starsEarned, setStarsEarned] = useState<1 | 2 | 3>(3);

  const lang = state.lang;
  const theme = themeById(state.activeTheme);
  const justLooped = state.level > 0 && state.level % TOTAL_WORDS === 0;
  const difficulty = difficultyOf(word.word);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function handleSubmit(selectedIdx: number[]) {
    if (solvedWord) return; // modal açıkken tekerlek zaten disabled ama çift tetikleme koruması
    const guess = selectedIdx.map((i) => letters[i]).join('').toLowerCase();
    if (guess === word.word.toLowerCase()) {
      const usedHint = revealedHint > 0;
      const prevBest = state.bestStreak;
      const next = completeLevel(state, word, usedHint);
      setCoinsEarned(next.coins - state.coins);
      setWasNewBest(next.bestStreak > prevBest);
      setStarsEarned(revealedHint === 0 ? 3 : revealedHint === 1 ? 2 : 1);
      setSolvedWord(word);
      setState(next);
      setRevealedHint(0); // sıradaki seviye için sıfırla
      celebrateWin();
      submitScore(next).catch((err) => console.warn('Skor gönderilemedi:', err));
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback('idle'), 400);
    }
  }

  function revealHint() {
    setRevealedHint((h) => Math.min(h + 1, word.word.length - 1));
  }

  function changeLang(l: 'tr' | 'en') {
    setState(setLang(state, l));
  }

  function handleThemeAction(themeId: string, price: number, owned: boolean) {
    setState(owned ? selectTheme(state, themeId) : buyTheme(state, themeId, price));
  }

  return (
    <div className={`min-h-screen ${theme.bgClass} text-white flex flex-col items-center px-4 py-6 transition-colors duration-500 relative overflow-hidden`}>
      <BackgroundOrbs />
      <header className="w-full max-w-md flex items-center justify-between mb-5">
        <div>
          <h1 className={`font-display text-2xl font-extrabold tracking-tight ${theme.titleClass}`}>{t('title', lang)}</h1>
          <p className="text-xs text-white/50">{t('tagline', lang)}</p>
        </div>
        <div className="flex items-center gap-3">
          <CoinBadge icon="🪙" value={state.coins} label={t('coins', lang)} />
          <CoinBadge icon="🔥" value={state.currentStreak} label={t('streak', lang)} hot={state.currentStreak >= 3} />
          <div className="flex rounded-lg overflow-hidden border border-white/20 text-xs font-bold">
            <button
              onClick={() => changeLang('tr')}
              className={`px-2 py-1 ${lang === 'tr' ? theme.navActiveClass : 'bg-white/10 text-white/60'}`}
            >
              TR
            </button>
            <button
              onClick={() => changeLang('en')}
              className={`px-2 py-1 ${lang === 'en' ? theme.navActiveClass : 'bg-white/10 text-white/60'}`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <nav className="w-full max-w-md flex gap-1.5 mb-6">
        <button
          onClick={() => setView('game')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors truncate px-1 ${
            view === 'game' ? theme.navActiveClass : 'bg-white/10 text-white/60'
          }`}
        >
          🎮 <span className="font-display">{state.level + 1}</span>
        </button>
        <button
          onClick={() => setView('leaderboard')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors truncate px-1 ${
            view === 'leaderboard' ? theme.navActiveClass : 'bg-white/10 text-white/60'
          }`}
        >
          🏆 {t('leaderboard', lang)}
        </button>
        <button
          onClick={() => setView('vocab')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors truncate px-1 ${
            view === 'vocab' ? theme.navActiveClass : 'bg-white/10 text-white/60'
          }`}
        >
          📖 {state.vocabulary.length}
        </button>
        <button
          onClick={() => setView('shop')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors truncate px-1 ${
            view === 'shop' ? theme.navActiveClass : 'bg-white/10 text-white/60'
          }`}
        >
          🎨 {t('shop', lang)}
        </button>
      </nav>

      {view === 'game' && (
        <main className="w-full max-w-md flex-1 flex flex-col items-center">
          {justLooped && (
            <p className="text-[11px] text-amber-300/90 bg-amber-400/10 border border-amber-400/30 rounded-full px-3 py-1 mb-4 text-center">
              🔁 {t('outOfWords', lang)}
            </p>
          )}

          <div className="w-full flex items-center justify-between mb-3">
            <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${DIFFICULTY_STYLE[difficulty]}`}>
              {t(difficulty, lang)} · {word.word.length} {lang === 'tr' ? 'harf' : 'letters'}
            </span>
            <button
              onClick={() => setState(toggleTranslationHint(state))}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                state.showTranslationHint
                  ? 'bg-white/15 border-white/30 text-white'
                  : 'bg-white/5 border-white/15 text-white/40'
              }`}
            >
              {state.showTranslationHint ? '🇹🇷 ' + t('hintToggleOn', lang) : '🇹🇷 ' + t('hintToggleOff', lang)}
            </button>
          </div>

          {state.showTranslationHint && (
            <div className="w-full text-center mb-5 animate-[popIn_0.25s_ease-out]">
              <p className="text-[11px] text-white/50 uppercase tracking-wide">{t('translateWord', lang)}</p>
              <p className="font-display text-3xl font-extrabold text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]">
                {word.tr}
              </p>
            </div>
          )}

          {/* Cevap şeridi: harf sayısı kadar kutu, ipucu açılanlar dolu */}
          <div className={`flex gap-1.5 mb-8 flex-wrap justify-center ${feedback === 'wrong' ? 'animate-[shake_0.4s]' : ''}`}>
            {word.word.split('').map((ch, i) => {
              const isHint = i < revealedHint;
              return (
                <div
                  key={i}
                  className={`w-8 h-10 rounded-lg border-2 flex items-center justify-center font-display text-lg font-bold uppercase transition-colors ${
                    feedback === 'wrong'
                      ? 'border-rose-400 bg-rose-500/20 text-rose-200'
                      : isHint
                      ? 'border-amber-400/70 bg-amber-400/15 text-amber-300'
                      : 'border-white/25 text-white/30'
                  }`}
                >
                  {isHint ? ch : ''}
                </div>
              );
            })}
          </div>

          <div className="relative mb-6">
            <div
              className="absolute inset-0 rounded-full blur-2xl -z-10"
              style={{
                background: `radial-gradient(circle, ${theme.wheelFrom}55, transparent 70%)`,
                animation: 'wheelGlow 3s ease-in-out infinite',
              }}
            />
            <WordWheel
              letters={letters}
              onSubmit={handleSubmit}
              disabled={Boolean(solvedWord)}
              gradientFrom={theme.wheelFrom}
              gradientTo={theme.wheelTo}
              tileSelectedClass={theme.tileSelectedClass}
            />
          </div>

          <button
            onClick={revealHint}
            disabled={revealedHint >= word.word.length - 1}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-sm font-semibold disabled:opacity-30"
          >
            💡 {t('hint', lang)}
          </button>
        </main>
      )}

      {view === 'vocab' && (
        <main className="w-full max-w-md flex-1">
          {state.vocabulary.length === 0 ? (
            <p className="text-center text-white/50 text-sm mt-12">{t('emptyVocabulary', lang)}</p>
          ) : (
            <ul className="space-y-2">
              {[...state.vocabulary].reverse().map((v, i) => (
                <li
                  key={`${v.word}-${i}`}
                  className="flex items-center justify-between bg-white/8 border border-white/10 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="font-bold uppercase text-amber-300">{v.word}</p>
                    <p className="text-xs text-white/60">{v.tr}</p>
                  </div>
                  <p className="text-[10px] text-white/40">
                    {new Date(v.learnedAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </main>
      )}

      {view === 'shop' && (
        <main className="w-full max-w-md flex-1 grid grid-cols-2 gap-3">
          {THEMES.map((th) => {
            const owned = state.unlockedThemes.includes(th.id);
            const active = state.activeTheme === th.id;
            const affordable = state.coins >= th.price;
            return (
              <div
                key={th.id}
                className={`rounded-2xl overflow-hidden border-2 ${active ? 'border-white' : 'border-white/10'}`}
              >
                <div className={`h-16 ${th.bgClass}`} />
                <div className="bg-white/8 p-3">
                  <p className="font-display font-bold text-sm">{th.name}</p>
                  <p className="text-[11px] text-white/50 mb-2">
                    {th.price === 0 ? t('free', lang) : `🪙 ${th.price}`}
                  </p>
                  <button
                    onClick={() => handleThemeAction(th.id, th.price, owned)}
                    disabled={active || (!owned && !affordable)}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      active
                        ? 'bg-white/10 text-white/40 cursor-default'
                        : owned
                        ? 'bg-white text-slate-900'
                        : affordable
                        ? 'bg-emerald-400 text-slate-900'
                        : 'bg-white/10 text-white/30'
                    }`}
                  >
                    {active ? t('selected', lang) : owned ? t('select', lang) : !affordable ? t('notEnoughCoins', lang) : t('buy', lang)}
                  </button>
                </div>
              </div>
            );
          })}
        </main>
      )}

      {view === 'leaderboard' && <Leaderboard state={state} lang={lang} navActiveClass={theme.navActiveClass} />}

      {solvedWord && (
        <LevelCompleteModal
          word={solvedWord}
          coinsEarned={coinsEarned}
          isNewBest={wasNewBest}
          stars={starsEarned}
          lang={lang}
          onContinue={() => setSolvedWord(null)}
        />
      )}
    </div>
  );
}
