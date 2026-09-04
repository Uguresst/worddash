import { useEffect, useMemo, useState } from 'react';
import { todaysWord } from './lib/dailyWord';
import { scrambleWord } from './lib/scramble';
import { loadState, recordResult, setLang, hasPlayedToday, type GameState } from './lib/storage';
import { t } from './lib/i18n';

type PoolLetter = { char: string; used: boolean };

function buildPool(letters: string): PoolLetter[] {
  return letters.split('').map((char) => ({ char, used: false }));
}

export default function App() {
  const [state, setState] = useState<GameState>(() => loadState());
  const [view, setView] = useState<'game' | 'vocab'>('game');
  const word = useMemo(() => todaysWord(), []);
  const [pool, setPool] = useState<PoolLetter[]>(() => buildPool(scrambleWord(word.word)));
  const [guessIdx, setGuessIdx] = useState<number[]>([]); // pool içindeki index sırası
  const [shake, setShake] = useState(false);
  const [revealedHint, setRevealedHint] = useState(0);

  const lang = state.lang;
  const played = hasPlayedToday(state);
  const guess = guessIdx.map((i) => pool[i].char).join('');

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function tapPoolLetter(i: number) {
    if (played || pool[i].used) return;
    setPool((p) => p.map((l, idx) => (idx === i ? { ...l, used: true } : l)));
    setGuessIdx((g) => [...g, i]);
  }

  function tapGuessLetter(posInGuess: number) {
    if (played) return;
    const poolIdx = guessIdx[posInGuess];
    setPool((p) => p.map((l, idx) => (idx === poolIdx ? { ...l, used: false } : l)));
    setGuessIdx((g) => g.filter((_, idx) => idx !== posInGuess));
  }

  function reshuffle() {
    if (guessIdx.length > 0 || played) return;
    setPool(buildPool(scrambleWord(word.word)));
  }

  function revealHint() {
    if (played) return;
    setRevealedHint((h) => Math.min(h + 1, word.word.length - 1));
  }

  function check() {
    if (played || guess.length !== word.word.length) return;
    const won = guess.toLowerCase() === word.word.toLowerCase();
    if (!won) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      // Yanlış deneme -- harfleri havuza geri koy, tekrar denesin.
      setPool(buildPool(scrambleWord(word.word)));
      setGuessIdx([]);
      return;
    }
    const next = recordResult(state, true, word);
    setState(next);
  }

  function changeLang(l: 'tr' | 'en') {
    setState(setLang(state, l));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-8">
      <header className="w-full max-w-md flex items-center justify-between mb-8">
        <div>
          <h1 className="font-black text-2xl tracking-tight text-indigo-400">{t('title', lang)}</h1>
          <p className="text-xs text-slate-500">{t('tagline', lang)}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-lg font-bold text-amber-400 leading-none">🔥 {state.streak}</p>
            <p className="text-[10px] text-slate-500">{t('streak', lang)}</p>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs font-semibold">
            <button
              onClick={() => changeLang('tr')}
              className={`px-2 py-1 ${lang === 'tr' ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400'}`}
            >
              TR
            </button>
            <button
              onClick={() => changeLang('en')}
              className={`px-2 py-1 ${lang === 'en' ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400'}`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      <nav className="w-full max-w-md flex gap-2 mb-6">
        <button
          onClick={() => setView('game')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
            view === 'game' ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400'
          }`}
        >
          {t('play', lang)}
        </button>
        <button
          onClick={() => setView('vocab')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
            view === 'vocab' ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-slate-400'
          }`}
        >
          {t('myVocabulary', lang)} ({state.vocabulary.length})
        </button>
      </nav>

      {view === 'game' ? (
        <main className="w-full max-w-md flex-1 flex flex-col items-center">
          {played ? (
            <div className="text-center mt-12 space-y-3">
              <p className="text-4xl">{state.lastResult === 'won' ? '🎉' : '📅'}</p>
              <p className="text-xl font-bold">
                {state.lastResult === 'won' ? t('win', lang) : t('lose', lang)}
              </p>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 inline-block">
                <p className="text-2xl font-black tracking-widest text-indigo-300 uppercase">{word.word}</p>
                <p className="text-sm text-slate-400 mt-1">{word.tr}</p>
              </div>
              <p className="text-xs text-slate-500">{t('comeBackTomorrow', lang)}</p>
            </div>
          ) : (
            <>
              {/* Tahmin şeridi */}
              <div className={`flex gap-2 mb-8 flex-wrap justify-center ${shake ? 'animate-[shake_0.4s]' : ''}`}>
                {word.word.split('').map((_, i) => {
                  const filled = i < guess.length;
                  const isHint = !filled && i < revealedHint;
                  return (
                    <button
                      key={i}
                      onClick={() => filled && tapGuessLetter(i)}
                      className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center text-xl font-black uppercase transition-colors ${
                        filled
                          ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                          : isHint
                          ? 'border-amber-500/60 text-amber-400 bg-amber-500/10'
                          : 'border-slate-700 text-slate-600'
                      }`}
                    >
                      {filled ? guess[i] : isHint ? word.word[i] : ''}
                    </button>
                  );
                })}
              </div>

              {/* Harf havuzu */}
              <div className="flex gap-2 flex-wrap justify-center mb-8">
                {pool.map((l, i) => (
                  <button
                    key={i}
                    onClick={() => tapPoolLetter(i)}
                    disabled={l.used}
                    className={`w-11 h-11 rounded-xl font-black uppercase text-lg flex items-center justify-center transition-all ${
                      l.used
                        ? 'opacity-0 pointer-events-none'
                        : 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-white border border-slate-600'
                    }`}
                  >
                    {l.char}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={reshuffle}
                  disabled={guessIdx.length > 0}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold disabled:opacity-30"
                >
                  🔀 {t('shuffle', lang)}
                </button>
                <button
                  onClick={revealHint}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold"
                >
                  💡 {t('hint', lang)}
                </button>
                <button
                  onClick={check}
                  disabled={guess.length !== word.word.length}
                  className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold disabled:opacity-30"
                >
                  {t('check', lang)}
                </button>
              </div>
            </>
          )}
        </main>
      ) : (
        <main className="w-full max-w-md flex-1">
          {state.vocabulary.length === 0 ? (
            <p className="text-center text-slate-500 text-sm mt-12">{t('emptyVocabulary', lang)}</p>
          ) : (
            <ul className="space-y-2">
              {[...state.vocabulary].reverse().map((v, i) => (
                <li
                  key={`${v.word}-${i}`}
                  className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="font-bold uppercase text-indigo-200">{v.word}</p>
                    <p className="text-xs text-slate-500">{v.tr}</p>
                  </div>
                  <p className="text-[10px] text-slate-600">{v.learnedDate}</p>
                </li>
              ))}
            </ul>
          )}
        </main>
      )}
    </div>
  );
}
