import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { validateBody } from '@/middleware/validate';
import * as svc from '@/services/spirit';
import * as nutr from '@/services/nutrition';
import * as sleep from '@/services/sleep';
import * as habits from '@/services/habits';
import * as fasting from '@/services/fasting';
import * as cycle from '@/services/cycle';
import * as goals from '@/services/goals';
import * as wellness from '@/services/wellnessScore';
import * as weight from '@/services/weight';
import * as quests from '@/services/spiritQuests';
import * as streaks from '@/services/spiritStreaks';

export const spiritRouter = Router();

// ─── Profile ────────────────────────────────────────────────
const profileSchema = z.object({
  heightCm: z.number().positive().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']).optional(),
});

spiritRouter.get('/profile', asyncHandler(async (_req, res) => ok(res, await svc.getProfile())));
spiritRouter.put(
  '/profile',
  validateBody(profileSchema),
  asyncHandler(async (req, res) => ok(res, await svc.upsertProfile(req.body))),
);

// ─── Weight (proxy to existing weight service + stats) ──────
const weightEntrySchema = z.object({
  date: z.string().optional(),
  weightKg: z.number().positive(),
  bodyFatPct: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});
const weightGoalSchema = z.object({
  startWeightKg: z.number().positive(),
  targetWeightKg: z.number().positive(),
  startDate: z.string(),
  targetDate: z.string(),
});
spiritRouter.get(
  '/weight',
  asyncHandler(async (req, res) =>
    ok(
      res,
      await weight.listWeight({
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      }),
    ),
  ),
);
spiritRouter.post(
  '/weight',
  validateBody(weightEntrySchema),
  asyncHandler(async (req, res) => ok(res, await weight.createWeight(req.body), 201)),
);
spiritRouter.put(
  '/weight/goal',
  validateBody(weightGoalSchema),
  asyncHandler(async (req, res) => ok(res, await weight.upsertGoal(req.body))),
);
spiritRouter.get('/weight/goal', asyncHandler(async (_req, res) => ok(res, await weight.getGoal())));
spiritRouter.get('/weight/stats', asyncHandler(async (_req, res) => ok(res, await svc.getWeightStats())));
spiritRouter.put(
  '/weight/:id',
  validateBody(weightEntrySchema.partial()),
  asyncHandler(async (req, res) => ok(res, await weight.updateWeight(req.params.id, req.body))),
);
spiritRouter.delete(
  '/weight/:id',
  asyncHandler(async (req, res) => {
    await weight.deleteWeight(req.params.id);
    ok(res, { deleted: true });
  }),
);

// ─── Measurements ───────────────────────────────────────────
const measSchema = z.object({
  date: z.string().optional(),
  chestCm: z.number().optional(),
  waistCm: z.number().optional(),
  hipsCm: z.number().optional(),
  bicepsCm: z.number().optional(),
  thighsCm: z.number().optional(),
  neckCm: z.number().optional(),
  shouldersCm: z.number().optional(),
  calvesCm: z.number().optional(),
  forearmsCm: z.number().optional(),
  notes: z.string().optional(),
});
spiritRouter.get('/measurements', asyncHandler(async (_req, res) => ok(res, await svc.listMeasurements())));
spiritRouter.get('/measurements/latest', asyncHandler(async (_req, res) => ok(res, await svc.latestMeasurement())));
spiritRouter.get('/measurements/stats', asyncHandler(async (_req, res) => ok(res, await svc.measurementsStats())));
spiritRouter.get(
  '/measurements/compare',
  asyncHandler(async (req, res) =>
    ok(res, await svc.compareMeasurements(req.query.date1 as string, req.query.date2 as string)),
  ),
);
spiritRouter.post(
  '/measurements',
  validateBody(measSchema),
  asyncHandler(async (req, res) => ok(res, await svc.upsertMeasurement(req.body), 201)),
);
spiritRouter.put(
  '/measurements/:id',
  validateBody(measSchema.partial()),
  asyncHandler(async (req, res) => ok(res, await svc.updateMeasurement(req.params.id, req.body))),
);
spiritRouter.delete(
  '/measurements/:id',
  asyncHandler(async (req, res) => {
    await svc.deleteMeasurement(req.params.id);
    ok(res, { deleted: true });
  }),
);

