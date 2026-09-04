/**
 * WordDash'in kelime havuzu. Bilinçli olarak ÇEŞİTLİ uzunlukta (2-9 harf)
 * VE ARTAN ZORLUKTA sıralı: levels.ts bu diziyi index sırasıyla okuduğu
 * için, dizideki sıra = oyundaki zorluk eğrisi. En kısa/en yaygın
 * kelimeler baştaki seviyelerde, en uzun/az yaygın kelimeler sondaki
 * seviyelerde -- "çok kolaydan çok zora" ilerleme buradan geliyor.
 */
export interface WordEntry {
  word: string;
  tr: string;
}

export const WORD_LIST: WordEntry[] = [
  // 2 harf -- çok kolay
  { word: 'go', tr: 'git' },
  { word: 'up', tr: 'yukarı' },
  { word: 'no', tr: 'hayır' },
  { word: 'we', tr: 'biz' },

  // 3 harf
  { word: 'cat', tr: 'kedi' },
  { word: 'dog', tr: 'köpek' },
  { word: 'sun', tr: 'güneş' },
  { word: 'cup', tr: 'fincan' },
  { word: 'ear', tr: 'kulak' },
  { word: 'key', tr: 'anahtar' },

  // 4 harf
  { word: 'book', tr: 'kitap' },
  { word: 'fish', tr: 'balık' },
  { word: 'bird', tr: 'kuş' },
  { word: 'moon', tr: 'ay' },
  { word: 'star', tr: 'yıldız' },
  { word: 'tree', tr: 'ağaç' },
  { word: 'lion', tr: 'aslan' },
  { word: 'rose', tr: 'gül' },

  // 5 harf
  { word: 'house', tr: 'ev' },
  { word: 'water', tr: 'su' },
  { word: 'table', tr: 'masa' },
  { word: 'apple', tr: 'elma' },
  { word: 'happy', tr: 'mutlu' },
  { word: 'tiger', tr: 'kaplan' },
  { word: 'cloud', tr: 'bulut' },
  { word: 'grape', tr: 'üzüm' },

  // 6 harf -- orta
  { word: 'garden', tr: 'bahçe' },
  { word: 'window', tr: 'pencere' },
  { word: 'animal', tr: 'hayvan' },
  { word: 'forest', tr: 'orman' },
  { word: 'flower', tr: 'çiçek' },
  { word: 'family', tr: 'aile' },
  { word: 'friend', tr: 'arkadaş' },
  { word: 'banana', tr: 'muz' },
  { word: 'rabbit', tr: 'tavşan' },
  { word: 'guitar', tr: 'gitar' },

  // 7 harf
  { word: 'kitchen', tr: 'mutfak' },
  { word: 'morning', tr: 'sabah' },
  { word: 'teacher', tr: 'öğretmen' },
  { word: 'student', tr: 'öğrenci' },
  { word: 'journey', tr: 'yolculuk' },
  { word: 'rainbow', tr: 'gökkuşağı' },
  { word: 'dolphin', tr: 'yunus' },
  { word: 'village', tr: 'köy' },

  // 8 harf -- zor
  { word: 'mountain', tr: 'dağ' },
  { word: 'elephant', tr: 'fil' },
  { word: 'computer', tr: 'bilgisayar' },
  { word: 'umbrella', tr: 'şemsiye' },
  { word: 'princess', tr: 'prenses' },
  { word: 'dinosaur', tr: 'dinozor' },
  { word: 'hospital', tr: 'hastane' },
  { word: 'birthday', tr: 'doğum günü' },

  // 9 harf -- çok zor
  { word: 'butterfly', tr: 'kelebek' },
  { word: 'telephone', tr: 'telefon' },
  { word: 'chocolate', tr: 'çikolata' },
  { word: 'newspaper', tr: 'gazete' },
  { word: 'wonderful', tr: 'harika' },
  { word: 'beautiful', tr: 'güzel' },
  { word: 'adventure', tr: 'macera' },
  { word: 'dangerous', tr: 'tehlikeli' },
];
