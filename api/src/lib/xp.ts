export const XP = {
  COMPLETE_WORKOUT: 50,
  LOG_SET: 5,
  HIT_PERSONAL_RECORD: 100,

  CREATE_PROJECT: 30,
  LOG_CODING_SESSION: 25,
  CODING_SESSION_PER_10_MIN: 5,
  NIGHT_OWL_BONUS: 10,
  COMPLETE_MILESTONE: 80,
  SHIP_PROJECT: 150,

  DSA_EASY: 20,
  DSA_MEDIUM: 40,
  DSA_HARD: 80,

  LEARNING_COURSE: 200,
  LEARNING_BOOK: 150,
  LEARNING_TUTORIAL: 50,
  LEARNING_VIDEO: 30,
  LEARNING_DOCUMENTATION: 20,
  LEARNING_PAPER: 40,

  LOG_WEIGHT: 15,
  HIT_WEIGHT_GOAL: 200,

  LOG_MEAL: 10,
  LOG_SLEEP_GOOD: 15,
  LOG_SLEEP_SHORT: 5,
  COMPLETE_HABIT: 10,
  HABIT_BUNDLE_BONUS: 50,
  COMPLETE_FAST_BASE: 50,
  COMPLETE_FAST_PER_HOUR: 5,
  HIT_STEP_GOAL: 20,
  HIT_SPIRIT_GOAL: 200,

  // ── VAULT (legacy keys) ────────────────────────────
  LOG_TRANSACTION: 10,
  STAY_UNDER_BUDGET: 40,
  HIT_SAVINGS_GOAL: 120,

  // ── VAULT (expansion) ──────────────────────────────
  LOG_INCOME: 15,
  TX_RECEIPT_BONUS: 5,
  TX_NOTE_BONUS: 2,
  RECURRING_AUTO_CONFIRMED: 5,
  ZERO_SPEND_DAY: 20,
  NO_SPEND_WEEK: 100,
  WEEK_UNDER_BUDGET: 30,
  CATEGORY_UNDER_BUDGET: 15,
  BUDGET_CREATED: 20,
  CREATE_SAVINGS_GOAL: 30,
  GOAL_CONTRIBUTION: 10,
  SAVINGS_GOAL_BEATEN: 200,
  ROUND_UP_SAVED: 5,
  LOG_INVESTMENT: 25,
  LOG_SIP_CONTRIBUTION: 30,
  INVESTMENT_MILESTONE: 100,
  DEBT_PAYMENT: 40,
  DEBT_CLEARED: 1000,
  NET_WORTH_SNAPSHOT: 25,
  NET_WORTH_MILESTONE: 200,
  WEEKLY_REPORT_REVIEWED: 25,
  MONTHLY_REPORT_REVIEWED: 50,
  ANNUAL_REVIEW_COMPLETED: 500,
  EXPORT_REPORT: 15,
  FULLY_CATEGORIZED_MONTH: 30,
  SUBSCRIPTION_CANCELLED: 150,
  BILL_PAID_ON_TIME: 20,
  CHALLENGE_COMPLETED_SMALL: 100,
  CHALLENGE_COMPLETED_MEDIUM: 200,
  CHALLENGE_COMPLETED_LARGE: 400,

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

// Quests — Hunter x Hunter top-tier list. Silva (#10, entry) → Meruem (#1, apex).
// Kept in sync with the FE ladder.
export const HUNTER_RANKS: HunterRank[] = [
  { key: 'silva',    title: 'Silva Zoldyck',    min: 0,    color: '#d9cfaa' },
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
// Module rank ladders — themed, cosmetic, derived from activity.
// Each module has its own progression independent of global level.
// ─────────────────────────────────────────────────────────────

export interface ModuleRank {
  key: string;
  title: string;
  min: number;
  color: string;
}

// Dojo — Demon Slayer Corps (Kakushi → Hashira → Sun Breathing user).
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

// Forge — Blue Lock striker ranks.
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

// Spirit — Naruto power ranking. Climb from Shisui (#20, entry rank) to
// Naruto Uzumaki (#1, apex). Colors stay inside the green spirit palette,
// with the final three legendary ranks shining in gold.
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

// Vault — Mashle: Muscle and Magic. Climb the top-10 power list from Adam Jobs
// (#10, entry) to Mash Burnedead (#1, apex). Kept in sync with the FE ladder.
export const MAGE_RANKS: ModuleRank[] = [
  { key: 'adam',          title: 'Adam Jobs',        min: 0,      color: '#fffd9c' },
  { key: 'kaldo',         title: 'Kaldo Gehenna',    min: 250,    color: '#fde68a' },
  { key: 'orter',         title: 'Orter Mádl',       min: 750,    color: '#fcd34d' },
  { key: 'ryoh',          title: 'Ryoh Grantz',      min: 1500,   color: '#fbbf24' },
  { key: 'wahlberg',      title: 'Wahlberg Baigan',  min: 3000,   color: '#f59e0b' },
  { key: 'lance',         title: 'Lance Crown',      min: 6000,   color: '#f97316' },
  { key: 'rayne',         title: 'Rayne Ames',       min: 12000,  color: '#fb7185' },
  { key: 'doom',          title: 'Doom',             min: 25000,  color: '#ef4444' },
  { key: 'innocent_zero', title: 'Innocent Zero',    min: 50000,  color: '#a855f7' },
  { key: 'mash',          title: 'Mash Burnedead',   min: 100000, color: '#facc15' },
];

const pickRank = (ladder: ModuleRank[], score: number): ModuleRank => {
  let cur = ladder[0];
  for (const r of ladder) if (score >= r.min) cur = r;
  return cur;
};

const pickNextRank = (ladder: ModuleRank[], score: number): ModuleRank | null => {
  for (const r of ladder) if (score < r.min) return r;
  return null;
};

export const rankProgress = (ladder: ModuleRank[], score: number) => {
  const rank = pickRank(ladder, score);
  const nextRank = pickNextRank(ladder, score);
  const progressPct = nextRank
    ? Math.min(100, Math.round(((score - rank.min) / (nextRank.min - rank.min)) * 100))
    : 100;
  const toNext = nextRank ? Math.max(0, nextRank.min - score) : 0;
  return { rank, nextRank, score, progressPct, toNext };
};

export const getDojoRank   = (score: number) => rankProgress(DEMON_SLAYER_RANKS, score);
export const getForgeRank  = (score: number) => rankProgress(BLUE_LOCK_RANKS, score);
export const getSpiritRank = (score: number) => rankProgress(CHAKRA_RANKS, score);
export const getVaultRank  = (score: number) => rankProgress(MAGE_RANKS, score);

// Legacy: older code expects a flat title from vault XP.
export const vaultTitleFor = (vaultXp: number) => pickRank(MAGE_RANKS, vaultXp).title;