// ─── Composition ────────────────────────────────────────────
spiritRouter.get('/composition', asyncHandler(async (_req, res) => ok(res, await svc.compositionHistory())));
spiritRouter.get('/composition/stats', asyncHandler(async (_req, res) => ok(res, await svc.compositionStats())));

// ─── Wellness daily (energy/mood) ───────────────────────────
const wellnessDailySchema = z.object({
  date: z.string().optional(),
  energyLevel: z.number().int().min(1).max(5).optional(),
  mood: z.number().int().min(1).max(5).optional(),
  stressLevel: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
});
spiritRouter.post(
  '/wellness',
  validateBody(wellnessDailySchema),
  asyncHandler(async (req, res) => ok(res, await svc.upsertWellness(req.body))),
);
spiritRouter.get(
  '/wellness',
  asyncHandler(async (req, res) =>
    ok(res, await svc.listWellness({ from: req.query.from as string | undefined, to: req.query.to as string | undefined })),
  ),
);
spiritRouter.get('/wellness/today', asyncHandler(async (_req, res) => ok(res, await svc.todayWellness())));
spiritRouter.get('/wellness/stats', asyncHandler(async (_req, res) => ok(res, await svc.wellnessStats())));
spiritRouter.get('/wellness/correlation', asyncHandler(async (_req, res) => ok(res, await svc.wellnessCorrelation())));

// ─── Workout-body correlation ───────────────────────────────
spiritRouter.get('/correlation', asyncHandler(async (_req, res) => ok(res, await svc.weightWorkoutCorrelation())));

// ─── Steps ──────────────────────────────────────────────────
const stepsSchema = z.object({
  date: z.string().optional(),
  steps: z.number().int().nonnegative(),
  goal: z.number().int().positive().optional(),
});
spiritRouter.post('/steps', validateBody(stepsSchema), asyncHandler(async (req, res) => ok(res, await svc.syncSteps(req.body))));
spiritRouter.get(
  '/steps',
  asyncHandler(async (req, res) =>
    ok(res, await svc.listSteps({ from: req.query.from as string | undefined, to: req.query.to as string | undefined })),
  ),
);
spiritRouter.get('/steps/stats', asyncHandler(async (_req, res) => ok(res, await svc.stepsStats())));

// ─── Wellness composite score ───────────────────────────────
spiritRouter.get('/wellness-score', asyncHandler(async (_req, res) => {
  const score = await wellness.computeWellnessScore();
  ok(res, { ...score, label: wellness.wellnessLabel(score.total) });
}));
spiritRouter.get('/wellness-score/history', asyncHandler(async (_req, res) => ok(res, await wellness.wellnessHistory())));
spiritRouter.post('/wellness-score/snapshot', asyncHandler(async (_req, res) => ok(res, await wellness.persistTodayScore())));

// ─── Nutrition ──────────────────────────────────────────────
const nutritionGoalsSchema = z.object({
  calories: z.number().int().positive().optional(),
  proteinG: z.number().int().nonnegative().optional(),
  carbsG: z.number().int().nonnegative().optional(),
  fatsG: z.number().int().nonnegative().optional(),
  waterMl: z.number().int().nonnegative().optional(),
});
spiritRouter.get('/nutrition/goals', asyncHandler(async (_req, res) => ok(res, await nutr.getGoals())));
spiritRouter.put(
  '/nutrition/goals',
  validateBody(nutritionGoalsSchema),
  asyncHandler(async (req, res) => ok(res, await nutr.upsertGoals(req.body))),
);

const tdeeSchema = z.object({
  weightKg: z.number().positive(),
  heightCm: z.number().positive(),
  age: z.number().int().positive(),
  gender: z.enum(['male', 'female', 'other']),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
});
spiritRouter.post(
  '/nutrition/tdee',
  validateBody(tdeeSchema),
  asyncHandler(async (req, res) => ok(res, nutr.calcTDEE(req.body))),
);

