/**
 * Rütbe (rank) sistemi: seviyeye bağlı, jetonla ilgisi olmayan bir "ne kadar
 * ilerledin" göstergesi. Lider tablosu rekabeti dış dünyayla kıyaslıyor,
 * rütbe ise kullanıcının KENDİ yolculuğunu görmesini sağlıyor -- ikisi
 * birbirini tamamlıyor, biri diğerinin yerini tutmuyor.
 */
export interface Rank {
  id: string;
  nameKey: 'rankRookie' | 'rankExplorer' | 'rankExpert' | 'rankMaster' | 'rankLegend';
  icon: string;
  minLevel: number;
  /** Rozet arkaplanı için Tailwind gradient sınıfı -- from/to çifti tam yazıldı (bkz. themes.ts'deki aynı gerekçe). */
  gradientClass: string;
}

export const RANKS: Rank[] = [
  { id: 'rookie', nameKey: 'rankRookie', icon: '🌱', minLevel: 0, gradientClass: 'from-emerald-400 to-lime-400' },
  { id: 'explorer', nameKey: 'rankExplorer', icon: '🧭', minLevel: 10, gradientClass: 'from-sky-400 to-cyan-400' },
  { id: 'expert', nameKey: 'rankExpert', icon: '⚡', minLevel: 25, gradientClass: 'from-violet-400 to-fuchsia-400' },
  { id: 'master', nameKey: 'rankMaster', icon: '👑', minLevel: 50, gradientClass: 'from-amber-300 to-orange-400' },
  { id: 'legend', nameKey: 'rankLegend', icon: '🏆', minLevel: 100, gradientClass: 'from-rose-400 via-fuchsia-400 to-indigo-400' },
];

export function rankForLevel(level: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) current = r;
    else break;
  }
  return current;
}

/** Bir sonraki rütbe -- zaten en üstteyse null (rütbe ilerleme çubuğu "MAX" gösterir). */
export function nextRank(level: number): Rank | null {
  return RANKS.find((r) => r.minLevel > level) ?? null;
}
