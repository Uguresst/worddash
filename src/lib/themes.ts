/**
 * Jetonla satın alınan görsel temalar. Sınıflar BİLEREK tam, harfi harfine
 * yazıldı (string birleştirme yok) -- Tailwind'in tarayıcısı sadece
 * kaynak dosyada gerçekten var olan sınıf isimlerini görüyor, dinamik
 * `bg-${color}-950` gibi bir birleştirme derlemede sessizce kaybolurdu.
 */
export interface Theme {
  id: string;
  name: string;
  /** İngilizce arayüzde ismi de İngilizce göstermek için -- eskiden tema
   *  isimleri her zaman Türkçe sabitti, EN modunda bile "Gün Batımı" yazıyordu. */
  nameEn: string;
  price: number;
  bgClass: string;
  titleClass: string;
  tileSelectedClass: string;
  navActiveClass: string;
  wheelFrom: string; // SVG gradient stop'u -- Tailwind sınıfı değil, gerçek renk gerekiyor
  wheelTo: string;
  /** Mağazada "YENİ" rozeti -- henüz alınmamışsa gösterilir, alınınca kaybolur. */
  isNew?: boolean;
}

export const THEMES: Theme[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    nameEn: 'Aurora',
    price: 0,
    bgClass: 'bg-gradient-to-b from-indigo-950 via-purple-900 to-fuchsia-950',
    titleClass: 'bg-gradient-to-r from-amber-300 to-pink-400 bg-clip-text text-transparent',
    tileSelectedClass: 'bg-gradient-to-br from-amber-300 to-pink-400 text-slate-900',
    navActiveClass: 'bg-white text-fuchsia-700',
    wheelFrom: '#fbbf24',
    wheelTo: '#f472b6',
  },
  {
    id: 'ocean',
    name: 'Okyanus',
    nameEn: 'Ocean',
    price: 50,
    bgClass: 'bg-gradient-to-b from-sky-950 via-blue-900 to-cyan-950',
    titleClass: 'bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent',
    tileSelectedClass: 'bg-gradient-to-br from-cyan-300 to-blue-400 text-slate-900',
    navActiveClass: 'bg-white text-blue-700',
    wheelFrom: '#22d3ee',
    wheelTo: '#60a5fa',
  },
  {
    id: 'sunset',
    name: 'Gün Batımı',
    nameEn: 'Sunset',
    price: 100,
    bgClass: 'bg-gradient-to-b from-orange-950 via-red-900 to-rose-950',
    titleClass: 'bg-gradient-to-r from-orange-300 to-rose-400 bg-clip-text text-transparent',
    tileSelectedClass: 'bg-gradient-to-br from-orange-300 to-rose-400 text-slate-900',
    navActiveClass: 'bg-white text-rose-700',
    wheelFrom: '#fb923c',
    wheelTo: '#fb7185',
  },
  {
    id: 'forest',
    name: 'Orman',
    nameEn: 'Forest',
    price: 100,
    bgClass: 'bg-gradient-to-b from-emerald-950 via-green-900 to-teal-950',
    titleClass: 'bg-gradient-to-r from-lime-300 to-emerald-400 bg-clip-text text-transparent',
    tileSelectedClass: 'bg-gradient-to-br from-lime-300 to-emerald-400 text-slate-900',
    navActiveClass: 'bg-white text-emerald-700',
    wheelFrom: '#a3e635',
    wheelTo: '#34d399',
  },
  {
    id: 'candy',
    name: 'Şeker',
    nameEn: 'Candy',
    price: 75,
    bgClass: 'bg-gradient-to-b from-pink-950 via-fuchsia-900 to-purple-950',
    titleClass: 'bg-gradient-to-r from-pink-300 to-fuchsia-400 bg-clip-text text-transparent',
    tileSelectedClass: 'bg-gradient-to-br from-pink-300 to-fuchsia-400 text-slate-900',
    navActiveClass: 'bg-white text-fuchsia-700',
    wheelFrom: '#f9a8d4',
    wheelTo: '#e879f9',
  },
  {
    id: 'midnight',
    name: 'Gece Yarısı',
    nameEn: 'Midnight',
    price: 150,
    bgClass: 'bg-gradient-to-b from-slate-950 via-slate-900 to-zinc-950',
    titleClass: 'bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent',
    tileSelectedClass: 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900',
    navActiveClass: 'bg-white text-slate-800',
    wheelFrom: '#e2e8f0',
    wheelTo: '#94a3b8',
  },
  {
    id: 'royal',
    name: 'Kraliyet',
    nameEn: 'Royal',
    price: 220,
    bgClass: 'bg-gradient-to-b from-violet-950 via-purple-950 to-slate-950',
    titleClass: 'bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent',
    tileSelectedClass: 'bg-gradient-to-br from-yellow-300 to-amber-400 text-slate-900',
    navActiveClass: 'bg-white text-amber-700',
    wheelFrom: '#fde047',
    wheelTo: '#a78bfa',
    isNew: true,
  },
];

export function themeById(id: string): Theme {
  return THEMES.find((th) => th.id === id) ?? THEMES[0];
}

export function themeName(th: Theme, lang: 'tr' | 'en'): string {
  return lang === 'en' ? th.nameEn : th.name;
}
