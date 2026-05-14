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

// Quests ladder — Hunter x Hunter top-tier list. Climb from Silva (#10, entry)
// to Meruem (#1, apex). Colors progress through cool→magenta→legendary gold.
export const HUNTER_RANKS: HunterRank[] = [
  { key: 'silva',    title: 'Silva Zoldyck',    min: 0,    color: '#e4b7ff' },
  { key: 'youpi',    title: 'Menthuthuyoupi',   min: 5,    color: '#86efac' },
  { key: 'kurapika', title: 'Kurapika',         min: 15,   color: '#38bdf8' },
  { key: 'hisoka',   title: 'Hisoka Morow',     min: 30,   color: '#f472b6' },
  { key: 'chrollo',  title: 'Chrollo Lucilfer', min: 60,   color: '#a78bfa' },
  { key: 'pitou',    title: 'Neferpitou',       min: 100,  color: '#fb7185' },
  { key: 'killua',   title: 'Killua Zoldyck',   min: 200,  color: '#22d3ee' },
  { key: 'gon',      title: 'Gon Freecss',      min: 400,  color: '#f59e0b' },
  { key: 'netero',   title: 'Isaac Netero',     min: 800,  color: '#e879f9' },
  { key: 'meruem',   title: 'Meruem',           min: 1500, color: '#facc15' },
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

// Dashboard ladder — Solo Leveling top-10 power list. Climb from Igris (#10,
// entry) to Sung Jinwoo (#1, apex). Score = totalXp.
export const SOLO_LEVELING_RANKS: ModuleRank[] = [
  { key: 'igris',   title: 'Igris',        min: 0,      color: '#a78bfa' },
  { key: 'cha',     title: 'Cha Hae-In',   min: 1000,   color: '#c4b5fd' },
  { key: 'gunhee',  title: 'Go Gunhee',    min: 4000,   color: '#818cf8' },
  { key: 'liu',     title: 'Liu Zhigang',  min: 10000,  color: '#60a5fa' },
  { key: 'thomas',  title: 'Thomas Andre', min: 20000,  color: '#e879f9' },
  { key: 'beru',    title: 'Beru',         min: 40000,  color: '#7c3aed' },
  { key: 'bellion', title: 'Bellion',      min: 70000,  color: '#6d28d9' },
  { key: 'antares', title: 'Antares',      min: 120000, color: '#ef4444' },
  { key: 'ashborn', title: 'Ashborn',      min: 200000, color: '#0ea5e9' },
  { key: 'jinwoo',  title: 'Sung Jinwoo',  min: 350000, color: '#facc15' },
];

export const getDashboardRank = (totalXp: number): ModuleRank => {
  let cur = SOLO_LEVELING_RANKS[0];
  for (const r of SOLO_LEVELING_RANKS) if (totalXp >= r.min) cur = r;
  return cur;
};

export const nextDashboardRank = (totalXp: number): ModuleRank | null => {
  for (const r of SOLO_LEVELING_RANKS) if (totalXp < r.min) return r;
  return null;
};

// Dojo ladder — Demon Slayer top-tier list. Climb from Nezuko (#15, entry) to
// Yoriichi Tsugikuni (#1, apex). Colors progress through pink → flame orange →
// crimson → legendary gold.
export const DEMON_SLAYER_RANKS: ModuleRank[] = [
  { key: 'nezuko',    title: 'Nezuko Kamado',      min: 0,   color: '#f9a8d4' },
  { key: 'tengen',    title: 'Tengen Uzui',        min: 3,   color: '#fbcfe8' },
  { key: 'zenitsu',   title: 'Zenitsu Agatsuma',   min: 8,   color: '#fde68a' },
  { key: 'rengoku',   title: 'Kyojuro Rengoku',    min: 15,  color: '#fbbf24' },
  { key: 'muichiro',  title: 'Muichiro Tokito',    min: 25,  color: '#bae6fd' },
  { key: 'obanai',    title: 'Obanai Iguro',       min: 40,  color: '#86efac' },
  { key: 'giyu',      title: 'Giyu Tomioka',       min: 60,  color: '#22d3ee' },
  { key: 'sanemi',    title: 'Sanemi Shinazugawa', min: 85,  color: '#fb7185' },
  { key: 'gyomei',    title: 'Gyomei Himejima',    min: 115, color: '#f59e0b' },
  { key: 'akaza',     title: 'Akaza',              min: 155, color: '#f472b6' },
  { key: 'doma',      title: 'Doma',               min: 200, color: '#a78bfa' },
  { key: 'tanjiro',   title: 'Tanjiro Kamado',     min: 260, color: '#f97316' },
  { key: 'kokushibo', title: 'Kokushibo',          min: 330, color: '#818cf8' },
  { key: 'muzan',     title: 'Muzan Kibutsuji',    min: 410, color: '#ef4444' },
  { key: 'yoriichi',  title: 'Yoriichi Tsugikuni', min: 500, color: '#facc15' },
];

// Forge ladder — Blue Lock top-tier striker list. Climb from Reo Mikage (#10,
// entry) to Yoichi Isagi (#1, apex). Colors progress through forge cyan→indigo
// →legendary gold.
export const BLUE_LOCK_RANKS: ModuleRank[] = [
  { key: 'reo',     title: 'Reo Mikage',     min: 0,    color: '#7dc1fb' },
  { key: 'chigiri', title: 'Hyoma Chigiri',  min: 5,    color: '#86efac' },
  { key: 'bachira', title: 'Meguru Bachira', min: 15,   color: '#38bdf8' },
  { key: 'shidou',  title: 'Ryusei Shidou',  min: 35,   color: '#22d3ee' },
  { key: 'nagi',    title: 'Seishiro Nagi',  min: 60,   color: '#a78bfa' },
  { key: 'barou',   title: 'Shouei Barou',   min: 100,  color: '#fb7185' },
  { key: 'sae',     title: 'Sae Itoshi',     min: 160,  color: '#f472b6' },
  { key: 'kaiser',  title: 'Michael Kaiser', min: 240,  color: '#818cf8' },
  { key: 'rin',     title: 'Rin Itoshi',     min: 350,  color: '#e879f9' },
  { key: 'isagi',   title: 'Yoichi Isagi',   min: 500,  color: '#facc15' },
];

// Spirit ladder — Naruto power ranking. Climb from Shisui (#20, entry) to
// Naruto (#1, apex). Colors stay inside the green spirit palette, with the
// final three ranks shining in gold to signal legendary tier.
export const CHAKRA_RANKS: ModuleRank[] = [
  { key: 'shisui',     title: 'Shisui Uchiha',     min: 0,    color: '#86efac' },
  { key: 'sakura',     title: 'Sakura Haruno',     min: 5,    color: '#86efac' },
  { key: 'gaara',      title: 'Gaara of the Sand', min: 15,   color: '#6ee7b7' },
  { key: 'raikage3',   title: 'Third Raikage',     min: 30,   color: '#6ee7b7' },
  { key: 'hiruzen',    title: 'Hiruzen Sarutobi',  min: 50,   color: '#4ade80' },
  { key: 'killerb',    title: 'Killer B',          min: 80,   color: '#4ade80' },
  { key: 'orochimaru', title: 'Orochimaru',        min: 120,  color: '#22c55e' },
  { key: 'jiraiya',    title: 'Jiraiya',           min: 170,  color: '#22c55e' },
  { key: 'kabuto',     title: 'Kabuto Yakushi',    min: 230,  color: '#16a34a' },
  { key: 'tobirama',   title: 'Tobirama Senju',    min: 300,  color: '#16a34a' },
  { key: 'minato',     title: 'Minato Namikaze',   min: 400,  color: '#15803d' },
  { key: 'nagato',     title: 'Nagato',            min: 520,  color: '#15803d' },
  { key: 'itachi',     title: 'Itachi Uchiha',     min: 660,  color: '#10b981' },
  { key: 'kakashi',    title: 'Kakashi Hatake',    min: 820,  color: '#10b981' },
  { key: 'obito',      title: 'Obito Uchiha',      min: 1000, color: '#059669' },
  { key: 'guy',        title: 'Might Guy',         min: 1200, color: '#047857' },
  { key: 'hashirama',  title: 'Hashirama Senju',   min: 1450, color: '#065f46' },
  { key: 'madara',     title: 'Madara Uchiha',     min: 1750, color: '#fbbf24' },
  { key: 'sasuke',     title: 'Sasuke Uchiha',     min: 2100, color: '#f59e0b' },
  { key: 'naruto',     title: 'Naruto Uzumaki',    min: 2500, color: '#fbbf24' },
];

// Vault ladder — Mashle: Muscle and Magic top-tier list. Climb from Adam Jobs
// (#10, entry) to Mash Burnedead (#1, apex). Colors lean into the vault gold
// palette, with the final ranks shining in legendary gold/fuchsia.
export const MAGE_RANKS: ModuleRank[] = [
  { key: 'adam',          title: 'Adam Jobs',        min: 0,      color: '#fffd9c' },
  { key: 'kaldo',         title: 'Kaldo Gehenna',    min: 250,    color: '#ffea95' },
  { key: 'orter',         title: 'Orter Mádl',       min: 750,    color: '#fcd34d' },
  { key: 'ryoh',          title: 'Ryoh Grantz',      min: 1500,   color: '#fbbf24' },
  { key: 'wahlberg',      title: 'Wahlberg Baigan',  min: 3000,   color: '#f59e0b' },
  { key: 'lance',         title: 'Lance Crown',      min: 6000,   color: '#f97316' },
  { key: 'rayne',         title: 'Rayne Ames',       min: 12000,  color: '#fb7185' },
  { key: 'doom',          title: 'Doom',             min: 25000,  color: '#ef4444' },
  { key: 'innocent_zero', title: 'Innocent Zero',    min: 50000,  color: '#a855f7' },
  { key: 'mash',          title: 'Mash Burnedead',   min: 100000, color: '#facc15' },
];