const mealSchema = z.object({
  date: z.string().optional(),
  mealType: z.enum(['Breakfast', 'Lunch', 'Dinner', 'Snack']),
  name: z.string().min(1),
  calories: z.number().int().nonnegative(),
  proteinG: z.number().nonnegative().optional(),
  carbsG: z.number().nonnegative().optional(),
  fatsG: z.number().nonnegative().optional(),
  quantityG: z.number().nonnegative().optional(),
  foodId: z.string().uuid().optional(),
});
spiritRouter.get(
  '/nutrition/meals',
  asyncHandler(async (req, res) => {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    ok(res, await nutr.listMeals(date));
  }),
);
spiritRouter.get(
  '/nutrition/meals/recent',
  asyncHandler(async (_req, res) => ok(res, await nutr.recentMeals())),
);
spiritRouter.post(
  '/nutrition/meals',
  validateBody(mealSchema),
  asyncHandler(async (req, res) => ok(res, await nutr.createMeal(req.body), 201)),
);
spiritRouter.put(
  '/nutrition/meals/:id',
  validateBody(mealSchema.partial()),
  asyncHandler(async (req, res) => ok(res, await nutr.updateMeal(req.params.id, req.body))),
);
spiritRouter.delete(
  '/nutrition/meals/:id',
  asyncHandler(async (req, res) => {
    await nutr.deleteMeal(req.params.id);
    ok(res, { deleted: true });
  }),
);

spiritRouter.get(
  '/nutrition/summary',
  asyncHandler(async (req, res) => {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    ok(res, await nutr.dailySummary(date));
  }),
);
spiritRouter.get('/nutrition/summary/weekly', asyncHandler(async (_req, res) => ok(res, await nutr.weeklySummary())));

const waterSchema = z.object({ amountMl: z.number().int().positive(), date: z.string().optional() });
spiritRouter.post(
  '/nutrition/water',
  validateBody(waterSchema),
  asyncHandler(async (req, res) => ok(res, await nutr.upsertWater(req.body))),
);

const foodSchema = z.object({
  name: z.string().min(1),
  caloriesPer100g: z.number().nonnegative().optional(),
  proteinPer100g: z.number().nonnegative().optional(),
  carbsPer100g: z.number().nonnegative().optional(),
  fatsPer100g: z.number().nonnegative().optional(),
});
spiritRouter.get(
  '/nutrition/food',
  asyncHandler(async (req, res) => ok(res, await nutr.listFoods((req.query.search as string) || undefined))),
);
spiritRouter.post(
  '/nutrition/food',
  validateBody(foodSchema),
  asyncHandler(async (req, res) => ok(res, await nutr.createFood(req.body), 201)),
);
spiritRouter.put(
  '/nutrition/food/:id',
  validateBody(foodSchema.partial()),
  asyncHandler(async (req, res) => ok(res, await nutr.updateFood(req.params.id, req.body))),
);
spiritRouter.delete(
  '/nutrition/food/:id',
  asyncHandler(async (req, res) => {
    await nutr.deleteFood(req.params.id);
    ok(res, { deleted: true });
  }),
);

// ─── Sleep ──────────────────────────────────────────────────
const sleepSchema = z.object({
  date: z.string(),
  bedtime: z.string(),
  wakeTime: z.string(),
  quality: z.number().int().min(1).max(5).optional(),
  notes: z.string().optional(),
});
spiritRouter.get(
  '/sleep',
  asyncHandler(async (req, res) =>
    ok(res, await sleep.listSleep({ from: req.query.from as string | undefined, to: req.query.to as string | undefined })),
  ),
);
spiritRouter.post(
  '/sleep',
  validateBody(sleepSchema),
  asyncHandler(async (req, res) => ok(res, await sleep.createSleep(req.body), 201)),
);
spiritRouter.get('/sleep/goal', asyncHandler(async (_req, res) => ok(res, await sleep.getGoal())));
spiritRouter.put(
  '/sleep/goal',
  validateBody(z.object({ targetHours: z.number().positive() })),
  asyncHandler(async (req, res) => ok(res, await sleep.upsertGoal(req.body))),
);
spiritRouter.get('/sleep/stats', asyncHandler(async (_req, res) => ok(res, await sleep.sleepStats())));
spiritRouter.put(
  '/sleep/:id',
  validateBody(sleepSchema.partial()),
  asyncHandler(async (req, res) => ok(res, await sleep.updateSleep(req.params.id, req.body))),
);
spiritRouter.delete(
  '/sleep/:id',
  asyncHandler(async (req, res) => {
    await sleep.deleteSleep(req.params.id);
    ok(res, { deleted: true });
  }),
);

