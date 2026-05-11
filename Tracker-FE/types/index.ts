export type Module = 'dojo' | 'forge' | 'spirit' | 'vault' | 'quests';

export type WorkoutType =
  | 'Strength'
  | 'Cardio'
  | 'Flexibility'
  | 'Combat'
  | 'Mixed'
  | 'Plyometrics'
  | 'Calisthenics'
  | 'Sports'
  | 'HIIT'
  | 'Mobility';

export type SetType = 'Normal' | 'Warmup' | 'DropSet' | 'Failure' | 'AMRAP';

export type MoodTag = 'CrushedIt' | 'Solid' | 'Average' | 'Rough' | 'Struggled';

export type ExerciseType = 'compound' | 'isolation' | 'cardio';

export interface Exercise {
  id: string;
  name: string;
  musclePrimary: string;
  muscleSecondary: string[];
  equipment: string;
  exerciseType: ExerciseType;
  isCustom: boolean;
  isFavorite: boolean;
  notes: string | null;
}

export interface TemplateSet {
  id?: string;
  setType?: SetType;
  targetReps?: number | null;
  targetWeightKg?: number | null;
  targetDurationSeconds?: number | null;
  orderIndex?: number;
}

export interface TemplateExercise {
  id?: string;
  exerciseId: string;
  exerciseName?: string;
  musclePrimary?: string;
  equipment?: string;
  supersetGroupId?: string | null;
  orderIndex?: number;
  notes?: string | null;
  sets: TemplateSet[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  type: WorkoutType;
  estimatedMinutes: number;
  notes: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  exercises: TemplateExercise[];
}

export type ProjectStatus = 'Backlog' | 'In Progress' | 'Shipped';

export type Priority = 'S' | 'A' | 'B' | 'C';

export type TxType = 'Income' | 'Expense';

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface Streak {
  count: number;
  longestStreak: number;
  lastActivityDate: string | null;
}

export interface GameState {
  totalXp: number;
  level: number;
  levelTitle: string;
  xpToNextLevel: number;
  xpProgress: number;
  streaks: Record<Module, Streak>;
}

export interface ExerciseSet {
  id?: string;
  reps?: number | null;
  weightKg?: number | null;
  durationSeconds?: number | null;
  setType?: SetType;
  isPr?: boolean;
  orderIndex?: number;
}

export interface WorkoutExercise {
  id?: string;
  exerciseId?: string | null;
  name: string;
  supersetGroupId?: string | null;
  orderIndex?: number;
  notes?: string | null;
  sets: ExerciseSet[];
}

export interface Workout {
  id: string;
  name: string;
  type: WorkoutType;
  date: string;
  durationMinutes: number | null;
  stars: number | null;
  notes: string | null;
  xpEarned: number;
  createdAt: string;
  exercises?: WorkoutExercise[];
}

export interface WorkoutSummary {
  id: string;
  name: string;
  type: WorkoutType;
  date: string;
  durationMinutes: number | null;
  stars: number | null;
  xpEarned: number;
}

export interface PersonalRecord {
  id: string;
  exerciseName: string;
  bestWeightKg: number | null;
  bestReps: number | null;
  achievedAt: string;
  workoutId: string | null;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
  orderIndex: number;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  techStack: string[];
  githubUrl: string | null;
  status: ProjectStatus;
  stars: number | null;
  totalHours: number;
  createdAt: string;
  updatedAt: string;
  milestones?: Milestone[];
  recentSessions?: CodingSession[];
}

export interface CodingSession {
  id: string;
  projectId: string | null;
  date: string;
  durationMinutes: number;
  notes: string | null;
  stars: number | null;
  xpEarned: number;
  createdAt: string;
  projectName?: string | null;
}

export interface BodyGoal {
  id: string;
  startWeightKg: number;
  targetWeightKg: number;
  startDate: string;
  targetDate: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPct: number | null;
  bmi?: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  bicepsCm: number | null;
  thighsCm: number | null;
  notes: string | null;
  xpEarned: number;
}

// ─── Spirit module: profile / measurements / composition ─────
export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface UserProfile {
  id: string;
  heightCm: number | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  activityLevel: ActivityLevel | null;
}

export interface WeightStats {
  startWeight: number | null;
  currentWeight: number | null;
  bestWeight: number | null;
  highestWeight: number | null;
  totalChange: number;
  totalChangePct: number;
  weeklyAverage: number | null;
  projectedCompletionDate: string | null;
  bmi: number | null;
  bmiCategory: string | null;
  idealRange: { minKg: number; maxKg: number } | null;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  bicepsCm: number | null;
  thighsCm: number | null;
  neckCm: number | null;
  shouldersCm: number | null;
  calvesCm: number | null;
  forearmsCm: number | null;
  notes: string | null;
}

export interface MeasurementsStats {
  totalLost: Record<string, number>;
  waistToHipRatio: number | null;
  waistToHipCategory: string | null;
  trend: Record<string, 'up' | 'down' | 'flat'>;
}

export interface CompositionEntry {
  date: string;
  weight: number;
  bodyFatPct: number;
  leanMassKg: number;
  fatMassKg: number;
}

export interface CompositionStats {
  currentBodyFatPct: number | null;
  category: string | null;
  leanMassKg: number | null;
  fatMassKg: number | null;
  recomposition: { leanUp: boolean; fatDown: boolean } | null;
}

// ─── Nutrition ───────────────────────────────────────────────
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface NutritionGoals {
  id: string;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatsG: number | null;
  waterMl: number;
}

export interface MealLog {
  id: string;
  date: string;
  mealType: MealType;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  quantityG: number | null;
  foodId: string | null;
  xpEarned: number;
}

export interface NutritionSummary {
  date: string;
  meals: MealLog[];
  caloriesConsumed: number;
  caloriesGoal: number | null;
  deficit: number | null;
  proteinConsumed: number;
  proteinGoal: number | null;
  carbsConsumed: number;
  carbsGoal: number | null;
  fatsConsumed: number;
  fatsGoal: number | null;
  waterMl: number;
  waterGoal: number;
}

export interface FoodItem {
  id: string;
  name: string;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatsPer100g: number | null;
  isCustom: boolean;
}

export interface TDEEResult {
  bmr: number;
  tdee: number;
  cuttingCalories: number;
  bulkingCalories: number;
  maintenanceCalories: number;
}

// ─── Sleep ───────────────────────────────────────────────────
export interface SleepLog {
  id: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  durationHours: number | null;
  quality: number | null;
  notes: string | null;
  xpEarned: number;
}

export interface SleepGoal {
  id: string | null;
  targetHours: number;
}

export interface SleepStats {
  avgDuration7d: number | null;
  avgQuality7d: number | null;
  sleepDebt7d: number;
  currentStreak: number;
  longestStreak: number;
  totalLogged: number;
  bestNight: number | null;
  worstNight: number | null;
  goalHours: number;
}

// ─── Habits ──────────────────────────────────────────────────
export type HabitFrequency = 'daily' | 'weekdays' | 'custom';
export type RoutineSlot = 'morning' | 'evening' | 'anytime';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  frequency: HabitFrequency;
  customDays: number[] | null;
  routineSlot: RoutineSlot;
  xpPerCompletion: number;
  isActive: boolean;
  orderIndex: number;
  completedToday?: boolean;
}

