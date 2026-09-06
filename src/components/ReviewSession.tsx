import { useMemo, useState } from 'react';
import WordWheel from './WordWheel';
import { scrambleWord } from '../lib/scramble';
import { playCorrect, playWrong, playCelebrate } from '../lib/sound';
import { haptics } from '../lib/haptics';
import { celebrateWin } from '../lib/celebrate';
import { t, type Lang } from '../lib/i18n';
import type { VocabEntry } from '../lib/storage';
import type { Theme } from '../lib/themes';

interface Props {
  /** Bu oturumda sorulacak kelimeler (srs.ts tekrarOturumu'ndan gelir). */
  queue: VocabEntry[];
  lang: Lang;
  theme: Theme;
  /** Her cevaptan sonra çağrılır -- kutuyu ilerletme/düşürme işi çağırana ait. */
  onAnswer: (word: string, dogru: boolean) => void;
  onFinish: () => void;
}

/**
 * Tekrar oturumu. Oyunun ana mekaniğini (harf tekerleği) AYNEN kullanıyor;
 * yeni bir etkileşim biçimi öğretmiyor.
 *
 * Ana oyundan farkları bilinçli:
 *   - Türkçe ipucu HER ZAMAN açık: bu bir bulmaca değil, çeviri sınavı.
 *     "kelebek" gördüğünde BUTTERFLY kurabiliyor musun -- ölçülen bu.
 *   - Seri, sandık, seviye ilerlemesi YOK. Tekrar, ana ilerlemenin yerine
 *     geçmemeli; ikisi ayrı şeyler ve ödülleri karışırsa oyuncu tekrarı
 *     "jeton çiftliği" olarak kullanır.
 *   - Yanlış cevapta doğru kelime GÖSTERİLİYOR. Bilemediğin bir kelimeyi
 *     görmeden geçmek tekrarın amacını yok eder.
 */
export default function ReviewSession({ queue, lang, theme, onAnswer, onFinish }: Props) {
  const [i, setI] = useState(0);
  const [dogruSayisi, setDogru] = useState(0);
  // 'soru' -> cevap bekleniyor, 'dogru' / 'yanlis' -> sonuç gösteriliyor
  const [durum, setDurum] = useState<'soru' | 'dogru' | 'yanlis'>('soru');

  const entry = queue[i];
  const bitti = i >= queue.length;
  const letters = useMemo(
    () => (entry ? scrambleWord(entry.word).split('') : []),
    [entry],
  );

  function cevapla(selectedIdx: number[]) {
    if (durum !== 'soru' || !entry) return;
    const tahmin = selectedIdx.map((k) => letters[k]).join('').toLowerCase();
    const dogru = tahmin === entry.word.toLowerCase();
    setDurum(dogru ? 'dogru' : 'yanlis');
    if (dogru) {
      setDogru((n) => n + 1);
      playCorrect();
      haptics.correct();
    } else {
      playWrong();
      haptics.wrong();
    }
    onAnswer(entry.word, dogru);
  }

  function sonraki() {
    const son = i + 1 >= queue.length;
    if (son) {
      celebrateWin();
      playCelebrate();
    }
    setI(i + 1);
    setDurum('soru');
  }

  if (bitti) {
    const tam = dogruSayisi === queue.length;
    return (
      <main className="w-full max-w-md flex-1 flex flex-col items-center justify-center animate-[viewFade_0.25s_ease-out]">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center">
          <p className="text-5xl mb-3">{tam ? '🎉' : '✅'}</p>
          <h2 className="font-display text-xl font-extrabold">{t('reviewDone', lang)}</h2>
          <p className="mt-2 text-[15px] text-white/70">
            {dogruSayisi}/{queue.length} {t('reviewCorrect', lang)}
          </p>
          <p className="mt-1 text-[12px] text-white/50">{t('reviewNextHint', lang)}</p>
          <button
            onClick={onFinish}
            className={`font-display mt-5 w-full rounded-2xl py-3 font-extrabold ${theme.navActiveClass} active:scale-95 transition-transform`}
          >
            {t('backToGame', lang)}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full max-w-md flex-1 flex flex-col items-center animate-[viewFade_0.25s_ease-out]">
      {/* İlerleme: kaç soru kaldığını görmek oturumu bitirme ihtimalini
          artırıyor -- bitişi görünmeyen bir liste yarıda bırakılır. */}
      <div className="w-full mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-display text-[13px] font-bold">🔁 {t('reviewTitle', lang)}</span>
          <span className="text-[12px] font-bold tabular-nums text-white/60">
            {i + 1}/{queue.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/70 transition-[width] duration-300"
            style={{ width: `${(i / queue.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 pt-5 flex flex-col items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <p className="text-[11px] text-white/50 uppercase tracking-wide">{t('translateWord', lang)}</p>
        <p className="font-display text-2xl font-extrabold text-amber-300 mt-1 text-center px-2">
          {entry.tr}
        </p>

        {durum === 'soru' ? (
          <>
            <div className="flex gap-1 mt-4 mb-1">
              {entry.word.split('').map((_, k) => (
                <span key={k} className="w-7 h-9 rounded-lg border-2 border-white/20" />
              ))}
            </div>
            <WordWheel
              letters={letters}
              onSubmit={cevapla}
              disabled={false}
              gradientFrom={theme.wheelFrom}
              gradientTo={theme.wheelTo}
              tileSelectedClass={theme.tileSelectedClass}
            />
          </>
        ) : (
          <div className="w-full py-8 text-center">
            <p className="text-4xl mb-3">{durum === 'dogru' ? '✅' : '❌'}</p>
            {/* lang="en": sayfa TR olduğu için tarayıcı uppercase'i Türkçe
                kuralla uygular ve "mechanic" -> "MECHANİC" olur. */}
            <p lang="en" className="font-display text-3xl font-extrabold uppercase tracking-widest text-white">
              {entry.word}
            </p>
            <p className="text-[13px] text-white/60 mt-2">
              {durum === 'dogru' ? `+2 🪙` : t('reviewWrongAgain', lang)}
            </p>
            <button
              onClick={sonraki}
              className={`font-display mt-6 w-full rounded-2xl py-3 font-extrabold ${theme.navActiveClass} active:scale-95 transition-transform`}
            >
              {t('continueBtn', lang)} →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
