export type Module = 'dojo' | 'forge' | 'spirit' | 'vault' | 'quests' | 'dsa' | 'learning';

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

export type ProjectStatus =
  | 'Idea'
  | 'Backlog'
  | 'In Progress'
  | 'Review'
  | 'Shipped'
  | 'Archived';
export type ProjectType = 'Personal' | 'Freelance' | 'Open Source' | 'Learning' | 'Work';

export type Priority = 'S' | 'A' | 'B' | 'C';

export type SessionMood = 'Deep Focus' | 'Normal' | 'Distracted' | 'Blocked' | 'Flow State';
export type LearningType = 'Course' | 'Book' | 'Tutorial' | 'Video' | 'Documentation' | 'Paper';
export type LearningStatus = 'Not Started' | 'In Progress' | 'Completed';
export type Proficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type SkillCategory =
  | 'Frontend'
  | 'Backend'
  | 'Mobile'
  | 'ML/AI'
  | 'DevOps'
  | 'Database'
  | 'CS Fundamentals'
  | 'Other';
export type SnippetCategory = 'Bug Fix' | 'Algorithm' | 'Config' | 'Reference' | 'Template';
export type DeployEnvironment = 'development' | 'staging' | 'production';
export type IssueSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type IssueStatus = 'Open' | 'In Progress' | 'Fixed' | 'Wont Fix';
export type DsaPlatform = 'LeetCode' | 'HackerRank' | 'Codeforces' | 'GeeksForGeeks' | 'Custom';
export type DsaDifficulty = 'Easy' | 'Medium' | 'Hard';
export type DsaTopic =
  | 'Arrays'
  | 'Strings'
  | 'Linked Lists'
  | 'Trees'
  | 'Graphs'
  | 'Dynamic Programming'
  | 'Backtracking'
  | 'Sorting'
  | 'Binary Search'
  | 'Stacks & Queues'
  | 'Heaps'
  | 'Tries'
  | 'Greedy'
  | 'Math'
  | 'Bit Manipulation'
  | 'Other';
export type DsaStatus = 'Solved' | 'Attempted' | 'Revisit';

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
  streaks: Partial<Record<Module, Streak>>;
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

export interface Subtask {
  id: string;
  milestoneId: string;
  title: string;
  priority: Priority;
  estimatedHours: number | null;
  completed: boolean;
  completedAt: string | null;
  orderIndex: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  targetDate: string | null;
  completed: boolean;
  completedAt: string | null;
  orderIndex: number;
  notes: string | null;
  xpEarned: number;
  isOverdue?: boolean;
  subtasks?: Subtask[];
  subtaskCount?: number;
  subtaskCompleteCount?: number;
}

export interface Deployment {
  id: string;
  projectId: string;
  version: string | null;
  environment: DeployEnvironment;
  deployedAt: string;
  releaseNotes: string | null;
  deployUrl: string | null;
  createdAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  type: ProjectType;
  priority: Priority;
  techStack: string[];
  coverEmoji: string;
  coverColor: string;
  isPinned: boolean;
  isArchived: boolean;
  readmeNotes: string | null;
  startDate: string | null;
  targetShipDate: string | null;
  shippedDate: string | null;
  estimatedHours: number | null;
  githubUrl: string | null;
  demoUrl: string | null;
  figmaUrl: string | null;
  docsUrl: string | null;
  isPortfolio: boolean;
  status: ProjectStatus;
  stars: number | null;
  totalHours: number;
  githubData: Record<string, unknown> | null;
  githubSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  milestoneCompletionPct?: number;
  openIssueCount?: number;
  lastSessionDate?: string | null;
  milestones?: Milestone[];
  recentSessions?: CodingSession[];
  deployments?: Deployment[];
}

export interface CodingSession {
  id: string;
  projectId: string | null;
  projectName?: string | null;
  milestoneId?: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
  mood: SessionMood | null;
  stars: number | null;
  notes: string | null;
  isBillable: boolean;
  pomodoroCount: number;
  xpEarned: number;
  tags?: string[];
  createdAt: string;
}

export interface ActiveTimer {
  id: string;
  projectId: string | null;
  projectName: string | null;
  milestoneId: string | null;
  startedAt: string;
  elapsedSec: number;
  isRunning: boolean;
  isPomodoro: boolean;
}

