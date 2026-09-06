import { useEffect, useMemo, useState } from 'react';
import WordWheel from './components/WordWheel';
import CoinBadge from './components/CoinBadge';
import LevelCompleteModal from './components/LevelCompleteModal';
import BackgroundOrbs from './components/BackgroundOrbs';
import Leaderboard from './components/Leaderboard';
import OnboardingOverlay from './components/OnboardingOverlay';
import DailyRewardModal from './components/DailyRewardModal';
import ChestModal from './components/ChestModal';
import InfoTooltip from './components/InfoTooltip';
import PackMap from './components/PackMap';
import ReviewSession from './components/ReviewSession';
import StreakCelebration from './components/StreakCelebration';
import BackupPanel from './components/BackupPanel';
import { submitScore } from './lib/leaderboard';
import { yedekle, yedeklemeAcikMi } from './lib/cloudSave.ts';
import { playTap, playCorrect, playWrong, playCelebrate, playCoin, isMuted, toggleMuted } from './lib/sound';
import { haptics } from './lib/haptics';
import {
  wordForLevel,
  TOTAL_WORDS,
  difficultyOf,
  packForLevel,
  completesPack,
  type Difficulty,
} from './lib/levels';
import { scrambleWord } from './lib/scramble';
import {
  loadState,
  saveState,
  completeLevel,
  setLang,
  buyTheme,
  selectTheme,
  toggleTranslationHint,
  canClaimDaily,
  previewDailyReward,
  claimDailyReward,
  skipLevel,
  buyPowerup,
  breakStreakIfNeeded,
  tekrarCevapla,
  streakMultiplier,
  buyChest,
  openChest,
  CHEST_WIN_TARGET,
  CHEST_PRICE,
  POWERUP_PRICES,
  type GameState,
  type PowerupKind,
  type ChestReward,
  type VocabEntry,
} from './lib/storage';
import { celebrateWin } from './lib/celebrate';
import { THEMES, themeById, themeName } from './lib/themes';
import { rankForLevel, nextRank, type Rank } from './lib/ranks';
import { ACHIEVEMENTS, isUnlocked } from './lib/achievements';
import { t } from './lib/i18n';
import { dagarcikOzeti, tekrarOturumu, ustalasti, USTA_KUTU } from './lib/srs';
import {
  seriKutlamasi,
  seriAktif,
  SERI_ESIGI,
  MAX_WRONG_ATTEMPTS,
  type SeriKutlamasi,
} from './lib/streak';
import type { WordEntry, WordPack } from './lib/wordPacks';

const DIFFICULTY_STYLE: Record<Difficulty, string> = {
  easy: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/40',
  medium: 'bg-amber-400/15 text-amber-300 border-amber-400/40',
  hard: 'bg-rose-400/15 text-rose-300 border-rose-400/40',
};

const ONBOARDING_KEY = 'worddash_onboarded';
function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {
    return true; // localStorage yoksa her seferinde göstermektense hiç gösterme
  }
}

