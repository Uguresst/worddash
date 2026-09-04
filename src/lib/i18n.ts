/**
 * Minimal TR/EN sözlük. Afsar Gym Lab'daki gibi büyük bir React context
 * kurmaya gerek yok -- WordDash'in metin yüzeyi çok küçük, dil state'i
 * zaten storage.ts'deki GameState.lang üzerinden yönetiliyor. Bu yüzden
 * `t(key, lang)` saf bir fonksiyon: bileşenler `t('play', lang)` diye çağırır.
 */
const DICT = {
  tr: {
    title: 'WordDash',
    tagline: 'Günün kelimesi',
    play: 'Oyna',
    myVocabulary: 'Kelime Dağarcığım',
    streak: 'Seri',
    longestStreak: 'En uzun seri',
    check: 'Kontrol Et',
    shuffle: 'Karıştır',
    hint: 'İpucu',
    win: 'Doğru bildin!',
    lose: 'Bugünlük bu kadar',
    todaysWord: 'Bugünün kelimesi',
    comeBackTomorrow: 'Yarın yeni kelime',
    alreadyPlayed: 'Bugünün kelimesini zaten oynadın',
    emptyVocabulary: 'Henüz kelime yok — bir kelime çözünce burada birikir.',
    backToGame: 'Oyuna Dön',
    wordsLearned: 'kelime öğrenildi',
    wrongTryAgain: 'Yanlış, tekrar dene',
  },
  en: {
    title: 'WordDash',
    tagline: "Today's word",
    play: 'Play',
    myVocabulary: 'My Vocabulary',
    streak: 'Streak',
    longestStreak: 'Longest streak',
    check: 'Check',
    shuffle: 'Shuffle',
    hint: 'Hint',
    win: 'You got it!',
    lose: 'That’s it for today',
    todaysWord: "Today's word",
    comeBackTomorrow: 'New word tomorrow',
    alreadyPlayed: "You've already played today's word",
    emptyVocabulary: 'No words yet — solve one and it lands here.',
    backToGame: 'Back to Game',
    wordsLearned: 'words learned',
    wrongTryAgain: 'Not quite, try again',
  },
} as const;

export type Lang = keyof typeof DICT;
export type DictKey = keyof (typeof DICT)['tr'];

export function t(key: DictKey, lang: Lang): string {
  return DICT[lang][key] ?? DICT.tr[key] ?? key;
}
