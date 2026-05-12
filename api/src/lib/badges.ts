import type { Module, Rarity } from '@/types';

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  module: Module | 'global';
  xpReward: number;
}

export const BADGES: BadgeDef[] = [
  { id: 'first-blood',    name: 'First Blood',    rarity: 'Common',    module: 'dojo',   description: 'Log your first workout',           xpReward: 50 },
  { id: 'three-days',     name: 'Burning Start',  rarity: 'Common',    module: 'dojo',   description: '3-day workout streak',             xpReward: 100 },
  { id: 'iron-will',      name: 'Iron Will',      rarity: 'Rare',      module: 'dojo',   description: '7-day workout streak',             xpReward: 250 },
  { id: 'pr-collector',   name: 'PR Collector',   rarity: 'Rare',      module: 'dojo',   description: 'Set 5 personal records',           xpReward: 300 },
  { id: 'demon-slayer',   name: 'Demon Slayer',   rarity: 'Epic',      module: 'dojo',   description: '30-day workout streak',            xpReward: 750 },
  { id: 'century',        name: 'Century',        rarity: 'Epic',      module: 'dojo',   description: 'Log 100 workouts',                 xpReward: 1000 },
  { id: 'ultra-instinct', name: 'Ultra Instinct', rarity: 'Legendary', module: 'dojo',   description: '365 total workout sessions',       xpReward: 3000 },

  { id: 'hello-world',    name: 'Hello World',    rarity: 'Common',    module: 'forge',  description: 'Create your first project',        xpReward: 50 },
  { id: 'first-session',  name: 'In The Zone',    rarity: 'Common',    module: 'forge',  description: 'Log your first coding session',    xpReward: 50 },
  { id: 'ghost-protocol', name: 'Ghost Protocol', rarity: 'Rare',      module: 'forge',  description: '7-day coding streak',              xpReward: 250 },
  { id: 'full-dive',      name: 'Full Dive',      rarity: 'Rare',      module: 'forge',  description: 'Complete 3 projects (Shipped)',    xpReward: 300 },
  { id: 'hundred-hours',  name: '100 Hours',      rarity: 'Epic',      module: 'forge',  description: '100 total hours of coding logged', xpReward: 750 },
  { id: 'system-admin',   name: 'System Admin',   rarity: 'Legendary', module: 'forge',  description: '50 coding sessions logged',        xpReward: 2000 },

  { id: 'first-weigh-in',     name: 'First Weigh-In',    rarity: 'Common',    module: 'spirit', description: 'Log your first weight entry',      xpReward: 50 },
  { id: 'consistent',         name: 'Consistent',        rarity: 'Rare',      module: 'spirit', description: 'Log weight 7 days in a row',       xpReward: 250 },
  { id: 'chakra-control',     name: 'Chakra Control',    rarity: 'Epic',      module: 'spirit', description: 'Hit your body goal',               xpReward: 1000 },
  { id: 'transformation',     name: 'Transformation',    rarity: 'Legendary', module: 'spirit', description: 'Reach target weight 30+ days logged', xpReward: 3000 },
  { id: 'nutritionist',       name: 'Nutritionist',      rarity: 'Epic',      module: 'spirit', description: '30-day nutrition streak',          xpReward: 750 },
  { id: 'deep-sleep',         name: 'Deep Sleep',        rarity: 'Rare',      module: 'spirit', description: '14 nights of quality sleep',       xpReward: 400 },
  { id: 'intermittent-master',name: 'Intermittent Master',rarity: 'Epic',     module: 'spirit', description: 'Complete 20 fasts',                xpReward: 750 },
  { id: 'habit-stack',        name: 'Habit Stack',       rarity: 'Rare',      module: 'spirit', description: 'All habits done 7 days in a row',  xpReward: 400 },
  { id: 'step-master',        name: 'Step Master',       rarity: 'Rare',      module: 'spirit', description: 'Hit step goal 7 days in a row',    xpReward: 300 },

  { id: 'ryo-earned',     name: 'Ryo Earned',     rarity: 'Common',    module: 'vault',  description: 'Log your first transaction',       xpReward: 50 },
  { id: 'budget-master',  name: 'Budget Master',  rarity: 'Rare',      module: 'vault',  description: 'Stay under budget for a month',    xpReward: 300 },
  { id: 'loid-forger',    name: 'Loid Forger',    rarity: 'Legendary', module: 'vault',  description: 'Hit a savings goal of ₹1,00,000',  xpReward: 2500 },

  { id: 'novice-hunter',  name: 'Novice Hunter',  rarity: 'Common',    module: 'quests', description: 'Complete your first quest',        xpReward: 50 },
  { id: 'hunter-exam',    name: 'Hunter Exam',    rarity: 'Rare',      module: 'quests', description: 'Complete 20 quests',               xpReward: 250 },
  { id: 'greed-island',   name: 'Greed Island',   rarity: 'Epic',      module: 'quests', description: 'Complete 50 quests',               xpReward: 750 },
  { id: 's-rank',         name: 'S-Rank Hunter',  rarity: 'Legendary', module: 'quests', description: 'Complete 10 S-Rank quests',        xpReward: 2000 },

  { id: 'all-rounder',    name: 'All Rounder',    rarity: 'Epic',      module: 'global', description: 'Use all 5 modules in one day',     xpReward: 500 },
  { id: 'the-one',        name: 'The One',        rarity: 'Legendary', module: 'global', description: 'Reach Level 10: Hokage',           xpReward: 5000 },
  { id: 'week-warrior',   name: 'Week Warrior',   rarity: 'Rare',      module: 'global', description: '7-day streak in any module',       xpReward: 300 },
];

