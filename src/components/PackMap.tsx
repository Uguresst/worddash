import { useEffect, useRef } from 'react';
import { WORD_PACKS } from '../lib/wordPacks';
import { packProgress, isPackUnlocked, packForLevel, TOTAL_WORDS } from '../lib/levels';
import { t, type Lang } from '../lib/i18n';

interface Props {
  level: number;
  lang: Lang;
}

/**
 * Paket haritası. Oyunun içerik derinliğini GÖRÜNÜR kılan ekran.
 *
 * Eskiden oyuncu tek bir "Seviye 47" sayısı görüyordu -- kaç kelime kaldığını,
 * neyin geleceğini bilmiyordu, dolayısıyla oynamaya devam etmek için somut bir
 * hedefi de yoktu. Burada 18 paketin tamamı, kilitliler dahil, adı ve ikonuyla
 * duruyor: kilitli paket bir ceza değil, bir REKLAM -- "Teknoloji paketi seni
 * bekliyor" demek, sonraki oturumun sebebi oluyor.
 *
 * Kilitli kartların metni bilerek text-white/45 ve üstü: daha soluk tonlar
 * (/25-/30) ekran görüntüsünde okunmuyordu, oyuncu paketin adını seçemiyordu --
 * ki o ad tam olarak devam etme sebebi.
 */
export default function PackMap({ level, lang }: Props) {
  const here = packForLevel(level);
  const activeRef = useRef<HTMLDivElement>(null);
  const donePacks = WORD_PACKS.filter((_, i) => packProgress(i, level) === WORD_PACKS[i].words.length).length;

  // Oyuncu 12. pakette olabilir -- haritayı en baştan gösterip onu aşağı
  // kaydırmaya zorlamak yerine bulunduğu yere getiriyoruz.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <main className="w-full max-w-md flex-1 flex flex-col animate-[viewFade_0.25s_ease-out] pb-4">
      <div className="text-center mb-4">
        <h2 className="font-display text-xl font-extrabold">{t('packMapTitle', lang)}</h2>
        <p className="text-[12px] text-white/55 mt-1 px-6">{t('packMapSubtitle', lang)}</p>
        <p className="text-[11px] text-white/45 mt-2">
          {donePacks}/{WORD_PACKS.length} {t('packsDoneLabel', lang)} · {TOTAL_WORDS.toLocaleString(lang)}{' '}
          {t('wordsTotalLabel', lang)}
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {WORD_PACKS.map((pack, i) => {
          const size = pack.words.length;
          const done = packProgress(i, level);
          const unlocked = isPackUnlocked(i, level);
          const complete = done === size;
          const isHere = i === here.packIndex && !complete;
          const startLevel = WORD_PACKS.slice(0, i).reduce((n, p) => n + p.words.length, 0);

          return (
            <div
              key={pack.id}
              ref={isHere ? activeRef : undefined}
              className={`rounded-2xl border p-3.5 transition-colors ${
                isHere
                  ? 'border-white/45 bg-white/15 shadow-lg ring-1 ring-white/25'
                  : complete
                    ? 'border-emerald-400/30 bg-emerald-400/10'
                    : unlocked
                      ? 'border-white/10 bg-white/5'
                      : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-2xl leading-none ${unlocked ? '' : 'grayscale opacity-60'}`}>
                  {unlocked ? pack.icon : '🔒'}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h3
                      className={`font-display font-bold text-[15px] truncate ${
                        unlocked ? 'text-white' : 'text-white/45'
                      }`}
                    >
                      {lang === 'en' ? pack.nameEn : pack.name}
                    </h3>
                    {complete && <span className="text-emerald-300 text-[13px] shrink-0">✓</span>}
                    {isHere && (
                      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide rounded-full bg-white/20 px-2 py-0.5 text-white/90">
                        {t('packInProgress', lang)}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] truncate ${unlocked ? 'text-white/55' : 'text-white/45'}`}>
                    {unlocked
                      ? lang === 'en'
                        ? pack.blurbEn
                        : pack.blurb
                      : t('packUnlocksAt', lang).replace('{n}', String(startLevel + 1))}
                  </p>
                </div>

                <span
                  className={`text-[11px] font-bold tabular-nums shrink-0 ${
                    complete ? 'text-emerald-300' : unlocked ? 'text-white/70' : 'text-white/45'
                  }`}
                >
                  {done}/{size}
                </span>
              </div>

              {/* İlerleme çubuğu yalnızca açık paketlerde -- kilitlide hep
                  boş bir çubuk göstermek gürültüden başka bir şey değil. */}
              {unlocked && (
                <div className="mt-2.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ${
                      complete ? 'bg-emerald-400' : 'bg-white/70'
                    }`}
                    style={{ width: `${(done / size) * 100}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
