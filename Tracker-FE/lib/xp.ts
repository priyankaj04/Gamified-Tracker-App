export const XP = {
  // Dojo
  COMPLETE_WORKOUT: 50,
  LOG_SET: 5,
  HIT_PERSONAL_RECORD: 100,

  // Forge
  CREATE_PROJECT: 30,
  LOG_CODING_SESSION: 25,
  COMPLETE_MILESTONE: 80,
  SHIP_PROJECT: 150,

  // Spirit
  LOG_WEIGHT: 15,
  HIT_WEIGHT_GOAL: 200,

  // Vault
  LOG_TRANSACTION: 10,
  STAY_UNDER_BUDGET: 40,
  HIT_SAVINGS_GOAL: 120,

  // Quests
  COMPLETE_TASK_C: 20,
  COMPLETE_TASK_B: 30,
  COMPLETE_TASK_A: 50,
  COMPLETE_TASK_S: 80,
  COMPLETE_ALL_DAILY_TASKS: 75,
} as const;

export const streakMultiplier = (days: number) =>
  Math.min(1 + Math.floor(days / 7) * 0.25, 3);

export const xpForTaskPriority = (priority: 'S' | 'A' | 'B' | 'C') => ({
  S: XP.COMPLETE_TASK_S,
  A: XP.COMPLETE_TASK_A,
  B: XP.COMPLETE_TASK_B,
  C: XP.COMPLETE_TASK_C,
}[priority]);

export type QuestDifficulty = 'Trivial' | 'Normal' | 'Hard' | 'Boss';

export const difficultyMultiplier = (d?: QuestDifficulty | null) => {
  switch (d) {
    case 'Trivial': return 0.5;
    case 'Hard':    return 1.5;
    case 'Boss':    return 2.5;
    case 'Normal':
    default:        return 1;
  }
};

export const COMBO_WINDOW_MIN = 60;
export const COMBO_THRESHOLD = 3;
export const COMBO_BONUS = 1.5;

export interface HunterRank {
  key: string;
  title: string;
  min: number;
  color: string;
}

export const HUNTER_RANKS: HunterRank[] = [
  { key: 'apprentice',    title: 'Apprentice Hunter', min: 0,    color: '#94a3b8' },
  { key: 'e_rank',        title: 'E-Rank Hunter',     min: 5,    color: '#a3a3a3' },
  { key: 'd_rank',        title: 'D-Rank Hunter',     min: 20,   color: '#86efac' },
  { key: 'c_rank',        title: 'C-Rank Hunter',     min: 50,   color: '#38bdf8' },
  { key: 'b_rank',        title: 'B-Rank Hunter',     min: 100,  color: '#a78bfa' },
  { key: 'a_rank',        title: 'A-Rank Hunter',     min: 200,  color: '#f59e0b' },
  { key: 's_rank',        title: 'S-Rank Hunter',     min: 400,  color: '#f472b6' },
  { key: 'national',      title: 'National Hunter',   min: 750,  color: '#fb7185' },
  { key: 'shadow',        title: 'Shadow Monarch',    min: 1500, color: '#e879f9' },
];

export const getHunterRank = (completedCount: number, sRankCount: number): HunterRank => {
  // S-rank quests count double toward rank progression
  const score = completedCount + sRankCount;
  let current = HUNTER_RANKS[0];
  for (const r of HUNTER_RANKS) {
    if (score >= r.min) current = r;
  }
  return current;
};

export const nextHunterRank = (completedCount: number, sRankCount: number): HunterRank | null => {
  const score = completedCount + sRankCount;
  for (const r of HUNTER_RANKS) {
    if (score < r.min) return r;
  }
  return null;
};

// ─────────────────────────────────────────────────────────────
// Module rank ladders — kept in sync with api/src/lib/xp.ts.
// ─────────────────────────────────────────────────────────────

export interface ModuleRank {
  key: string;
  title: string;
  min: number;
  color: string;
}