// ─── Habits ─────────────────────────────────────────────────
const habitSchema = z.object({
  name: z.string().min(1),
  emoji: z.string().optional(),
  frequency: z.enum(['daily', 'weekdays', 'custom']).optional(),
  customDays: z.array(z.number().int().min(0).max(6)).optional(),
  routineSlot: z.enum(['morning', 'evening', 'anytime']).optional(),
  xpPerCompletion: z.number().int().nonnegative().optional(),
});
spiritRouter.get('/habits', asyncHandler(async (_req, res) => ok(res, await habits.listHabits())));
spiritRouter.get('/habits/today', asyncHandler(async (_req, res) => ok(res, await habits.todayHabits())));
spiritRouter.post(
  '/habits',
  validateBody(habitSchema),
  asyncHandler(async (req, res) => ok(res, await habits.createHabit(req.body), 201)),
);
spiritRouter.patch(
  '/habits/reorder',
  validateBody(z.object({ orderedIds: z.array(z.string().uuid()) })),
  asyncHandler(async (req, res) => ok(res, await habits.reorderHabits(req.body.orderedIds))),
);
spiritRouter.get('/habits/bundles', asyncHandler(async (_req, res) => ok(res, await habits.listBundles())));
spiritRouter.post(
  '/habits/bundles',
  validateBody(
    z.object({
      name: z.string().min(1),
      bonusXp: z.number().int().nonnegative().optional(),
      habitIds: z.array(z.string().uuid()),
    }),
  ),
  asyncHandler(async (req, res) => ok(res, await habits.createBundle(req.body), 201)),
);
spiritRouter.delete(
  '/habits/bundles/:id',
  asyncHandler(async (req, res) => {
    await habits.deleteBundle(req.params.id);
    ok(res, { deleted: true });
  }),
);
spiritRouter.put(
  '/habits/:id',
  validateBody(habitSchema.partial()),
  asyncHandler(async (req, res) => ok(res, await habits.updateHabit(req.params.id, req.body))),
);
spiritRouter.delete(
  '/habits/:id',
  asyncHandler(async (req, res) => {
    await habits.deleteHabit(req.params.id);
    ok(res, { deleted: true });
  }),
);
spiritRouter.post(
  '/habits/:id/complete',
  asyncHandler(async (req, res) => ok(res, await habits.completeHabit(req.params.id))),
);
spiritRouter.delete(
  '/habits/:id/complete',
  asyncHandler(async (req, res) => ok(res, await habits.uncompleteHabit(req.params.id))),
);
spiritRouter.get(
  '/habits/:id/history',
  asyncHandler(async (req, res) => ok(res, await habits.habitHistory(req.params.id))),
);
spiritRouter.get(
  '/habits/:id/streak',
  asyncHandler(async (req, res) => ok(res, await habits.habitStreak(req.params.id))),
);

// ─── Fasting ────────────────────────────────────────────────
spiritRouter.post(
  '/fasting/start',
  validateBody(z.object({ targetHours: z.number().positive(), startTime: z.string().optional() })),
  asyncHandler(async (req, res) => ok(res, await fasting.startFast(req.body), 201)),
);
spiritRouter.post(
  '/fasting/end',
  validateBody(z.object({ endTime: z.string().optional(), notes: z.string().optional() }).partial()),
  asyncHandler(async (req, res) => ok(res, await fasting.endFast(req.body))),
);
spiritRouter.get('/fasting/active', asyncHandler(async (_req, res) => ok(res, await fasting.getActive())));
spiritRouter.get('/fasting', asyncHandler(async (_req, res) => ok(res, await fasting.listFasts())));
spiritRouter.get('/fasting/stats', asyncHandler(async (_req, res) => ok(res, await fasting.fastingStats())));
spiritRouter.delete(
  '/fasting/:id',
  asyncHandler(async (req, res) => {
    await fasting.deleteFast(req.params.id);
    ok(res, { deleted: true });
  }),
);