export interface HabitBundle {
  id: string;
  name: string;
  bonusXp: number;
  habitIds: string[];
}

export interface HabitHistoryCell {
  date: string;
  completed: boolean;
}

// ─── Daily wellness (energy/mood) ────────────────────────────
export interface DailyWellness {
  id: string;
  date: string;
  energyLevel: number | null;
  mood: number | null;
  stressLevel: number | null;
  notes: string | null;
}

// ─── Fasting ─────────────────────────────────────────────────
export interface FastingSession {
  id: string;
  startTime: string;
  endTime: string | null;
  targetHours: number;
  actualHours: number | null;
  completed: boolean;
  notes: string | null;
  xpEarned: number;
}

export interface FastingStats {
  longestFast: number;
  totalFasts: number;
  completedFasts: number;
  avgFastDuration: number;
  currentStreak: number;
  longestStreak: number;
}

// ─── Cycle ───────────────────────────────────────────────────
export interface CycleSettings {
  id: string | null;
  isEnabled: boolean;
  averageCycleLength: number;
  averagePeriodLength: number;
}

export interface CycleLog {
  id: string;
  startDate: string;
  endDate: string | null;
  cycleLength: number | null;
  notes: string | null;
}

export type CyclePhase = 'Menstrual' | 'Follicular' | 'Ovulation' | 'Luteal';

export interface CycleToday {
  phase: CyclePhase | null;
  day: number | null;
  nextPeriodInDays: number | null;
  cycleStart: string | null;
}

export interface CycleSymptom {
  id: string;
  date: string;
  cramps: number | null;
  bloating: number | null;
  mood: number | null;
  energy: number | null;
  notes: string | null;
}

// ─── Custom goals ────────────────────────────────────────────
export type SpiritGoalType = 'numeric' | 'habit' | 'reduction' | 'milestone';

export interface SpiritGoal {
  id: string;
  title: string;
  type: SpiritGoalType;
  unit: string | null;
  startValue: number | null;
  targetValue: number | null;
  currentValue: number | null;
  startDate: string;
  deadline: string | null;
  completed: boolean;
  completedAt: string | null;
  archived: boolean;
  xpReward: number;
  progressPct: number;
}

export interface GoalLog {
  id: string;
  goalId: string;
  date: string;
  value: number;
  notes: string | null;
}

// ─── Steps ───────────────────────────────────────────────────
export interface StepLog {
  id: string;
  date: string;
  steps: number;
  goal: number;
  goalHit: boolean;
  xpEarned: number;
}

export interface StepsStats {
  totalStepsAllTime: number;
  avgDailySteps7d: number;
  currentStreak: number;
  longestStreak: number;
  daysGoalHit: number;
}

// ─── Wellness composite score ────────────────────────────────
export interface WellnessScore {
  total: number;
  sleep: number;
  nutrition: number;
  habits: number;
  workouts: number;
  weightTrend: number;
  label: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TxType;
  category: string;
  description: string | null;
  xpEarned: number;
}

export interface Budget {
  month: string;
  income: number;
  savingsTarget: number;
  categoryBudgets: Record<string, number>;
}

export interface BudgetActual {
  totalExpenses: number;
  totalIncome: number;
  netSavings: number;
  byCategory: Record<string, number>;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Quest {
  id: string;
  title: string;
  priority: Priority;
  isDaily: boolean;
  completed: boolean;
  completedAt: string | null;
  dueDate: string | null;
  stars: number | null;
  notes: string | null;
  xpEarned: number;
  createdAt: string;
  tags: Tag[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  module: Module | 'global';
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface DailyChallenge {
  id: string;
  challengeKey: string;
  title: string;
  description: string;
  module: Module | 'global';
  progress: number;
  target: number;
  completed: boolean;
  xpReward: number;
  expiresAt: string;
}

export interface GridCell {
  date: string;
  value: number;
  workoutId?: string | null;
  sessionId?: string | null;
}

export interface XpAwardResult {
  xpEarned: number;
  newTotalXp: number;
  streakUpdated?: boolean;
  streakCount?: number;
  badgesUnlocked?: Badge[];
}
