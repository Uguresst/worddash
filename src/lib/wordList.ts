/**
 * WordDash'in kelime havuzu — her giriş bir İngilizce kelime + Türkçe
 * karşılığı. Günün kelimesi bu listeden tarihe göre deterministik
 * seçiliyor (bkz. dailyWord.ts), yani herkes aynı gün aynı kelimeyi çözüyor
 * (Wordle'daki gibi paylaşılabilir bir deneyim).
 *
 * Kelimeler bilinçli olarak 5-8 harf arası: 4'ten kısa scramble'da çok
 * kolay/anlamsız oluyor, 9'dan uzun ekranda harfleri sığdırmak zorlaşıyor.
 */
export interface WordEntry {
  word: string;
  tr: string;
}

export const WORD_LIST: WordEntry[] = [
  { word: 'apple', tr: 'elma' },
  { word: 'journey', tr: 'yolculuk' },
  { word: 'brave', tr: 'cesur' },
  { word: 'window', tr: 'pencere' },
  { word: 'garden', tr: 'bahçe' },
  { word: 'friend', tr: 'arkadaş' },
  { word: 'mountain', tr: 'dağ' },
  { word: 'river', tr: 'nehir' },
  { word: 'happy', tr: 'mutlu' },
  { word: 'quiet', tr: 'sessiz' },
  { word: 'bridge', tr: 'köprü' },
  { word: 'forest', tr: 'orman' },
  { word: 'summer', tr: 'yaz' },
  { word: 'winter', tr: 'kış' },
  { word: 'autumn', tr: 'sonbahar' },
  { word: 'spring', tr: 'ilkbahar' },
  { word: 'kitchen', tr: 'mutfak' },
  { word: 'dream', tr: 'rüya' },
  { word: 'travel', tr: 'seyahat' },
  { word: 'music', tr: 'müzik' },
  { word: 'picture', tr: 'resim' },
  { word: 'school', tr: 'okul' },
  { word: 'teacher', tr: 'öğretmen' },
  { word: 'student', tr: 'öğrenci' },
  { word: 'market', tr: 'pazar' },
  { word: 'bicycle', tr: 'bisiklet' },
  { word: 'weather', tr: 'hava durumu' },
  { word: 'morning', tr: 'sabah' },
  { word: 'evening', tr: 'akşam' },
  { word: 'holiday', tr: 'tatil' },
  { word: 'beach', tr: 'plaj' },
  { word: 'island', tr: 'ada' },
  { word: 'castle', tr: 'kale' },
  { word: 'dragon', tr: 'ejderha' },
  { word: 'wonder', tr: 'merak' },
  { word: 'simple', tr: 'basit' },
  { word: 'gentle', tr: 'nazik' },
  { word: 'strong', tr: 'güçlü' },
  { word: 'bright', tr: 'parlak' },
  { word: 'shadow', tr: 'gölge' },
  { word: 'planet', tr: 'gezegen' },
  { word: 'ocean', tr: 'okyanus' },
  { word: 'desert', tr: 'çöl' },
  { word: 'jungle', tr: 'vahşi orman' },
  { word: 'wisdom', tr: 'bilgelik' },
  { word: 'courage', tr: 'cesaret' },
  { word: 'freedom', tr: 'özgürlük' },
  { word: 'justice', tr: 'adalet' },
  { word: 'mystery', tr: 'gizem' },
  { word: 'treasure', tr: 'hazine' },
  { word: 'voyage', tr: 'deniz yolculuğu' },
  { word: 'harvest', tr: 'hasat' },
  { word: 'thunder', tr: 'gök gürültüsü' },
  { word: 'lantern', tr: 'fener' },
  { word: 'whisper', tr: 'fısıltı' },
  { word: 'compass', tr: 'pusula' },
  { word: 'horizon', tr: 'ufuk' },
  { word: 'crystal', tr: 'kristal' },
  { word: 'feather', tr: 'tüy' },
  { word: 'candle', tr: 'mum' },
];
