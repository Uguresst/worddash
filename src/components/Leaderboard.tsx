import { useEffect, useState } from 'react';
import {
  ensureSession,
  fetchTopScores,
  getSavedNickname,
  setNickname as saveNickname,
  type LeaderboardRow,
} from '../lib/leaderboard';
import type { GameState } from '../lib/storage';
import type { Lang } from '../lib/i18n';
import { t } from '../lib/i18n';

interface Props {
  state: GameState;
  lang: Lang;
  navActiveClass: string;
}

export default function Leaderboard({ state, lang, navActiveClass }: Props) {
  const [nickname, setNicknameState] = useState<string | null>(() => getSavedNickname());
  const [input, setInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinError, setJoinError] = useState(false);

  useEffect(() => {
    // Takma ad yoksa bu bilesen zaten asagida "katil" ekranini donuyor,
    // loading hic okunmuyor -- burada dokunmaya gerek yok.
    if (!nickname) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [id, top] = await Promise.all([ensureSession(), fetchTopScores(20)]);
      if (cancelled) return;
      setMyId(id);
      setRows(top);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // nickname degistiginde (katilinca) yeniden cek; state.level'de her
    // seviye submitScore zaten yaziyor ama bu goruntu anlik acilista yeterli.
  }, [nickname]);

  async function handleJoin() {
    if (!input.trim() || joining) return;
    setJoining(true);
    setJoinError(false);
    try {
      await saveNickname(input, state);
      setNicknameState(input.trim().slice(0, 20));
    } catch (err) {
      // Sunucudaki isim denetim tetikleyicisi uygunsuz takma adı burada
      // reddediyor -- sessizce yutmak yerine kullanıcıya net söylüyoruz.
      console.error('Lider tablosuna katilinamadi:', err);
      setJoinError(true);
    } finally {
      setJoining(false);
    }
  }

  if (!nickname) {
    return (
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center text-center px-4">
        <p className="text-5xl mb-3">🏆</p>
        <p className="text-sm text-white/70 mb-4">{t('nicknamePrompt', lang)}</p>
        <div className="w-full flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            placeholder={t('nicknamePlaceholder', lang)}
            maxLength={20}
            className="flex-1 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-white/50"
          />
          <button
            onClick={handleJoin}
            disabled={!input.trim() || joining}
            className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-display font-bold disabled:opacity-40"
          >
            {t('join', lang)}
          </button>
        </div>
        {joinError && <p className="text-xs text-rose-300 mt-3">{t('nicknameRejected', lang)}</p>}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md flex-1">
      <h2 className="font-display text-lg font-extrabold text-center mb-3">{t('leaderboardTitle', lang)}</h2>
      {loading ? (
        <p className="text-center text-white/50 text-sm mt-8">{t('loadingLeaderboard', lang)}</p>
      ) : rows.length === 0 ? (
        <p className="text-center text-white/50 text-sm mt-8">{t('noScoresYet', lang)}</p>
      ) : (
        <ol className="space-y-1.5">
          {rows.map((r, i) => {
            const isMe = r.id === myId;
            return (
              <li
                key={r.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                  isMe ? `${navActiveClass} shadow-lg` : 'bg-white/8 border border-white/10'
                }`}
              >
                <span className="font-display font-extrabold w-6 text-center shrink-0">{i + 1}</span>
                <span className="flex-1 min-w-0 truncate font-semibold">
                  {r.nickname} {isMe && <span className="opacity-60 text-xs">({t('you', lang)})</span>}
                </span>
                <span className="font-display font-bold shrink-0">{t('level', lang)} {r.best_level + 1}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