// ─── Cycle ──────────────────────────────────────────────────
spiritRouter.get('/cycle/settings', asyncHandler(async (_req, res) => ok(res, await cycle.getSettings())));
spiritRouter.put(
  '/cycle/settings',
  validateBody(
    z
      .object({
        isEnabled: z.boolean().optional(),
        averageCycleLength: z.number().int().positive().optional(),
        averagePeriodLength: z.number().int().positive().optional(),
      })
      .partial(),
  ),
  asyncHandler(async (req, res) => ok(res, await cycle.upsertSettings(req.body))),
);
spiritRouter.post(
  '/cycle/start',
  validateBody(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => ok(res, await cycle.startCycle(req.body), 201)),
);
spiritRouter.put(
  '/cycle/:id',
  validateBody(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => ok(res, await cycle.updateCycleEntry(req.params.id, req.body))),
);
spiritRouter.delete(
  '/cycle/:id',
  asyncHandler(async (req, res) => {
    await cycle.deleteCycle(req.params.id);
    ok(res, { deleted: true });
  }),
);
spiritRouter.patch(
  '/cycle/end',
  validateBody(z.object({ endDate: z.string().optional() })),
  asyncHandler(async (req, res) => ok(res, await cycle.endCycle(req.body))),
);
spiritRouter.get('/cycle', asyncHandler(async (_req, res) => ok(res, await cycle.listCycles())));
spiritRouter.get('/cycle/today', asyncHandler(async (_req, res) => ok(res, await cycle.todayCycle())));
spiritRouter.get('/cycle/prediction', asyncHandler(async (_req, res) => ok(res, await cycle.cyclePrediction())));
spiritRouter.post(
  '/cycle/symptoms',
  validateBody(
    z.object({
      date: z.string().optional(),
      cramps: z.number().int().min(0).max(5).optional(),
      bloating: z.number().int().min(0).max(5).optional(),
      mood: z.number().int().min(0).max(5).optional(),
      energy: z.number().int().min(0).max(5).optional(),
      notes: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => ok(res, await cycle.upsertSymptoms(req.body))),
);
spiritRouter.get(
  '/cycle/symptoms',
  asyncHandler(async (req, res) => {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    ok(res, await cycle.getSymptoms(date));
  }),
);

// ─── Goals ──────────────────────────────────────────────────
const goalSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['numeric', 'habit', 'reduction', 'milestone']),
  unit: z.string().optional(),
  startValue: z.number().optional(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  xpReward: z.number().int().nonnegative().optional(),
});
spiritRouter.get(
  '/goals',
  asyncHandler(async (_req, res) => ok(res, await goals.listGoals({ archived: false }))),
);
spiritRouter.get(
  '/goals/archived',
  asyncHandler(async (_req, res) => ok(res, await goals.listGoals({ archived: true }))),
);
spiritRouter.post(
  '/goals',
  validateBody(goalSchema),
  asyncHandler(async (req, res) => ok(res, await goals.createGoal(req.body), 201)),
);
spiritRouter.put(
  '/goals/:id',
  validateBody(goalSchema.partial()),
  asyncHandler(async (req, res) => ok(res, await goals.updateGoal(req.params.id, req.body))),
);
spiritRouter.delete(
  '/goals/:id',
  asyncHandler(async (req, res) => {
    await goals.deleteGoal(req.params.id);
    ok(res, { deleted: true });
  }),
);
spiritRouter.post(
  '/goals/:id/log',
  validateBody(z.object({ value: z.number(), notes: z.string().optional(), date: z.string().optional() })),
  asyncHandler(async (req, res) => ok(res, await goals.logProgress(req.params.id, req.body))),
);
spiritRouter.get(
  '/goals/:id/logs',
  asyncHandler(async (req, res) => ok(res, await goals.goalLogs(req.params.id))),
);
spiritRouter.patch(
  '/goals/:id/complete',
  asyncHandler(async (req, res) => ok(res, await goals.completeGoal(req.params.id))),
);
spiritRouter.patch(
  '/goals/:id/archive',
  asyncHandler(async (req, res) => ok(res, await goals.archiveGoal(req.params.id))),
);

// ─── Quests + Streaks (gamification) ────────────────────────
spiritRouter.get('/quests/today', asyncHandler(async (_req, res) => ok(res, await quests.todayQuests())));
spiritRouter.post(
  '/quests/:id/claim',
  asyncHandler(async (req, res) => ok(res, await quests.claimQuest(req.params.id))),
);
spiritRouter.get('/streaks', asyncHandler(async (_req, res) => ok(res, await streaks.allSpiritStreaks())));

// ─── Chakra rank ────────────────────────────────────────────
spiritRouter.get('/rank', asyncHandler(async (_req, res) => ok(res, await svc.getSpiritRank())));