export const DEMON_SLAYER_RANKS: ModuleRank[] = [
  { key: 'mizunoto',   title: 'Mizunoto',          min: 0,   color: '#94a3b8' },
  { key: 'mizunoe',    title: 'Mizunoe',           min: 3,   color: '#a3a3a3' },
  { key: 'kanoto',     title: 'Kanoto',            min: 10,  color: '#86efac' },
  { key: 'kanoe',      title: 'Kanoe',             min: 20,  color: '#38bdf8' },
  { key: 'tsuchinoto', title: 'Tsuchinoto',        min: 35,  color: '#22d3ee' },
  { key: 'tsuchinoe',  title: 'Tsuchinoe',         min: 55,  color: '#a78bfa' },
  { key: 'hinoto',     title: 'Hinoto',            min: 80,  color: '#f59e0b' },
  { key: 'hinoe',      title: 'Hinoe',             min: 115, color: '#fb7185' },
  { key: 'kinoto',     title: 'Kinoto',            min: 160, color: '#f472b6' },
  { key: 'kinoe',      title: 'Kinoe',             min: 220, color: '#fbbf24' },
  { key: 'hashira',    title: 'Hashira',           min: 300, color: '#e879f9' },
  { key: 'sun',        title: 'Sun Breathing Master', min: 500, color: '#facc15' },
];

export const BLUE_LOCK_RANKS: ModuleRank[] = [
  { key: 'reject',     title: 'Reject Striker',    min: 0,    color: '#94a3b8' },
  { key: 'top300',     title: 'Top 300',           min: 5,    color: '#a3a3a3' },
  { key: 'top100',     title: 'Top 100',           min: 15,   color: '#86efac' },
  { key: 'top23',      title: 'Top 23',            min: 35,   color: '#38bdf8' },
  { key: 'wildcard',   title: 'Wild Card',         min: 60,   color: '#a78bfa' },
  { key: 'starter',    title: '1st Stage Striker', min: 100,  color: '#f59e0b' },
  { key: 'egoist',     title: 'Egoist Striker',    min: 160,  color: '#fb7185' },
  { key: 'second',     title: '2nd Stage Player',  min: 240,  color: '#f472b6' },
  { key: 'neo',        title: 'Neo Egoist',        min: 350,  color: '#fbbf24' },
  { key: 'world',      title: 'World Class',       min: 500,  color: '#e879f9' },
  { key: 'no1',        title: "World's #1 Striker", min: 750, color: '#facc15' },
];

export const CHAKRA_RANKS: ModuleRank[] = [
  { key: 'civilian',   title: 'Untrained Spirit',  min: 0,    color: '#94a3b8' },
  { key: 'awakened',   title: 'Awakened Chakra',   min: 10,   color: '#86efac' },
  { key: 'genin',      title: 'Genin Path',        min: 30,   color: '#4ade80' },
  { key: 'chunin',     title: 'Chunin Path',       min: 75,   color: '#22d3ee' },
  { key: 'special',    title: 'Special Jonin',     min: 150,  color: '#38bdf8' },
  { key: 'jonin',      title: 'Jonin Path',        min: 250,  color: '#818cf8' },
  { key: 'anbu',       title: 'ANBU Mind',         min: 400,  color: '#a78bfa' },
  { key: 'sannin',     title: 'Sannin',            min: 600,  color: '#f472b6' },
  { key: 'sage',       title: 'Sage Mode',         min: 850,  color: '#fbbf24' },
  { key: 'sixpaths',   title: 'Six Paths Sage',    min: 1200, color: '#f97316' },
  { key: 'otsutsuki',  title: 'Ōtsutsuki',         min: 1750, color: '#e879f9' },
];

export const MAGE_RANKS: ModuleRank[] = [
  { key: 'wandless',   title: 'Wandless',          min: 0,     color: '#94a3b8' },
  { key: 'apprentice', title: 'Wand Apprentice',   min: 250,   color: '#a3a3a3' },
  { key: 'one_line',   title: 'One-Line Mage',     min: 1000,  color: '#86efac' },
  { key: 'two_line',   title: 'Two-Line Mage',     min: 2500,  color: '#22d3ee' },
  { key: 'three_line', title: 'Three-Line Mage',   min: 6000,  color: '#a78bfa' },
  { key: 'four_line',  title: 'Magia Lupus',       min: 12000, color: '#f59e0b' },
  { key: 'five_line',  title: 'Divine Visionary',  min: 25000, color: '#fb7185' },
  { key: 'mash',       title: 'Magic Realm Boss',  min: 60000, color: '#facc15' },
];
