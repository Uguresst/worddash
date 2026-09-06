import { useState } from 'react';
import {
  geriYukle,
  kayitliKod,
  kayitOzeti,
  kodBicimle,
  yedeklemeAcikMi,
  yedeklemeyiAc,
  yedeklemeyiKapat,
} from '../lib/cloudSave.ts';
import type { GameState } from '../lib/storage';
import { t, type Lang } from '../lib/i18n';

interface Props {
  state: GameState;
  lang: Lang;
  /** Kurtarılan kaydı uygulamaya uygular (yerel ilerlemenin üstüne yazar). */
  onRestore: (next: GameState) => void;
}

/**
 * Yedekleme paneli — Rekabet sekmesinin altında.
 *
 * NEDEN BURADA: uygulamanın ağa çıktığı tek sekme burası. Gizlilik
 * politikası "lider tablosuna katılmadığın sürece uygulama hiçbir dış
 * sunucuya bağlanmaz" diyor; ağ gerektiren her şeyi aynı yerde toplamak
 * o cümleyi hem doğru hem anlaşılır tutuyor.
 *
 * NEDEN İSTEĞE BAĞLI: aynı sebep. Açılmadıkça tek bir istek bile
 * gitmiyor.
 */
export default function BackupPanel({ state, lang, onRestore }: Props) {
  const [kod, setKod] = useState<string | null>(() => (yedeklemeAcikMi() ? kayitliKod() : null));
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [kopyalandi, setKopyalandi] = useState(false);
  /* Kurtarma iki adımlı: girilen kodun kaydı ÖNCE gösteriliyor, sonra
     onaylanıyor. Tek dokunuşla yerel ilerlemenin üstüne yazmak, yanlış
     kod giren birine geri alınamaz bir kayıp yaşatırdı. */
  const [girilenKod, setGirilenKod] = useState('');
  const [aday, setAday] = useState<GameState | null>(null);

  async function ac() {
    setMesgul(true);
    setHata(null);
    try {
      setKod(await yedeklemeyiAc(state));
    } catch {
      setHata(t('backupError', lang));
    } finally {
      setMesgul(false);
    }
  }

  async function kapat() {
    setMesgul(true);
    setHata(null);
    try {
      await yedeklemeyiKapat();
      setKod(null);
    } catch {
      setHata(t('backupError', lang));
    } finally {
      setMesgul(false);
    }
  }

  async function ara() {
    setMesgul(true);
    setHata(null);
    try {
      const bulunan = await geriYukle(girilenKod);
      if (!bulunan) setHata(t('restoreNotFound', lang));
      else setAday(bulunan);
    } catch {
      setHata(t('backupError', lang));
    } finally {
      setMesgul(false);
    }
  }

  function kopyala() {
    if (!kod) return;
    navigator.clipboard?.writeText(kodBicimle(kod)).then(
      () => {
        setKopyalandi(true);
        setTimeout(() => setKopyalandi(false), 1800);
      },
      () => {
        /* Pano izni yok (bazı Android webview'lerinde olmuyor). Kod zaten
           ekranda yazılı duruyor, elle not edilebilir -- hata göstermek
           gereksiz telaş olurdu. */
      },
    );
  }

  const simdiki = kayitOzeti(state);

  return (
    <section className="w-full mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="font-display text-sm font-extrabold text-white/90">{t('backupTitle', lang)}</h3>
      <p className="text-[12px] text-white/55 leading-relaxed mt-1">{t('backupBlurb', lang)}</p>

      {kod ? (
        <div className="mt-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">
            {t('backupCodeLabel', lang)}
          </p>
          <button
            onClick={kopyala}
            className="mt-1.5 w-full rounded-xl bg-slate-950/60 border border-white/15 px-3 py-3 font-mono text-lg font-bold tracking-[0.15em] text-white tabular-nums"
            lang="en"
          >
            {kodBicimle(kod)}
          </button>
          <p className="text-[11px] text-amber-300/80 leading-relaxed mt-2">
            {kopyalandi ? t('copied', lang) : t('backupCodeWarn', lang)}
          </p>
          <button
            onClick={kapat}
            disabled={mesgul}
            className="mt-3 text-[12px] font-bold text-rose-300/80 hover:text-rose-300 disabled:opacity-50"
          >
            {t('backupOff', lang)}
          </button>
        </div>
      ) : (
        <button
          onClick={ac}
          disabled={mesgul}
          className="mt-3 w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {t('backupOn', lang)}
        </button>
      )}

      {/* Kurtarma her zaman görünür: yedeklemesi olmayan YENİ cihaz da
          burayı kullanacak, hatta asıl kullanacak olan o. */}
      <div className="mt-5 pt-4 border-t border-white/10">
        <h4 className="text-[12px] font-bold text-white/80">{t('restoreTitle', lang)}</h4>
        {aday ? (
          <div className="mt-2">
            <p className="text-[12px] text-white/60 leading-relaxed">{t('restoreConfirm', lang)}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
              <div className="rounded-xl bg-slate-950/50 border border-white/10 p-2.5">
                <p className="text-white/40 text-[10px] font-bold uppercase">{t('restoreCurrent', lang)}</p>
                <p className="text-white/80 mt-1 tabular-nums">
                  {t('restoreSummary', lang)
                    .replace('{lvl}', String(simdiki.seviye))
                    .replace('{w}', String(simdiki.kelime))}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-2.5">
                <p className="text-emerald-200/60 text-[10px] font-bold uppercase">{t('restoreIncoming', lang)}</p>
                <p className="text-emerald-100 mt-1 tabular-nums">
                  {t('restoreSummary', lang)
                    .replace('{lvl}', String(kayitOzeti(aday).seviye))
                    .replace('{w}', String(kayitOzeti(aday).kelime))}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onRestore(aday)}
                className="flex-1 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-bold text-slate-950"
              >
                {t('restoreApply', lang)}
              </button>
              <button
                onClick={() => setAday(null)}
                className="rounded-xl border border-white/15 px-3 py-2.5 text-sm font-bold text-white/70"
              >
                {t('cancel', lang)}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 mt-2">
            <input
              value={girilenKod}
              onChange={(e) => setGirilenKod(e.target.value)}
              placeholder="XXXX-XXXX-XXXX"
              spellCheck={false}
              autoCapitalize="characters"
              lang="en"
              className="flex-1 min-w-0 rounded-xl bg-slate-950/60 border border-white/15 px-3 py-2.5 font-mono text-sm text-white placeholder:text-white/25"
            />
            <button
              onClick={ara}
              disabled={mesgul || girilenKod.trim().length < 8}
              className="rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              {t('restoreFind', lang)}
            </button>
          </div>
        )}
      </div>

      {hata && <p className="mt-3 text-[12px] font-bold text-rose-300">{hata}</p>}
    </section>
  );
}
