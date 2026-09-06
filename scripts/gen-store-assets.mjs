/**
 * Play Console magaza gorsellerini uretir. `npm run store:assets`
 *
 * Play Console'un kabul ettigi olculer sabit ve kucuk sapmalarda yukleme
 * REDDEDILIYOR, o yuzden elle kirpmak yerine dogru olculerde uretiyoruz:
 *   - telefon ekran goruntusu: 1080x1920 (9:16), en az 2 tane zorunlu
 *   - one cikan gorsel (feature graphic): TAM 1024x500, alfa kanali OLMADAN
 *   - uygulama ikonu: 512x512 (zaten public/icons/icon-512.png'de var)
 *
 * Ekran goruntuleri GERCEK uygulamadan aliniyor -- elle cizilmis sahte
 * ekranlar hem magaza politikasina aykiri hem de kullaniciyi yaniltir.
 * Her kare icin localStorage'a farkli bir oyun durumu yaziliyor ki magaza
 * kartinda oyunun gercekten ne sundugu gorunsun (dolu bir tekerlek, ilerlemis
 * bir paket haritasi, acilmis temalar), bos bir baslangic ekrani degil.
 *
 * Onkosul: `npm run build` calistirilmis ve `npm run preview` ayakta olmali.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.WD_URL ?? 'http://localhost:4400';
const OUT = 'store';
mkdirSync(`${OUT}/screenshots`, { recursive: true });

/** Magaza karesinde bos/yeni bir hesap degil, OYNANMIS bir oyun gorunmeli. */
const DEMO_STATE = {
  level: 268,
  coins: 415,
  bestStreak: 24,
  currentStreak: 9,
  vocabulary: [
    { word: 'giraffe', tr: 'zürafa', learnedAt: Date.now() - 6e5 },
    { word: 'volcano', tr: 'yanardağ', learnedAt: Date.now() - 12e5 },
    { word: 'bracelet', tr: 'bilezik', learnedAt: Date.now() - 18e5 },
    { word: 'kitchen', tr: 'mutfak', learnedAt: Date.now() - 24e5 },
    { word: 'thunder', tr: 'gök gürültüsü', learnedAt: Date.now() - 30e5 },
    { word: 'butterfly', tr: 'kelebek', learnedAt: Date.now() - 36e5 },
    { word: 'passport', tr: 'pasaport', learnedAt: Date.now() - 42e5 },
  ],
  lang: 'tr',
  showTranslationHint: true,
  unlockedThemes: ['aurora', 'ocean', 'sunset', 'candy'],
  activeTheme: 'aurora',
  totalCoinsEarned: 1240,
  dailyStreak: 5,
  lastClaimDate: new Date().toISOString().slice(0, 10),
  streakShields: 2,
  skipTokens: 3,
  chestProgress: 3,
  chestsReady: 1,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  // 1080x1920'yi 3x olcekle uretiyoruz: 360x640 CSS pikseli, deviceScaleFactor 3.
  // Dogrudan 1080 genislikte acmak masaustu duzenini tetiklerdi.
  viewport: { width: 360, height: 640 },
  deviceScaleFactor: 3,
  locale: 'tr-TR',
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
await page.addInitScript((s) => {
  localStorage.setItem('worddash_onboarded', '1');
  localStorage.setItem('worddash_nickname', 'ugur');
  localStorage.setItem('worddash_state_v2', JSON.stringify(s));
}, DEMO_STATE);

const shots = [
  { file: '1-oyun.png', tab: null },
  { file: '2-paketler.png', tab: 'Paketler' },
  { file: '3-kelimelerim.png', tab: null, nav: 'vocab' },
  { file: '4-magaza.png', tab: 'Mağaza' },
  { file: '5-rekabet.png', tab: 'Rekabet' },
];

await page.goto(BASE, { waitUntil: 'networkidle' });
for (const { file, tab, nav } of shots) {
  if (tab) await page.getByText(tab, { exact: true }).click();
  if (nav === 'vocab') await page.locator('nav button').nth(3).click();
  // Sekme degistirince onceki gorunumun kaydirma konumu korunuyor ve kare
  // ortadan basliyordu -- her karede basa donuyoruz. Paket haritasi kendi
  // kendini aktif pakete kaydirdigi icin O kare bilerek haric.
  if (tab !== 'Paketler') await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900); // gecis animasyonu + haritanin kendini kaydirmasi
  await page.screenshot({ path: `${OUT}/screenshots/${file}` });
  console.log(`  ${file}`);
}

