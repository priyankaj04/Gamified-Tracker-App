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

// Vault-specific honorific title (cosmetic, derives from total vault XP).
export const VAULT_TITLES: { threshold: number; title: string }[] = [
  { threshold: 0, title: 'Coin Collector' },
  { threshold: 500, title: 'Frugal Apprentice' },
  { threshold: 1500, title: 'Budget Genin' },
  { threshold: 4000, title: 'Savings Chunin' },
  { threshold: 10000, title: 'Money Jonin' },
  { threshold: 25000, title: 'Vault Hokage' },
];

export const vaultTitleFor = (vaultXp: number) => {
  let title = VAULT_TITLES[0].title;
  for (const t of VAULT_TITLES) if (vaultXp >= t.threshold) title = t.title;
  return title;
};
