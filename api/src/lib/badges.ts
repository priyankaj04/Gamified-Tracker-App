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

  { id: 'hello-world',     name: 'Hello World',     rarity: 'Common',    module: 'forge',  description: 'Create your first project',        xpReward: 50 },
  { id: 'in-the-zone',     name: 'In The Zone',     rarity: 'Common',    module: 'forge',  description: 'Log your first coding session',    xpReward: 50 },
  { id: 'ghost-protocol',  name: 'Ghost Protocol',  rarity: 'Rare',      module: 'forge',  description: '7-day coding streak',              xpReward: 250 },
  { id: 'full-dive',       name: 'Full Dive',       rarity: 'Rare',      module: 'forge',  description: 'Ship 3 projects',                  xpReward: 300 },
  { id: 'the-architect',   name: 'The Architect',   rarity: 'Rare',      module: 'forge',  description: 'Complete 20 milestones',           xpReward: 400 },
  { id: 'polyglot',        name: 'Polyglot',        rarity: 'Rare',      module: 'forge',  description: 'Use 10 different tech stacks',     xpReward: 350 },
  { id: '100-hours',       name: '100 Hours',       rarity: 'Epic',      module: 'forge',  description: '100 total hours of coding logged', xpReward: 750 },
  { id: 'system-admin',    name: 'System Admin',    rarity: 'Epic',      module: 'forge',  description: '50 coding sessions logged',        xpReward: 800 },
  { id: 'algorithm-master',name: 'Algorithm Master',rarity: 'Epic',      module: 'forge',  description: 'Solve 50 DSA problems',            xpReward: 900 },
  { id: 'nightly-coder',   name: 'Nightly Coder',   rarity: 'Epic',      module: 'forge',  description: '10 sessions after 10pm',           xpReward: 700 },
  { id: 'open-source-hero',name: 'Open Source Hero',rarity: 'Epic',      module: 'forge',  description: 'Ship an open source project',      xpReward: 900 },
  { id: 'speed-runner',    name: 'Speed Runner',    rarity: 'Legendary', module: 'forge',  description: 'Ship a project within 7 days',     xpReward: 2000 },

  { id: 'first-weigh-in',     name: 'First Weigh-In',    rarity: 'Common',    module: 'spirit', description: 'Log your first weight entry',      xpReward: 50 },
  { id: 'consistent',         name: 'Consistent',        rarity: 'Rare',      module: 'spirit', description: 'Log weight 7 days in a row',       xpReward: 250 },
  { id: 'chakra-control',     name: 'Chakra Control',    rarity: 'Epic',      module: 'spirit', description: 'Hit your body goal',               xpReward: 1000 },
  { id: 'transformation',     name: 'Transformation',    rarity: 'Legendary', module: 'spirit', description: 'Reach target weight 30+ days logged', xpReward: 3000 },
  { id: 'nutritionist',       name: 'Nutritionist',      rarity: 'Epic',      module: 'spirit', description: '30-day nutrition streak',          xpReward: 750 },
  { id: 'deep-sleep',         name: 'Deep Sleep',        rarity: 'Rare',      module: 'spirit', description: '14 nights of quality sleep',       xpReward: 400 },
  { id: 'intermittent-master',name: 'Intermittent Master',rarity: 'Epic',     module: 'spirit', description: 'Complete 20 fasts',                xpReward: 750 },
  { id: 'habit-stack',        name: 'Habit Stack',       rarity: 'Rare',      module: 'spirit', description: 'All habits done 7 days in a row',  xpReward: 400 },
  { id: 'step-master',        name: 'Step Master',       rarity: 'Rare',      module: 'spirit', description: 'Hit step goal 7 days in a row',    xpReward: 300 },

  // ── VAULT BADGES ───────────────────────────────────
  // Common
  { id: 'ryo-earned',         name: 'Ryo Earned',         rarity: 'Common',    module: 'vault', description: 'Log your first transaction',           xpReward: 50 },
  { id: 'penny-pincher',      name: 'Penny Pincher',      rarity: 'Common',    module: 'vault', description: 'Log 10 transactions',                  xpReward: 75 },
  { id: 'bookkeeper',         name: 'Bookkeeper',         rarity: 'Common',    module: 'vault', description: '7-day logging streak',                 xpReward: 100 },
  { id: 'categorizer',        name: 'Categorizer',        rarity: 'Common',    module: 'vault', description: 'Use all 8 default categories',         xpReward: 75 },
  { id: 'frugal-friday',      name: 'Frugal Friday',      rarity: 'Common',    module: 'vault', description: 'Your first zero-spend day',            xpReward: 60 },
  { id: 'receipt-hunter',     name: 'Receipt Hunter',     rarity: 'Common',    module: 'vault', description: 'Attach 10 receipts',                   xpReward: 80 },
  { id: 'budgeteer',          name: 'Budgeteer',          rarity: 'Common',    module: 'vault', description: 'Set your first monthly budget',        xpReward: 100 },
  { id: 'goal-setter',        name: 'Goal Setter',        rarity: 'Common',    module: 'vault', description: 'Create your first savings goal',       xpReward: 75 },
  { id: 'note-taker',         name: 'Note Taker',         rarity: 'Common',    module: 'vault', description: 'Add descriptions to 25 transactions',  xpReward: 60 },
  { id: 'tagged-up',          name: 'Tagged Up',          rarity: 'Common',    module: 'vault', description: 'Use tags on 20 transactions',          xpReward: 75 },
  { id: 'recurring-rookie',   name: 'Recurring Rookie',   rarity: 'Common',    module: 'vault', description: 'Set up your first recurring',          xpReward: 100 },
  { id: 'subscription-sleuth',name: 'Subscription Sleuth',rarity: 'Common',    module: 'vault', description: 'Track 5+ active subscriptions',        xpReward: 150 },
  { id: 'calculator-kun',     name: 'Calculator-kun',     rarity: 'Common',    module: 'vault', description: 'Use the in-app calculator',            xpReward: 50 },
  { id: 'round-up-recruit',   name: 'Round-Up Recruit',   rarity: 'Common',    module: 'vault', description: 'First round-up saved',                 xpReward: 75 },
  // Rare
  { id: 'budget-master',      name: 'Budget Master',      rarity: 'Rare',      module: 'vault', description: 'Stay under budget for a month',        xpReward: 300 },
  { id: 'frugal-fortnight',   name: 'Frugal Fortnight',   rarity: 'Rare',      module: 'vault', description: '14-day no-discretionary streak',       xpReward: 300 },
  { id: 'savers-spirit',      name: "Saver's Spirit",     rarity: 'Rare',      module: 'vault', description: 'Hit savings target 3 months total',    xpReward: 350 },
  { id: 'streak-sage',        name: 'Streak Sage',        rarity: 'Rare',      module: 'vault', description: '30-day vault logging streak',          xpReward: 300 },
  { id: 'investors-eye',      name: "Investor's Eye",     rarity: 'Rare',      module: 'vault', description: 'Log 5 investment transactions',        xpReward: 350 },
  { id: 'debt-dodger',        name: 'Debt Dodger',        rarity: 'Rare',      module: 'vault', description: 'Clear a debt',                         xpReward: 300 },
  { id: 'category-king',      name: 'Category King',      rarity: 'Rare',      module: 'vault', description: 'Under-budget in 5 categories at once', xpReward: 250 },
  { id: 'diversifier',        name: 'Diversifier',        rarity: 'Rare',      module: 'vault', description: 'Log 5 distinct income streams',        xpReward: 300 },
  { id: 'round-up-hero',      name: 'Round-Up Hero',      rarity: 'Rare',      module: 'vault', description: 'Save ₹500 cumulatively in round-ups',  xpReward: 250 },
  { id: 'faithful-reviewer',  name: 'Faithful Reviewer',  rarity: 'Rare',      module: 'vault', description: 'Open weekly report 4 weeks in a row',  xpReward: 300 },
  { id: 'tax-prep-pro',       name: 'Tax Prep Pro',       rarity: 'Rare',      module: 'vault', description: 'Export an annual report',              xpReward: 350 },
  // Epic
  { id: 'money-master',       name: 'Money Master',       rarity: 'Epic',      module: 'vault', description: '90-day vault logging streak',          xpReward: 800 },
  { id: 'spartan-saver',      name: 'Spartan Saver',      rarity: 'Epic',      module: 'vault', description: '30 days with no dining-out spend',     xpReward: 1000 },
  { id: 'wealth-wizard',      name: 'Wealth Wizard',      rarity: 'Epic',      module: 'vault', description: 'Net worth crosses ₹5L',                xpReward: 900 },
  { id: 'compound-sage',      name: 'Compound Sage',      rarity: 'Epic',      module: 'vault', description: 'Hold an investment 1+ year logged',    xpReward: 1000 },
  { id: 'debt-demolisher',    name: 'Debt Demolisher',    rarity: 'Epic',      module: 'vault', description: 'Pay off ₹50,000 cumulative debt',      xpReward: 900 },
  { id: 'marathon-logger',    name: 'Marathon Logger',    rarity: 'Epic',      module: 'vault', description: '180-day vault streak',                 xpReward: 1000 },
  { id: 'budget-black-belt',  name: 'Budget Black Belt',  rarity: 'Epic',      module: 'vault', description: '6 consecutive months under budget',    xpReward: 800 },
  { id: 'fire-starter',       name: 'FIRE Starter',       rarity: 'Epic',      module: 'vault', description: 'Save ≥50% income 3 months running',    xpReward: 1000 },
  { id: 'side-income-mogul',  name: 'Side Income Mogul',  rarity: 'Epic',      module: 'vault', description: '₹50,000 cumulative non-salary income', xpReward: 800 },
  // Legendary
  { id: 'loid-forger',        name: 'Loid Forger',        rarity: 'Legendary', module: 'vault', description: 'Hit a ₹1,00,000 savings goal',         xpReward: 2500 },
  { id: 'money-god',          name: 'Money God',          rarity: 'Legendary', module: 'vault', description: '365-day vault streak',                 xpReward: 3000 },
  { id: 'madaras-treasury',   name: "Madara's Treasury",  rarity: 'Legendary', module: 'vault', description: 'Savings ≥ ₹5,00,000',                  xpReward: 3500 },
  { id: 'zero-debt-zen',      name: 'Zero Debt Zen',      rarity: 'Legendary', module: 'vault', description: 'Debt-free 6 consecutive months',       xpReward: 3000 },
  { id: 'decade-discipline',  name: 'Decade of Discipline',rarity: 'Legendary',module: 'vault', description: 'Hit savings target 12 months running', xpReward: 5000 },
  { id: 'millionaire-mindset',name: 'Millionaire Mindset',rarity: 'Legendary', module: 'vault', description: 'Net worth ≥ ₹10,00,000',               xpReward: 5000 },
  { id: 'crorepati',          name: 'Crorepati',          rarity: 'Legendary', module: 'vault', description: 'Net worth ≥ ₹1 crore',                 xpReward: 5000 },
  { id: 'financial-sensei',   name: 'Financial Sensei',   rarity: 'Legendary', module: 'vault', description: 'All Common+Rare vault badges',         xpReward: 4000 },
  { id: 'vault-hokage',       name: 'Vault Hokage',       rarity: 'Legendary', module: 'vault', description: 'All Common+Rare+Epic vault badges',    xpReward: 5000 },

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
  // forge extras
  milestonesCompleted?: number;
  uniqueTechCount?: number;
  nightSessionCount?: number;
  shippedWithinSevenDays?: boolean;
  shippedOpenSourceCount?: number;
  dsaSolved?: number;
  // vault extras
  vaultStreak?: number;
  uniqueVaultCategories?: number;
  zeroSpendDays?: number;
  receiptCount?: number;
  budgetSetCount?: number;
  savingsGoalCount?: number;
  descriptionCount?: number;
  taggedTxCount?: number;
  recurringCount?: number;
  activeSubscriptionsCount?: number;
  calculatorUsed?: boolean;
  roundUpCount?: number;
  roundUpSavedTotal?: number;
  noDiscretionaryStreakDays?: number;
  savingsTargetMonthsHit?: number;
  investmentTxnCount?: number;
  debtsCleared?: number;
  categoriesUnderBudgetInMonth?: number;
  uniqueIncomeStreams?: number;
  weeklyReportStreak?: number;
  annualReportExported?: boolean;
  spartanNoDiningStreak?: number;
  netWorth?: number;
  longHoldInvestmentCount?: number;
  cumulativeDebtPaid?: number;
  budgetUnderConsecutiveMonths?: number;
  highSavingsRateMonthsConsecutive?: number;
  nonSalaryIncomeTotal?: number;
  totalDebt?: number;
  debtFreeMonthsConsecutive?: number;
  unlockedVaultBadgeIds?: string[];
};