/* ---------- One cikan gorsel (feature graphic): TAM 1024x500 ---------- */
const featureHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1024px;height:500px;overflow:hidden;
    font-family:'Baloo 2',system-ui,'Segoe UI',sans-serif;
    background:radial-gradient(125% 145% at 20% 10%,#4c1d95 0%,#1e1b4b 46%,#020617 100%);
    display:flex;align-items:center;gap:64px;padding:0 74px 0 64px;color:#fff;position:relative}
  /* Tekerlegi cagristiran halkalar -- oyunun ana mekanigi tek bakista okunsun */
  .ring{position:absolute;border-radius:50%;border:2px solid rgba(255,255,255,.06)}
  .r1{width:560px;height:560px;right:-150px;top:-70px}
  .r2{width:360px;height:360px;right:-48px;top:34px}
  .wheel{width:286px;height:286px;position:relative;flex-shrink:0}
  .tile{position:absolute;width:78px;height:78px;border-radius:50%;background:#fff;
    color:#1e1b4b;display:flex;align-items:center;justify-content:center;
    font-size:36px;font-weight:800;box-shadow:0 10px 26px rgba(0,0,0,.4)}
  .copy{position:relative;z-index:1;max-width:560px}
  h1{font-size:78px;font-weight:800;line-height:1;letter-spacing:-1.5px}
  h1 span{background:linear-gradient(92deg,#fbbf24,#f472b6 55%,#a78bfa);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent}
  /* text-wrap:balance -- satirlari esit uzunlukta boler, "kur," gibi tek
     kelimelik oksuz satir kalmaz (onceki surumde tam bu olmustu). */
  p{font-size:30px;margin-top:18px;color:#c7d2fe;line-height:1.32;font-weight:500;
    text-wrap:balance}
  .pills{display:flex;gap:11px;margin-top:26px}
  .pill{background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.22);
    border-radius:999px;padding:9px 19px;font-size:21px;font-weight:700;white-space:nowrap}
</style></head><body>
  <div class="ring r1"></div><div class="ring r2"></div>
  <div class="wheel" id="w"></div>
  <div class="copy">
    <h1>Word<span>Dash</span></h1>
    <p>İngilizce kelimeleri harf tekerleğinde oynayarak öğren.</p>
    <div class="pills">
      <div class="pill">1.293 kelime</div>
      <div class="pill">18 konu paketi</div>
      <div class="pill">Reklamsız</div>
    </div>
  </div>
<script>
  // Harfler saat yonunde 'LEARN' okunuyor -- oyunun ne oldugunu tek kelimede soyluyor.
  const L='LEARN', w=document.getElementById('w'), R=104, C=143-39;
  [...L].forEach((ch,i)=>{
    const a=(i/L.length)*2*Math.PI-Math.PI/2, d=document.createElement('div');
    d.className='tile'; d.textContent=ch;
    d.style.left=(C+R*Math.cos(a))+'px'; d.style.top=(C+R*Math.sin(a))+'px';
    w.appendChild(d);
  });
</script></body></html>`;

writeFileSync(`${OUT}/_feature.html`, featureHtml, 'utf8');
const fctx = await browser.newContext({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
const fp = await fctx.newPage();
await fp.goto(`file://${process.cwd().replace(/\\/g, '/')}/${OUT}/_feature.html`);
await fp.waitForTimeout(500);
// omitBackground YOK: Play, one cikan gorselde alfa kanali kabul etmiyor.
await fp.screenshot({ path: `${OUT}/one-cikan-gorsel-1024x500.png` });
console.log('  one-cikan-gorsel-1024x500.png');

await browser.close();
console.log(`\nHazir: ${OUT}/ klasoru Play Console'a yuklenmeye hazir.`);
