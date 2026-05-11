export type Module = 'dojo' | 'forge' | 'spirit' | 'vault' | 'quests';

export type WorkoutType = 'Strength' | 'Cardio' | 'Flexibility' | 'Combat';

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
  isPr?: boolean;
  orderIndex?: number;
}

export interface WorkoutExercise {
  id?: string;
  name: string;
  orderIndex?: number;
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
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  bicepsCm: number | null;
  thighsCm: number | null;
  notes: string | null;
  xpEarned: number;
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