export interface LearningItem {
  id: string;
  title: string;
  type: LearningType;
  platform: string | null;
  sourceUrl: string | null;
  topics: string[];
  status: LearningStatus;
  progressPct: number;
  rating: number | null;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  xpEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface TechSkill {
  id: string;
  name: string;
  category: SkillCategory;
  proficiency: Proficiency;
  totalHours: number;
  projectCount: number;
  firstUsed: string | null;
  lastUsed: string | null;
  updatedAt: string;
}

export interface Snippet {
  id: string;
  projectId: string | null;
  title: string;
  language: string;
  content: string;
  category: SnippetCategory;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  severity: IssueSeverity;
  status: IssueStatus;
  foundDate: string;
  fixedDate: string | null;
  sessionId: string | null;
  daysOpen: number;
  createdAt: string;
  updatedAt: string;
}

export interface DsaProblem {
  id: string;
  title: string;
  platform: DsaPlatform;
  difficulty: DsaDifficulty;
  topic: DsaTopic;
  status: DsaStatus;
  timeTakenMin: number | null;
  date: string;
  problemUrl: string | null;
  notes: string | null;
  solutionNotes: string | null;
  xpEarned: number;
  createdAt: string;
}

export interface StandupLog {
  id: string;
  date: string;
  yesterday: string | null;
  today: string | null;
  blockers: string | null;
  projectId: string | null;
  createdAt: string;
}

export interface ForgeSettings {
  id: string;
  dailyCodingGoalMin: number;
  defaultSessionMin: number;
  pomodoroWorkMin: number;
  pomodoroBreakMin: number;
  githubUsername: string | null;
  workStartHour: number;
  workEndHour: number;
  weekStartDay: number;
  billableRate: number | null;
  billableCurrency: string;
  weeklyDsaGoal: number;
  updatedAt: string;
}

export interface ForgeStats {
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  allTimeHours: number;
  totalSessions: number;
  avgSessionMinutes: number;
  mostProductiveDayOfWeek: string;
  mostProductiveHourOfDay: number;
  codingConsistency30d: number;
  codingConsistency90d: number;
  personalBests: {
    longestSession: number;
    mostHoursInDay: number;
    currentStreak: number;
    longestStreak: number;
  };
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

export type AccountType = 'Cash' | 'Bank' | 'Credit Card' | 'UPI Wallet' | 'Investment' | 'Other';
export type DebtType = 'Loan' | 'Credit Card' | 'Personal' | 'Mortgage' | 'Other';
export type InvestmentType = 'Stock' | 'MF' | 'FD' | 'Gold' | 'Crypto' | 'Bond' | 'Other';
export type InvestmentAction = 'Buy' | 'Sell' | 'SIP' | 'Dividend' | 'Interest';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ChallengePeriod = 'weekly' | 'monthly' | 'oneshot';

export interface VaultTag {
  id: string;
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TxType;
  category: string;
  description: string | null;
  accountId: string | null;
  recurringId: string | null;
  merchant: string | null;
  receiptUrl: string | null;
  currency: string;
  loggedAt: string | null;
  tags?: VaultTag[];
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
  spendVelocity?: number;
  daysIntoMonth?: number;
  daysInMonth?: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  balance?: number;
  currency: string;
  color: string;
  icon: string | null;
  includeInNetWorth: boolean;
  archived: boolean;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  color: string;
  completed: boolean;
  completedAt: string | null;
  archived: boolean;
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  type: DebtType | string;
  principal: number;
  balance: number;
  interestRate: number | null;
  emi: number | null;
  startDate: string | null;
  endDate: string | null;
  dueDay: number | null;
  cleared: boolean;
  clearedAt: string | null;
  createdAt: string;
}

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType | string;
  symbol: string | null;
  quantity: number;
  costBasis: number;
  currentValue: number;
  firstBoughtOn: string | null;
  platform: string | null;
  notes: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: TxType;
  category: string;
  frequency: RecurringFrequency;
  interval: number;
  nextDue: string;
  startDate: string;
  endDate: string | null;
  accountId: string | null;
  description: string | null;
  isSubscription: boolean;
  cancelled: boolean;
  cancelledAt: string | null;
  paused: boolean;
  createdAt: string;
}

export interface NetWorthSnapshot {
  id: string;
  date: string;
  assets: number;
  liabilities: number;
  netWorth: number;
  notes: string | null;
  createdAt: string;
}

export interface VaultChallenge {
  id: string;
  key: string;
  title: string;
  description: string;
  period: ChallengePeriod;
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
  completedAt: string | null;
  startsOn: string;
  endsOn: string;
}

export interface VaultStats {
  spendingTrend: { label: string; value: number; month: string }[];
  incomeVsExpense: { month: string; income: number; expense: number }[];
  byCategory: { label: string; value: number }[];
  topMerchants: { label: string; value: number }[];
  topExpenses: { id: string; date: string; amount: number; category: string; description: string | null; merchant: string | null }[];
  dayOfWeek: { label: string; value: number }[];
  timeOfDay: { morning: number; afternoon: number; evening: number; night: number };
  savingsRate: { month: string; rate: number }[];
  burnRate: number;
  activityGrid: { date: string; value: number }[];
  tagSpend: { id: string; name: string; color: string; amount: number }[];
  frugalDaysThisMonth: number;
}

export interface SubscriptionsSummary {
  subscriptions: RecurringTransaction[];
  monthlyTotal: number;
}

export interface VaultGame {
  vaultXp: number;
  title: string;
  rank: { key: string; title: string; min: number; color: string };
  nextRank: { key: string; title: string; min: number; color: string } | null;
  progressPct: number;
  toNext: number;
  streak: { count: number; longestStreak: number; lastActivityDate: string | null };
}

export interface ModuleRankInfo {
  rank: { key: string; title: string; min: number; color: string };
  nextRank: { key: string; title: string; min: number; color: string } | null;
  score: number;
  progressPct: number;
  toNext: number;
}

export interface DojoRank extends ModuleRankInfo {
  workoutCount: number;
  prCount: number;
}

export interface ForgeRank extends ModuleRankInfo {
  sessionCount: number;
  shippedCount: number;
}

export interface SpiritRank extends ModuleRankInfo {
  weightCount: number;
  sleepCount: number;
  wellnessCount: number;
  habitCount: number;
  fastCount: number;
  stepGoalDays: number;
}

export interface VaultSettings {
  roundUpEnabled: boolean;
  roundUpTo: number;
  roundUpGoalId: string | null;
  calculatorUsed: boolean;
  annualReportExported: boolean;
  weeklyReportStreak: number;
  weeklyReportLastSeen: string | null;
}

export interface VaultTemplate {
  id: string;
  name: string;
  amount: number;
  type: TxType;
  category: string;
  description: string | null;
  emoji: string | null;
  useCount: number;
}

export type QuestDifficulty = 'Trivial' | 'Normal' | 'Hard' | 'Boss';

export type Recurrence =
  | { kind: 'daily' }
  | { kind: 'weekly'; daysOfWeek: number[] }
  | { kind: 'monthly'; dayOfMonth: number }
  | null;

export interface QuestStep {
  id: string;
  questId: string;
  label: string;
  done: boolean;
  doneAt: string | null;
  orderIndex: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  difficulty: QuestDifficulty | null;
  isDaily: boolean;
  isBoss: boolean;
  completed: boolean;
  completedAt: string | null;
  dueDate: string | null;
  remindAt: string | null;
  stars: number | null;
  notes: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  xpEarned: number;
  displayOrder: number;
  parentQuestId: string | null;
  recurrence: Recurrence;
  lastRolloverDate: string | null;
  archivedAt: string | null;
  templateId: string | null;
  linkedModule: string | null;
  linkedModuleId: string | null;
  createdAt: string;
  tags: Tag[];
  steps?: QuestStep[];
  stepCount?: number;
  stepDoneCount?: number;
}

export interface QuestTemplate {
  id: string;
  name: string;
  title: string;
  priority: Priority;
  difficulty: QuestDifficulty | null;
  isDaily: boolean;
  isBoss: boolean;
  recurrence: Recurrence;
  estimatedMinutes: number | null;
  notes: string | null;
  tagIds: string[];
  stepLabels: string[];
  useCount: number;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface QuestActiveTimer {
  id: string;
  questId: string;
  startedAt: string;
  elapsedSec: number;
  isRunning: boolean;
}

export interface QuestRank {
  rank: { key: string; title: string; min: number; color: string };
  nextRank: { key: string; title: string; min: number; color: string } | null;
  completedCount: number;
  sRankCount: number;
  progressPct: number;
  toNext: number;
}

export interface QuestCombo {
  count: number;
  comboActive: boolean;
  windowEndsAt: string | null;
}

export interface QuestSettings {
  id: string;
  defaultPriority: Priority;
  defaultTab: string;
  autoArchiveDays: number;
  reminderOffsetMinutes: number;
  soundsEnabled: boolean;
  comboEnabled: boolean;
  penaltyEnabled: boolean;
}

export interface QuestChallenge {
  id: string;
  key: string;
  title: string;
  description: string | null;
  period: 'weekly' | 'monthly';
  target: number;
  progress: number;
  completed: boolean;
  completedAt: string | null;
  xpReward: number;
  startsOn: string;
  endsOn: string;
}

export interface QuestTodaysHunt {
  items: Quest[];
  perfectDayProgress: { total: number; done: number };
}

export interface QuestInsights {
  heatmap: { date: string; value: number }[];
  priorityMix: { label: string; value: number }[];
  xpTrend: { date: string; value: number }[];
  tagRates: { id: string; name: string; color: string; completed: number; created: number; rate: number }[];
  hourMap: number[][];
  accuracy: { estimated: number; actual: number }[];
  weeklyReview: {
    totalCompleted: number;
    totalXp: number;
    sRankCompleted: number;
    topTag: { id: string; name: string; color: string; completed: number; created: number; rate: number } | null;
  };
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