export default function App() {
  const [state, setState] = useState<GameState>(() => loadState());
  const [view, setView] = useState<'game' | 'packs' | 'vocab' | 'shop' | 'leaderboard' | 'review'>('game');
  // Tekrar oturumunun kelimeleri BAŞLARKEN dondurulur: oturum sırasında
  // state.vocabulary her cevapta değişiyor; kuyruk canlı türetilseydi
  // cevaplanan kelime listeden düşer ve kuyruk oturum ortasında kayardı.
  const [reviewQueue, setReviewQueue] = useState<VocabEntry[]>([]);
  const word = useMemo(() => wordForLevel(state.level), [state.level]);
  // Harfler dogrudan kelimeden turetiliyor -- ayri bir state+effect cifti
  // yerine memo yeterli, cunku "yeniden karistir" gibi bagimsiz bir eylem yok.
  const letters = useMemo(() => scrambleWord(word.word).split(''), [word.word]);
  const [revealedHint, setRevealedHint] = useState(0);
  // Mevcut kelimede kac yanlis tahmin yapildi -- kalici state degil, her
  // yeni kelimede (dogru cevap veya atlama) 0'a donuyor.
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [feedback, setFeedback] = useState<'idle' | 'wrong'>('idle');
  const [solvedWord, setSolvedWord] = useState<WordEntry | null>(null);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [wasNewBest, setWasNewBest] = useState(false);
  const [starsEarned, setStarsEarned] = useState<1 | 2 | 3>(3);
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());
  const [muted, setMuted] = useState(() => isMuted());
  // Onboarding hiç gösterilmeyecekse (döngüsel kullanıcı) doğrudan başlangıç
  // koşuluna göre kur; gösterilecekse dismissOnboarding() kapanış ANINDA
  // kontrol edip açıyor -- bir effect yerine "değişikliğe sebep olan olay"
  // içinden güncellemek, gereksiz render zincirini önlüyor.
  const [showDaily, setShowDaily] = useState(() => hasSeenOnboarding() && canClaimDaily(state));
  const [rankUp, setRankUp] = useState<Rank | null>(null);
  // Bu kelime bir paketi bitirdiyse hangi paket -- LevelCompleteModal'daki
  // kutlama şeridi için, bir sonraki kelimede temizleniyor.
  const [packDone, setPackDone] = useState<WordPack | null>(null);
  // Seviye penceresi kapandıktan SONRA gösterilecek seri kutlaması.
  // Bekletiliyor çünkü iki kutlamayı üst üste bindirmek ikisini de yutar.
  const [streakParty, setStreakParty] = useState<SeriKutlamasi | null>(null);
  // Bu seri turunda rekor kutlaması gösterildi mi. Kalıcı DEĞİL: bir seri
  // turu tek oturum içinde yaşayan bir şey, sayfayı yenileyip aynı turu
  // sürdürmek diye bir durum yok (yenileyince seri zaten devam eder ama
  // en fazla bir kutlama tekrarı olur -- zararsız).
  const [rekorKutlandi, setRekorKutlandi] = useState(false);
  const [showChest, setShowChest] = useState(false);

  const lang = state.lang;
  const theme = themeById(state.activeTheme);
  const justLooped = state.level > 0 && state.level % TOTAL_WORDS === 0;
  const difficulty = difficultyOf(word.word);
  const here = packForLevel(state.level);
  const ozet = useMemo(() => dagarcikOzeti(state.vocabulary), [state.vocabulary]);
  const rank = rankForLevel(state.level);
  const upcomingRank = nextRank(state.level);
  const rankProgress = upcomingRank
    ? (state.level - rank.minLevel) / (upcomingRank.minLevel - rank.minLevel)
    : 1;
  const dailyPreview = previewDailyReward(state);
  const multiplier = streakMultiplier(state.currentStreak);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  /*
    Yedeği otomatik gönder.

    Her değişiklikte değil, son değişiklikten GECIKMELI: bir seviyeyi
    bitirmek state'i arka arkaya birkaç kez güncelliyor (jeton, seri,
    dağarcık, sandık) ve her biri için ayrı istek atmak hem gereksiz hem
    de hız sınırına takılmanın yolu. Oyuncu duraklayınca tek istek gider.

    Sessiz başarısızlık BİLEREK: internet yoksa oyun oynanmaya devam
    etmeli, yerel kayıt zaten yazıldı. Bir sonraki değişiklikte yeniden
    denenecek.
  */
  useEffect(() => {
    if (!yedeklemeAcikMi()) return;
    const id = setTimeout(() => {
      yedekle(state).catch(() => {});
    }, 4000);
    return () => clearTimeout(id);
  }, [state]);

  /** Kurtarılan kaydı uygula: hem ekrana hem diske. */
  function handleRestore(next: GameState) {
    setState(next);
    saveState(next);
    setView('game');
  }

  function handleClaimDaily() {
    const { state: next } = claimDailyReward(state);
    setState(next);
    setShowDaily(false);
    playCoin();
    haptics.correct();
  }

  function handleSubmit(selectedIdx: number[]) {
    if (solvedWord) return; // modal açıkken tekerlek zaten disabled ama çift tetikleme koruması
    const guess = selectedIdx.map((i) => letters[i]).join('').toLowerCase();
    if (guess === word.word.toLowerCase()) {
      const usedHint = revealedHint > 0;
      const shieldConsumed = usedHint && state.streakShields > 0;
      const prevBest = state.bestStreak;
      const prevRank = rank;
      const finishedPack = completesPack(state.level);
      const next = completeLevel(state, word, usedHint, shieldConsumed, finishedPack !== null);
      const newRank = rankForLevel(next.level);
      setCoinsEarned(next.coins - state.coins);
      setWasNewBest(next.bestStreak > prevBest);
      setStarsEarned(revealedHint === 0 ? 3 : revealedHint === 1 ? 2 : 1);
      setRankUp(newRank.id !== prevRank.id ? newRank : null);
      setPackDone(finishedPack);
      const kutlama = seriKutlamasi(next.currentStreak, prevBest, rekorKutlandi);
      setStreakParty(kutlama);
      // Sözleşme streak.ts'te: rekorMu true olan HER kutlama rekoru
      // bildirmiş sayılır, yalnızca tur === 'rekor' olan değil.
      if (kutlama?.rekorMu) setRekorKutlandi(true);
      setSolvedWord(word);
      setState(next);
      setRevealedHint(0); // sıradaki seviye için sıfırla
      setWrongAttempts(0);
      celebrateWin();
      (next.bestStreak > prevBest ? playCelebrate : playCorrect)();
      haptics.correct();
      submitScore(next).catch((err) => console.warn('Skor gönderilemedi:', err));
    } else {
      const attempts = wrongAttempts + 1;
      setWrongAttempts(attempts);
      // Ayni kelimede 2. yanlistan sonra seri kirilir -- kalkanin varsa
      // onun yerine kalkan tuketilir (bkz. breakStreakIfNeeded).
      if (attempts >= MAX_WRONG_ATTEMPTS) {
        const next = breakStreakIfNeeded(state);
        setState(next);
        // Seri gerçekten kırıldıysa (kalkan yemediyse) yeni tur başlıyor:
        // rekor bayrağı sıfırlanmalı, yoksa oyuncu bir daha ASLA rekor
        // kutlaması görmez.
        if (next.currentStreak === 0) setRekorKutlandi(false);
      }
      setFeedback('wrong');
      setTimeout(() => setFeedback('idle'), 400);
      playWrong();
      haptics.wrong();
    }
  }

  function dismissOnboarding() {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      // localStorage kapalıysa her açılışta tekrar görünür -- can sıkıcı ama zararsız.
    }
    if (canClaimDaily(state)) setShowDaily(true);
  }

  function baslatTekrar() {
    const kuyruk = tekrarOturumu(state.vocabulary);
    if (kuyruk.length === 0) return;
    setReviewQueue(kuyruk);
    setView('review');
    playTap();
  }

  function tekrarCevabi(word: string, dogru: boolean) {
    setState(tekrarCevapla(state, word, dogru));
  }

  function handleToggleMute() {
    setMuted(toggleMuted());
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

  function handleSkip() {
    if (solvedWord || state.skipTokens <= 0) return;
    setState(skipLevel(state));
    setRevealedHint(0);
    setWrongAttempts(0);
    setFeedback('idle');
    playTap();
    haptics.tap();
  }

  function handleBuyPowerup(kind: PowerupKind) {
    if (state.coins < POWERUP_PRICES[kind]) return;
    setState(buyPowerup(state, kind));
    playCoin();
    haptics.tap();
  }

  /** Sandık zaten hazırsa direkt açılış modalını gösterir; değilse ve
   *  yeterli jeton varsa önce jetonla bir tane satın alıp aynı modalı açar. */
  function handleChestTap() {
    if (state.chestsReady > 0) {
      setShowChest(true);
      return;
    }
    if (state.coins >= CHEST_PRICE) {
      setState(buyChest(state));
      setShowChest(true);
    }
  }

  /** ChestModal'a geçilen `onOpen` -- gerçek state mutasyonu ve ses/titreşim
   *  burada, modal sadece "aç" anını gösterip dönen ödülü render ediyor. */
  function handleOpenChest(): ChestReward {
    const { state: next, reward } = openChest(state);
    setState(next);
    celebrateWin();
    playCelebrate();
    haptics.correct();
    return reward;
  }

  return (
    <div className={`min-h-screen ${theme.bgClass} text-white flex flex-col items-center px-4 pt-6 pb-28 transition-colors duration-500 relative overflow-hidden`}>
      {/* İnce noktalı doku: renkli bulanık toplar (BackgroundOrbs) tek başına
          düz gradyanın üstünde biraz "boş" duruyordu -- bu katman derinlik
          hissi ekliyor, tamamen dekoratif ve etkileşime kapalı. */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      {/* Temanin gercek renkleriyle (wheelFrom/wheelTo) cizilen, yavasca
          surunen iki isik lekesi -- tema degisince rengi de degisiyor,
          BackgroundOrbs'un sabit mor/pembe tonlarindan farkli olarak
          o an secili temayla gorsel olarak butunlesiyor. */}
      <div
        className="fixed inset-0 -z-10 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 25% 15%, ${theme.wheelFrom}, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 85%, ${theme.wheelTo}, transparent 60%)`,
          animation: 'themeDrift 9s ease-in-out infinite',
        }}
      />
      <BackgroundOrbs />
      {/* Header sadeleştirildi: eskiden marka + slogan + rütbe rozeti SOLDA,
          jeton + seri + ses + dil SAĞDA -- tek satırda 8 farklı öge
          yarışıyordu. Araştırma (Wordscapes/Candy Crush/Duolingo HUD'ları)
          hep aynı şeyi söylüyor: HUD'da o an gerekmeyen hiçbir şey durmasın.
          Slogan kaldırıldı (görev bir kere öğretiliyor, sonra gereksiz),
          rütbe kendi şeridine taşındı (bkz. hemen altı) -- header artık
          sadece marka + canlı sayaçlar. */}
      <header className="w-full max-w-md flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          {/* Marka rozeti: sabit koyu kare + tema rengiyle degisen ic parlaklik --
              baslik hep ayni "W" ile eslesen, temadan bagimsiz sabit bir logo
              gibi duruyor; sadece kenar parlamasi temayla degisiyor. */}
          <div
            className="w-9 h-9 rounded-xl bg-slate-950/40 border border-white/15 flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
            style={{ boxShadow: `0 0 16px ${theme.wheelFrom}55, inset 0 1px 0 rgba(255,255,255,0.2)` }}
          >
            <span className={`font-display text-base font-extrabold ${theme.titleClass}`}>W</span>
          </div>
          <h1 className={`font-display text-xl font-extrabold tracking-tight ${theme.titleClass}`}>{t('title', lang)}</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <CoinBadge icon="🪙" value={state.coins} label={t('coins', lang)} />
          <CoinBadge
            icon="🔥"
            value={state.currentStreak}
            dim={!seriAktif(state.currentStreak)}
            label={t('streak', lang)}
            hot={seriAktif(state.currentStreak)}
            suffix={multiplier > 1 ? `×${multiplier}` : undefined}
            suffixTitle={t('streakMultiplierInfo', lang)}
          />
          {/* Ses + dil artık tek, daha sessiz bir küme -- her saniye bakılan
              jeton/seri sayaçlarıyla aynı görsel ağırlıkta durmamalı. */}
          <div className="flex items-center gap-1 opacity-70">
            <button
              onClick={handleToggleMute}
              title={muted ? t('soundOff', lang) : t('soundOn', lang)}
              aria-label={muted ? t('soundOff', lang) : t('soundOn', lang)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center text-xs shrink-0"
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={() => changeLang(lang === 'tr' ? 'en' : 'tr')}
              title={lang === 'tr' ? 'English' : 'Türkçe'}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center text-[10px] font-bold shrink-0"
            >
              {lang === 'tr' ? 'EN' : 'TR'}
            </button>
          </div>
        </div>
      </header>

      {/* Rütbe şeridi: ikon + isim + ince ilerleme çubuğu + sıradaki rütbe,
          tek satırda -- eskiden header'daki bir rozet + oyun sekmesinde
          ayrı bir tam-genişlik blok olarak İKİ yerde tekrarlanıyordu. Tüm
          sekmelerde (sadece oyunda değil) görünüyor: rütbe hesap-geneli bir
          durum, coin/seri gibi her an bilinmesi gereken bir şey. */}
      <div className="w-full max-w-md flex items-center gap-2 mb-4">
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${rank.gradientClass} text-slate-900 text-[10px] font-display font-extrabold px-2 py-0.5 shrink-0`}
        >
          {rank.icon} {t(rank.nameKey, lang)}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${rank.gradientClass} transition-all duration-500`}
            style={{ width: `${Math.round(rankProgress * 100)}%` }}
          />
        </div>
        {upcomingRank && (
          <span className="text-[10px] text-white/40 shrink-0">
            {upcomingRank.icon} {t('level', lang)} {upcomingRank.minLevel + 1}
          </span>
        )}
      </div>

      {/* Alt sekme çubuğu: eskiden başlığın hemen altında, sabit akışta duruyordu --
          bir mobil oyunda parmağın en rahat ulaştığı yer alttır. fixed + cam
          efekti (backdrop-blur) native bir app hissi veriyor; dış div tıklama
          alanını yakalamasın diye pointer-events-none, iç kutu tekrar açıyor. */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="w-full max-w-md flex gap-1 bg-slate-950/70 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl pointer-events-auto">
          <button
            onClick={() => setView('game')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 ${
              view === 'game' ? `${theme.navActiveClass} scale-105 shadow-md` : 'text-white/50 hover:text-white/70'
            }`}
          >
            <span className="text-lg leading-none">🎮</span>
            <span className="font-display truncate max-w-full">{state.level + 1}</span>
          </button>
          <button
            onClick={() => setView('packs')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 ${
              view === 'packs' ? `${theme.navActiveClass} scale-105 shadow-md` : 'text-white/50 hover:text-white/70'
            }`}
          >
            <span className="text-lg leading-none">🗺️</span>
            <span className="truncate max-w-full">{t('packs', lang)}</span>
          </button>
          <button
            onClick={() => setView('leaderboard')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 ${
              view === 'leaderboard' ? `${theme.navActiveClass} scale-105 shadow-md` : 'text-white/50 hover:text-white/70'
            }`}
          >
            <span className="text-lg leading-none">🏆</span>
            <span className="truncate max-w-full">{t('leaderboard', lang)}</span>
          </button>
          <button
            onClick={() => setView('vocab')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 ${
              view === 'vocab' ? `${theme.navActiveClass} scale-105 shadow-md` : 'text-white/50 hover:text-white/70'
            }`}
          >
            <span className="text-lg leading-none relative">
              📖
              {/* Tekrar bekleyen varsa kırmızı nokta -- oyuncuyu bu sekmeye
                  çağıran şey sekmenin adı değil, bu rozet. */}
              {ozet.bekleyen > 0 && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-rose-400 ring-2 ring-slate-950" />
              )}
            </span>
            <span className="truncate max-w-full">{ozet.toplam}</span>
          </button>
          <button
            onClick={() => setView('shop')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-all duration-200 ${
              view === 'shop' ? `${theme.navActiveClass} scale-105 shadow-md` : 'text-white/50 hover:text-white/70'
            }`}
          >
            <span className="text-lg leading-none">🎨</span>
            <span className="truncate max-w-full">{t('shop', lang)}</span>
          </button>
        </div>
      </nav>

      {view === 'game' && (
        <main className="w-full max-w-md flex-1 flex flex-col items-center animate-[viewFade_0.25s_ease-out]">
          {justLooped && (
            <p className="text-[11px] text-amber-300/90 bg-amber-400/10 border border-amber-400/30 rounded-full px-3 py-1 mb-4 text-center">
              🔁 {t('outOfWords', lang)}
            </p>
          )}

          {/* Paket şeridi: oyuncu her an HANGİ konuda olduğunu ve o konunun
              neresinde olduğunu görüyor. Tek başına duran "Seviye 247" sayısı
              bir hedef sunmuyordu; "Teknoloji 14/69" hem yer bildiriyor hem
              bitirilecek somut bir şey gösteriyor. Dokununca haritayı açar. */}
          <button
            onClick={() => { setView('packs'); playTap(); }}
            className="w-full mb-3 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2.5 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <span className="text-xl leading-none">{here.pack.icon}</span>
            <span className="flex-1 min-w-0 text-left">
              <span className="block font-display text-[13px] font-bold truncate">
                {lang === 'en' ? here.pack.nameEn : here.pack.name}
              </span>
              <span className="mt-1 block h-1 rounded-full bg-white/10 overflow-hidden">
                <span
                  className="block h-full rounded-full bg-white/70 transition-[width] duration-500"
                  style={{ width: `${(here.indexInPack / here.packSize) * 100}%` }}
                />
              </span>
            </span>
            <span className="text-[11px] font-bold tabular-nums text-white/70 shrink-0">
              {here.indexInPack}/{here.packSize}
            </span>
          </button>

          {/* Güçlendirmeleri Mağaza'ya gitmeden, ana ekrandan tek dokunuşla
              satın alabilme -- kullanıcı ihtiyacı anında (elindeki bitince)
              gördüğü yerden alsın diye. Aynı handleBuyPowerup'ı Mağaza'daki
              tam kartlar da kullanıyor, mantık tek yerde. Bilerek İNCE ve
              az-vurgulu (kalın kutu/kenarlık yok) -- bulmaca kartı burada
              görsel odak olmalı, bu şerit onun gölgesinde bir kısayol.
              Info baloncuğu AYRI bir <button>: satın alma butonunun İÇİNE
              gömülü olsaydı tarayıcı iç içe <button> render edemezdi. */}
          <div className="w-full flex items-center gap-3 mb-3 px-1">
            {(
              [
                { kind: 'shield' as PowerupKind, icon: '🛡️', count: state.streakShields, info: t('streakShieldInfo', lang) },
                { kind: 'skip' as PowerupKind, icon: '🎟️', count: state.skipTokens, info: t('skipJokerInfo', lang) },
              ]
            ).map((p) => {
              const price = POWERUP_PRICES[p.kind];
              const affordable = state.coins >= price;
              return (
                <div key={p.kind} className="relative flex items-center">
                  <button
                    onClick={() => handleBuyPowerup(p.kind)}
                    disabled={!affordable}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors active:scale-95 ${
                      affordable ? 'bg-white/8 hover:bg-white/12 text-white/80' : 'bg-white/5 text-white/45'
                    }`}
                  >
                    <span className="text-sm">{p.icon}</span>
                    {p.count > 0 && <span className="text-emerald-300">×{p.count}</span>}
                    <span className="opacity-60">🪙{price}</span>
                  </button>
                  <div className="absolute -top-1 -right-1">
                    <InfoTooltip text={p.info} />
                  </div>
                </div>
              );
            })}

            <div className="flex-1" />

            {/* Sandık: ücretsiz ilerlemesi (5 doğru cevapta 1) veya jetonla
                anında satın alma -- iki farklı durumu TEK butonda gösteriyor.
                Diğer ikisinden ayrı durması için hazır olunca amber vurgusu
                korunuyor -- bu tek istisna kasıtlı, "burada büyük bir şey var". */}
            <div className="relative flex items-center">
              <button
                onClick={handleChestTap}
                title={
                  state.chestsReady > 0
                    ? t('chestReady', lang)
                    : `${state.chestProgress}/${CHEST_WIN_TARGET} ${t('chestProgress', lang)}`
                }
                disabled={state.chestsReady === 0 && state.coins < CHEST_PRICE}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-colors active:scale-95 ${
                  state.chestsReady > 0
                    ? 'bg-amber-400/20 text-amber-200 animate-pulse'
                    : state.coins >= CHEST_PRICE
                    ? 'bg-white/8 hover:bg-white/12 text-white/80'
                    : 'bg-white/5 text-white/45'
                }`}
              >
                <span className="text-sm">{state.chestsReady > 0 ? '🎁' : '📦'}</span>
                {state.chestsReady > 0 ? (
                  <span className="truncate">{t('chestOpenNow', lang)}</span>
                ) : (
                  <span className="opacity-60 truncate">
                    {state.chestProgress}/{CHEST_WIN_TARGET}
                  </span>
                )}
              </button>
              <div className="absolute -top-1 -right-1">
                <InfoTooltip text={t('chestInfo', lang)} />
              </div>
            </div>
          </div>

          {/* Bulmaca karti: zorluk/can/ipucu, ceviri, harf kutulari ve tekerlek
              artik tek bir cam panelde -- eskiden hepsi ust uste bagimsiz
              satirlar halinde durup ekrani "listelenmis oge yigini" gibi
              gostreriyordu, tek kart bunlarin AYNI bulmacanin parcasi
              oldugunu gorsel olarak da soyluyor. */}
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 pt-5 flex flex-col items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] mb-4">
            <div className="w-full flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${DIFFICULTY_STYLE[difficulty]}`}>
                  {t(difficulty, lang)} · {word.word.length} {lang === 'tr' ? 'harf' : 'letters'}
                </span>
                {/* Canlar: bu kelimede kac yanlis hakkin kaldigini gosteriyor.
                    Artik TEK hak var (bkz. streak.ts MAX_WRONG_ATTEMPTS) --
                    ilk yanlista seri kirilir, kalkanin yoksa. Hakkin bittigi
                    an kalbin sonmesi, seriyi kaybettigini soyleyen tek
                    isaret; o yuzden burada duruyor. */}
                <span className="flex gap-0.5 text-sm" title={t('livesLabel', lang)}>
                  {Array.from({ length: MAX_WRONG_ATTEMPTS }, (_, i) => (
                    <span key={i}>{i < MAX_WRONG_ATTEMPTS - wrongAttempts ? '❤️' : '🤍'}</span>
                  ))}
                </span>
              </div>
              {/* Eskiden "🇹🇷 Türkçe ipucu: Açık/Kapalı" gibi uzun bir metin
                  taşıyordu -- bu geçiş tanıtımda zaten öğretiliyor, günlük
                  kullanımda sadece ikon + açık/kapalı durumu yeterli
                  (araştırma: sık kullanılan geçişlerde metin yerine ikon).
                  Bayrak emojisi (🇹🇷) YERİNE 🌐 kullanıyoruz -- ekran
                  görüntüsüyle doğrulandı: Windows/bazı Android'lerde bayrak
                  emojileri render edilmiyor, düz "TR" harflerine düşüyor ve
                  bu da header'daki gerçek dil değiştirme düğmesiyle
                  (o da bazen "TR" yazar) karıştırılıyordu. */}
              <button
                onClick={() => setState(toggleTranslationHint(state))}
                title={state.showTranslationHint ? t('hintToggleOn', lang) : t('hintToggleOff', lang)}
                aria-label={state.showTranslationHint ? t('hintToggleOn', lang) : t('hintToggleOff', lang)}
                className={`w-8 h-8 rounded-full border flex items-center justify-center text-base transition-all ${
                  state.showTranslationHint
                    ? 'bg-white/15 border-white/30'
                    : 'bg-white/5 border-white/15 opacity-50 grayscale'
                }`}
              >
                🌐
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

            {/* Seri durumu: esigin altinda hedefi, ustunde yandigini soyler.
                Ust bardaki rozet yalnizca bir sayi; "seri olmasi icin ne
                lazim" bilgisi hicbir yerde yazmiyordu. */}
            {seriAktif(state.currentStreak) ? (
              <p className="text-[11px] font-bold text-amber-300/90 mb-2">
                🔥 {state.currentStreak} {t('streak', lang)}
                {multiplier > 1 && <span className="text-emerald-300"> · ×{multiplier}</span>}
              </p>
            ) : (
              <p className="text-[11px] text-white/45 mb-2">
                {t('streakBuilding', lang).replace('{n}', String(SERI_ESIGI - state.currentStreak))}
              </p>
            )}

            {/* Cevap şeridi: harf sayısı kadar kutu, ipucu açılanlar dolu */}
            <div className={`flex gap-1.5 mb-6 flex-wrap justify-center ${feedback === 'wrong' ? 'animate-[shake_0.4s]' : ''}`}>
              {word.word.split('').map((ch, i) => {
                const isHint = i < revealedHint;
                return (
                  <div
                    key={i}
                    lang="en"
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

            <div className="relative mb-1">
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
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={revealHint}
              disabled={revealedHint >= word.word.length - 1}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-sm font-semibold disabled:opacity-30"
            >
              💡 {t('hint', lang)}
              {state.streakShields > 0 && (
                <span className="ml-1.5 text-[10px] text-emerald-300" title={t('shieldReady', lang)}>
                  🛡️{state.streakShields}
                </span>
              )}
            </button>
            {state.skipTokens > 0 && (
              <button
                onClick={handleSkip}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-sm font-semibold flex items-center gap-1"
              >
                🎟️ {state.skipTokens}
              </button>
            )}
          </div>
        </main>
      )}

      {view === 'vocab' && (
        <main className="w-full max-w-md flex-1 animate-[viewFade_0.25s_ease-out]">
          <p className="font-display text-xs font-extrabold uppercase tracking-wide text-white/50 mb-2">
            🏅 {t('achTitle', lang)}
          </p>
          <div className="flex gap-2.5 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = isUnlocked(a, state);
              return (
                <div key={a.id} className="flex flex-col items-center gap-1 shrink-0 w-14">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border ${
                      unlocked
                        ? `bg-gradient-to-br ${rank.gradientClass} border-white/40 shadow-md`
                        : 'bg-white/5 border-white/10 grayscale opacity-40'
                    }`}
                  >
                    {a.icon}
                  </div>
                  <p className="text-[9px] text-white/60 text-center leading-tight">{t(a.titleKey, lang)}</p>
                </div>
              );
            })}
          </div>

          {/* Tekrar kartı listenin ÜSTÜNDE: bu sekmenin işi artık "ne
              çözdüm" değil, "bugün ne tekrar etmeliyim". */}
          {ozet.toplam > 0 && (
            <div
              className={`rounded-2xl border p-4 mb-4 ${
                ozet.bekleyen > 0 ? 'border-white/25 bg-white/12' : 'border-white/10 bg-white/5'
              }`}
            >
              {ozet.bekleyen > 0 ? (
                <>
                  <p className="font-display text-[15px] font-extrabold">
                    🔁 {ozet.bekleyen} {t('reviewReady', lang)}
                  </p>
                  <p className="text-[11px] text-white/55 mt-1 leading-relaxed">{t('reviewWhy', lang)}</p>
                  <button
                    onClick={baslatTekrar}
                    className={`font-display mt-3 w-full rounded-xl py-2.5 text-[14px] font-extrabold ${theme.navActiveClass} active:scale-95 transition-transform`}
                  >
                    {t('reviewStart', lang)} →
                  </button>
                </>
              ) : (
                <>
                  <p className="font-display text-[14px] font-bold text-white/80">
                    ✅ {t('reviewNone', lang)}
                  </p>
                  <p className="text-[11px] text-white/50 mt-1">{t('reviewNoneHint', lang)}</p>
                </>
              )}
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4 text-[11px] text-white/60">
                <span>
                  <strong className="text-white/90 font-bold">{ozet.toplam}</strong> {t('wordsCount', lang)}
                </span>
                <span>
                  <strong className="text-emerald-300 font-bold">{ozet.usta}</strong> {t('mastered', lang)}
                </span>
              </div>
            </div>
          )}

          {ozet.toplam === 0 ? (
            <p className="text-center text-white/50 text-sm mt-12">{t('emptyVocabulary', lang)}</p>
          ) : (
            <ul className="space-y-2">
              {[...ozet.hepsi].reverse().map((v) => {
                const usta = ustalasti(v);
                return (
                  <li
                    key={v.word}
                    className="flex items-center justify-between gap-3 bg-white/8 border border-white/10 rounded-xl px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  >
                    <div className="min-w-0">
                      <p lang="en" className="font-bold uppercase text-amber-300 truncate">{v.word}</p>
                      <p className="text-xs text-white/60 truncate">{v.tr}</p>
                    </div>
                    {usta ? (
                      <span className="shrink-0 text-[10px] font-bold rounded-full bg-emerald-400/20 text-emerald-300 px-2 py-1">
                        ✓ {t('masteredBadge', lang)}
                      </span>
                    ) : (
                      /* Kutu göstergesi: kaç tekrardan geçtiğini gösteriyor.
                         Ham bir "kutu 3" sayısı yerine dolan noktalar
                         ilerlemeyi tek bakışta okutuyor. */
                      <span className="shrink-0 flex items-center gap-1" title={t('vocabLearning', lang)}>
                        {Array.from({ length: USTA_KUTU }, (_, k) => (
                          <span
                            key={k}
                            className={`w-1.5 h-1.5 rounded-full ${
                              k < (v.box ?? 1) ? 'bg-white/75' : 'bg-white/20'
                            }`}
                          />
                        ))}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      )}

      {view === 'shop' && (
        <main className="w-full max-w-md flex-1 animate-[viewFade_0.25s_ease-out]">
          <p className="font-display text-xs font-extrabold uppercase tracking-wide text-white/50 mb-2">
            ⚡ {t('powerupsTitle', lang)}
          </p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {(
              [
                { kind: 'shield' as PowerupKind, icon: '🛡️', name: t('streakShieldName', lang), desc: t('streakShieldDesc', lang), count: state.streakShields },
                { kind: 'skip' as PowerupKind, icon: '🎟️', name: t('skipJokerName', lang), desc: t('skipJokerDesc', lang), count: state.skipTokens },
              ]
            ).map((p) => {
              const price = POWERUP_PRICES[p.kind];
              const affordable = state.coins >= price;
              return (
                <div
                  key={p.kind}
                  className="rounded-2xl border border-white/10 bg-white/8 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl">{p.icon}</span>
                    {p.count > 0 && (
                      <span className="text-[10px] font-display font-extrabold bg-white/15 rounded-full px-2 py-0.5">
                        {t('owned', lang)} {p.count}
                      </span>
                    )}
                  </div>
                  <p className="font-display font-bold text-sm">{p.name}</p>
                  <p className="text-[10px] text-white/50 mb-2 leading-tight">{p.desc}</p>
                  <button
                    onClick={() => handleBuyPowerup(p.kind)}
                    disabled={!affordable}
                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      affordable ? 'bg-emerald-400 text-slate-900' : 'bg-white/10 text-white/45'
                    }`}
                  >
                    {affordable ? `${t('buy', lang)} · 🪙${price}` : t('notEnoughCoins', lang)}
                  </button>
                </div>
              );
            })}

            {/* Sandık burada da alınabiliyor -- Mağaza'yı gezen ama Oyun
                sekmesindeki kısayolu fark etmemiş biri için tam açıklamalı
                hali. col-span-2: diğer iki kart gibi dar değil, kendi
                satırında geniş duruyor -- sandık kavramının önemini
                görsel olarak da vurguluyor. */}
            <div className="col-span-2 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] flex items-center gap-3">
              <span className="text-3xl shrink-0">{state.chestsReady > 0 ? '🎁' : '📦'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm">
                  {state.chestsReady > 0 ? t('chestReady', lang) : `${t('chestProgress', lang)} ${state.chestProgress}/${CHEST_WIN_TARGET}`}
                </p>
                <p className="text-[10px] text-white/50 leading-tight">{t('chestInfo', lang)}</p>
              </div>
              <button
                onClick={handleChestTap}
                disabled={state.chestsReady === 0 && state.coins < CHEST_PRICE}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  state.chestsReady > 0
                    ? 'bg-amber-400 text-slate-900'
                    : state.coins >= CHEST_PRICE
                    ? 'bg-emerald-400 text-slate-900'
                    : 'bg-white/10 text-white/45'
                }`}
              >
                {state.chestsReady > 0 ? t('chestOpenNow', lang) : `${t('buy', lang)} · 🪙${CHEST_PRICE}`}
              </button>
            </div>
          </div>

          <p className="font-display text-xs font-extrabold uppercase tracking-wide text-white/50 mb-2">
            🎨 {t('themesTitle', lang)}
          </p>
          <div className="grid grid-cols-2 gap-3">
          {THEMES.map((th) => {
            const owned = state.unlockedThemes.includes(th.id);
            const active = state.activeTheme === th.id;
            const affordable = state.coins >= th.price;
            return (
              <div
                key={th.id}
                className={`relative rounded-2xl overflow-hidden border-2 transition-shadow ${
                  active ? 'border-white shadow-lg shadow-white/10' : 'border-white/10'
                }`}
              >
                {th.isNew && !owned && (
                  <span className="absolute top-2 right-2 z-10 text-[9px] font-display font-extrabold bg-rose-400 text-white px-1.5 py-0.5 rounded-full shadow">
                    {t('newBadge', lang)}
                  </span>
                )}
                <div className={`h-16 ${th.bgClass} relative flex items-center justify-center gap-1.5`}>
                  {/* Tema alınmadan önce, satın alacağı gerçek tekerlek renklerinin
                      küçük bir önizlemesi -- soyut bir renk şeridinden çok daha
                      "ne alıyorum" hissi veriyor. */}
                  {['A', 'B', 'C'].map((ch) => (
                    <span
                      key={ch}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-display font-extrabold ${th.tileSelectedClass}`}
                      style={{ boxShadow: '0 2px 0 rgba(0,0,0,0.25), 0 3px 8px rgba(0,0,0,0.3)' }}
                    >
                      {ch}
                    </span>
                  ))}
                  {!owned && (
                    <div className="absolute inset-0 bg-slate-950/50 flex items-center justify-center">
                      <span className="text-lg">🔒</span>
                    </div>
                  )}
                </div>
                <div className="bg-white/8 p-3">
                  <p className="font-display font-bold text-sm">{themeName(th, lang)}</p>
                  <p className="text-[11px] text-white/50 mb-2">
                    {th.price === 0 ? t('free', lang) : owned ? t('owned', lang) : `🪙 ${th.price}`}
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
                        : 'bg-white/10 text-white/45'
                    }`}
                  >
                    {active ? t('selected', lang) : owned ? t('select', lang) : !affordable ? t('notEnoughCoins', lang) : t('buy', lang)}
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </main>
      )}

      {view === 'packs' && <PackMap level={state.level} lang={lang} />}

      {view === 'review' && (
        <ReviewSession
          queue={reviewQueue}
          lang={lang}
          theme={theme}
          onAnswer={tekrarCevabi}
          onFinish={() => setView('vocab')}
        />
      )}

      {view === 'leaderboard' && (
        <main className="w-full max-w-md flex-1 flex flex-col items-center animate-[viewFade_0.25s_ease-out]">
          <Leaderboard state={state} lang={lang} navActiveClass={theme.navActiveClass} />
          {/* Yedekleme lider tablosundan BAGIMSIZ bir tercih, ama ayni
              sekmede: uygulamanin aga ciktigi her sey burada topluysa
              "katilmadigin surece hicbir sunucuya baglanmaz" cumlesi hem
              dogru hem anlasilir kaliyor. */}
          <BackupPanel state={state} lang={lang} onRestore={handleRestore} />
        </main>
      )}

      {showOnboarding && <OnboardingOverlay lang={lang} onDismiss={dismissOnboarding} />}

      {!showOnboarding && !solvedWord && showDaily && (
        <DailyRewardModal
          lang={lang}
          previewAmount={dailyPreview.amount}
          previewStreak={dailyPreview.streak}
          onClaim={handleClaimDaily}
        />
      )}

      {showChest && (
        <ChestModal lang={lang} onOpen={handleOpenChest} onClose={() => setShowChest(false)} />
      )}

      {solvedWord && (
        <LevelCompleteModal
          word={solvedWord}
          coinsEarned={coinsEarned}
          isNewBest={wasNewBest && !streakParty}
          stars={starsEarned}
          rankUp={rankUp}
          packDone={packDone}
          lang={lang}
          onContinue={() => {
            setSolvedWord(null);
            setRankUp(null);
          }}
        />
      )}

      {/* Seri kutlamasi seviye penceresinden SONRA: ust uste binen iki
          kutlama birbirini yutar, sirayla gelenler ikisi de gorulur. */}
      {!solvedWord && streakParty && (
        <StreakCelebration
          kutlama={streakParty}
          lang={lang}
          onClose={() => setStreakParty(null)}
        />
      )}
    </div>
  );
}
