import type { GameState } from './storage';
import type { DictKey } from './i18n';

/**
 * Basit eşik-tabanlı rozetler -- ayrı bir "unlocked" listesi state'te
 * tutulmuyor, her render'da mevcut state'ten türetiliyor. Bu yüzden hiçbir
 * rozet metriği asla GERİYE gitmemeli (bkz. storage.ts'deki totalCoinsEarned
 * yorumu) -- yoksa bir rozet açılıp sonra "kapanmış" gibi görünür.
 */
export type AchievementMetric = 'levels' | 'vocab' | 'streak' | 'coins';

export interface AchievementDef {
  id: string;
  icon: string;
  target: number;
  metric: AchievementMetric;
  titleKey: DictKey;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_word', icon: '🥉', target: 1, metric: 'levels', titleKey: 'achFirstWord' },
  { id: 'ten_words', icon: '📚', target: 10, metric: 'vocab', titleKey: 'achTenWords' },
  { id: 'fifty_words', icon: '🎓', target: 50, metric: 'vocab', titleKey: 'achFiftyWords' },
  { id: 'hundred_words', icon: '🧠', target: 100, metric: 'vocab', titleKey: 'achHundredWords' },
  { id: 'streak5', icon: '🔥', target: 5, metric: 'streak', titleKey: 'achStreak5' },
  { id: 'streak15', icon: '💥', target: 15, metric: 'streak', titleKey: 'achStreak15' },
  { id: 'coins100', icon: '💰', target: 100, metric: 'coins', titleKey: 'achCoins100' },
  { id: 'coins500', icon: '💎', target: 500, metric: 'coins', titleKey: 'achCoins500' },
];

function metricValue(a: AchievementDef, state: GameState): number {
  switch (a.metric) {
    case 'levels':
      return state.level;
    case 'vocab':
      return state.vocabulary.length;
    case 'streak':
      return state.bestStreak;
    case 'coins':
      return state.totalCoinsEarned;
  }
}

export function isUnlocked(a: AchievementDef, state: GameState): boolean {
  return metricValue(a, state) >= a.target;
}