const COMMON_VAULT_IDS = new Set([
  'ryo-earned','penny-pincher','bookkeeper','categorizer','frugal-friday','receipt-hunter','budgeteer','goal-setter','note-taker','tagged-up','recurring-rookie','subscription-sleuth','calculator-kun','round-up-recruit',
]);
const RARE_VAULT_IDS = new Set([
  'budget-master','frugal-fortnight','savers-spirit','streak-sage','investors-eye','debt-dodger','category-king','diversifier','round-up-hero','faithful-reviewer','tax-prep-pro',
]);
const EPIC_VAULT_IDS = new Set([
  'money-master','spartan-saver','wealth-wizard','compound-sage','debt-demolisher','marathon-logger','budget-black-belt','fire-starter','side-income-mogul',
]);

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
  if ((ctx.sessionCount ?? 0) >= 1) unlock.push('in-the-zone');
  if ((ctx.forgeStreak ?? 0) >= 7) unlock.push('ghost-protocol');
  if ((ctx.shippedCount ?? 0) >= 3) unlock.push('full-dive');
  if ((ctx.totalCodingHours ?? 0) >= 100) unlock.push('100-hours');
  if ((ctx.sessionCount ?? 0) >= 50) unlock.push('system-admin');
  if ((ctx.milestonesCompleted ?? 0) >= 20) unlock.push('the-architect');
  if ((ctx.uniqueTechCount ?? 0) >= 10) unlock.push('polyglot');
  if ((ctx.nightSessionCount ?? 0) >= 10) unlock.push('nightly-coder');
  if (ctx.shippedWithinSevenDays) unlock.push('speed-runner');
  if ((ctx.shippedOpenSourceCount ?? 0) >= 1) unlock.push('open-source-hero');
  if ((ctx.dsaSolved ?? 0) >= 50) unlock.push('algorithm-master');

  if ((ctx.weightLogCount ?? 0) >= 1) unlock.push('first-weigh-in');
  if ((ctx.weightLogStreak ?? 0) >= 7) unlock.push('consistent');
  if (ctx.goalHit) unlock.push('chakra-control');
  if (ctx.goalHit && (ctx.weightLogCount ?? 0) >= 30) unlock.push('transformation');
  if ((ctx.nutritionStreak ?? 0) >= 30) unlock.push('nutritionist');
  if ((ctx.sleepQualityStreak ?? 0) >= 14) unlock.push('deep-sleep');
  if ((ctx.completedFasts ?? 0) >= 20) unlock.push('intermittent-master');
  if ((ctx.habitsAllDoneStreak ?? 0) >= 7) unlock.push('habit-stack');
  if ((ctx.stepGoalStreak ?? 0) >= 7) unlock.push('step-master');

  // ── VAULT ──────────────────────────────────────────
  // Common
  if ((ctx.transactionCount ?? 0) >= 1) unlock.push('ryo-earned');
  if ((ctx.transactionCount ?? 0) >= 10) unlock.push('penny-pincher');
  if ((ctx.vaultStreak ?? 0) >= 7) unlock.push('bookkeeper');
  if ((ctx.uniqueVaultCategories ?? 0) >= 8) unlock.push('categorizer');
  if ((ctx.zeroSpendDays ?? 0) >= 1) unlock.push('frugal-friday');
  if ((ctx.receiptCount ?? 0) >= 10) unlock.push('receipt-hunter');
  if ((ctx.budgetSetCount ?? 0) >= 1) unlock.push('budgeteer');
  if ((ctx.savingsGoalCount ?? 0) >= 1) unlock.push('goal-setter');
  if ((ctx.descriptionCount ?? 0) >= 25) unlock.push('note-taker');
  if ((ctx.taggedTxCount ?? 0) >= 20) unlock.push('tagged-up');
  if ((ctx.recurringCount ?? 0) >= 1) unlock.push('recurring-rookie');
  if ((ctx.activeSubscriptionsCount ?? 0) >= 5) unlock.push('subscription-sleuth');
  if (ctx.calculatorUsed) unlock.push('calculator-kun');
  if ((ctx.roundUpCount ?? 0) >= 1) unlock.push('round-up-recruit');
  // Rare
  if (ctx.budgetUnder) unlock.push('budget-master');
  if ((ctx.noDiscretionaryStreakDays ?? 0) >= 14) unlock.push('frugal-fortnight');
  if ((ctx.savingsTargetMonthsHit ?? 0) >= 3) unlock.push('savers-spirit');
  if ((ctx.vaultStreak ?? 0) >= 30) unlock.push('streak-sage');
  if ((ctx.investmentTxnCount ?? 0) >= 5) unlock.push('investors-eye');
  if ((ctx.debtsCleared ?? 0) >= 1) unlock.push('debt-dodger');
  if ((ctx.categoriesUnderBudgetInMonth ?? 0) >= 5) unlock.push('category-king');
  if ((ctx.uniqueIncomeStreams ?? 0) >= 5) unlock.push('diversifier');
  if ((ctx.roundUpSavedTotal ?? 0) >= 500) unlock.push('round-up-hero');
  if ((ctx.weeklyReportStreak ?? 0) >= 4) unlock.push('faithful-reviewer');
  if (ctx.annualReportExported) unlock.push('tax-prep-pro');
  // Epic
  if ((ctx.vaultStreak ?? 0) >= 90) unlock.push('money-master');
  if ((ctx.spartanNoDiningStreak ?? 0) >= 30) unlock.push('spartan-saver');
  if ((ctx.netWorth ?? 0) >= 500000) unlock.push('wealth-wizard');
  if ((ctx.longHoldInvestmentCount ?? 0) >= 1) unlock.push('compound-sage');
  if ((ctx.cumulativeDebtPaid ?? 0) >= 50000) unlock.push('debt-demolisher');
  if ((ctx.vaultStreak ?? 0) >= 180) unlock.push('marathon-logger');
  if ((ctx.budgetUnderConsecutiveMonths ?? 0) >= 6) unlock.push('budget-black-belt');
  if ((ctx.highSavingsRateMonthsConsecutive ?? 0) >= 3) unlock.push('fire-starter');
  if ((ctx.nonSalaryIncomeTotal ?? 0) >= 50000) unlock.push('side-income-mogul');
  // Legendary
  if ((ctx.totalSaved ?? 0) >= 100000) unlock.push('loid-forger');
  if ((ctx.vaultStreak ?? 0) >= 365) unlock.push('money-god');
  if ((ctx.totalSaved ?? 0) >= 500000) unlock.push('madaras-treasury');
  if ((ctx.totalDebt ?? -1) === 0 && (ctx.debtFreeMonthsConsecutive ?? 0) >= 6) unlock.push('zero-debt-zen');
  if ((ctx.savingsTargetMonthsHit ?? 0) >= 12) unlock.push('decade-discipline');
  if ((ctx.netWorth ?? 0) >= 1000000) unlock.push('millionaire-mindset');
  if ((ctx.netWorth ?? 0) >= 10000000) unlock.push('crorepati');

  // Meta-vault badges (need to know which vault badges the player already has).
  const have = new Set(ctx.unlockedVaultBadgeIds ?? []);
  // Include the ones we're about to unlock in this pass.
  unlock.forEach((id) => {
    if (COMMON_VAULT_IDS.has(id) || RARE_VAULT_IDS.has(id) || EPIC_VAULT_IDS.has(id)) have.add(id);
  });
  const hasAll = (set: Set<string>) => Array.from(set).every((id) => have.has(id));
  if (hasAll(COMMON_VAULT_IDS) && hasAll(RARE_VAULT_IDS)) unlock.push('financial-sensei');
  if (hasAll(COMMON_VAULT_IDS) && hasAll(RARE_VAULT_IDS) && hasAll(EPIC_VAULT_IDS)) unlock.push('vault-hokage');

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
    ctx.vaultStreak ?? 0,
  );
  if (anyStreak >= 7) unlock.push('week-warrior');

  return Array.from(new Set(unlock));
};