export type BadgeCheckContext = {
  workoutCount?: number;
  workoutStreak?: number;
  prCount?: number;
  projectCount?: number;
  shippedCount?: number;
  sessionCount?: number;
  forgeStreak?: number;
  totalCodingHours?: number;
  weightLogCount?: number;
  weightLogStreak?: number;
  spiritStreak?: number;
  goalHit?: boolean;
  transactionCount?: number;
  budgetUnder?: boolean;
  totalSaved?: number;
  questCount?: number;
  sRankQuestCount?: number;
  level?: number;
  modulesUsedToday?: string[];
  nutritionStreak?: number;
  sleepQualityStreak?: number;
  completedFasts?: number;
  habitsAllDoneStreak?: number;
  stepGoalStreak?: number;
};

export const evaluateBadges = (ctx: BadgeCheckContext): string[] => {
  const unlock: string[] = [];

  if ((ctx.workoutCount ?? 0) >= 1) unlock.push('first-blood');
  if ((ctx.workoutStreak ?? 0) >= 3) unlock.push('three-days');
  if ((ctx.workoutStreak ?? 0) >= 7) unlock.push('iron-will');
  if ((ctx.prCount ?? 0) >= 5) unlock.push('pr-collector');
  if ((ctx.workoutStreak ?? 0) >= 30) unlock.push('demon-slayer');
  if ((ctx.workoutCount ?? 0) >= 100) unlock.push('century');
  if ((ctx.workoutCount ?? 0) >= 365) unlock.push('ultra-instinct');

  if ((ctx.projectCount ?? 0) >= 1) unlock.push('hello-world');
  if ((ctx.sessionCount ?? 0) >= 1) unlock.push('first-session');
  if ((ctx.forgeStreak ?? 0) >= 7) unlock.push('ghost-protocol');
  if ((ctx.shippedCount ?? 0) >= 3) unlock.push('full-dive');
  if ((ctx.totalCodingHours ?? 0) >= 100) unlock.push('hundred-hours');
  if ((ctx.sessionCount ?? 0) >= 50) unlock.push('system-admin');

  if ((ctx.weightLogCount ?? 0) >= 1) unlock.push('first-weigh-in');
  if ((ctx.weightLogStreak ?? 0) >= 7) unlock.push('consistent');
  if (ctx.goalHit) unlock.push('chakra-control');
  if (ctx.goalHit && (ctx.weightLogCount ?? 0) >= 30) unlock.push('transformation');
  if ((ctx.nutritionStreak ?? 0) >= 30) unlock.push('nutritionist');
  if ((ctx.sleepQualityStreak ?? 0) >= 14) unlock.push('deep-sleep');
  if ((ctx.completedFasts ?? 0) >= 20) unlock.push('intermittent-master');
  if ((ctx.habitsAllDoneStreak ?? 0) >= 7) unlock.push('habit-stack');
  if ((ctx.stepGoalStreak ?? 0) >= 7) unlock.push('step-master');

  if ((ctx.transactionCount ?? 0) >= 1) unlock.push('ryo-earned');
  if (ctx.budgetUnder) unlock.push('budget-master');
  if ((ctx.totalSaved ?? 0) >= 100000) unlock.push('loid-forger');

  if ((ctx.questCount ?? 0) >= 1) unlock.push('novice-hunter');
  if ((ctx.questCount ?? 0) >= 20) unlock.push('hunter-exam');
  if ((ctx.questCount ?? 0) >= 50) unlock.push('greed-island');
  if ((ctx.sRankQuestCount ?? 0) >= 10) unlock.push('s-rank');

  if ((ctx.modulesUsedToday?.length ?? 0) >= 5) unlock.push('all-rounder');
  if ((ctx.level ?? 1) >= 10) unlock.push('the-one');
  const anyStreak = Math.max(
    ctx.workoutStreak ?? 0,
    ctx.forgeStreak ?? 0,
    ctx.spiritStreak ?? 0,
  );
  if (anyStreak >= 7) unlock.push('week-warrior');

  return unlock;
};
