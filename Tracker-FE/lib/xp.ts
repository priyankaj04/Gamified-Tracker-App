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
