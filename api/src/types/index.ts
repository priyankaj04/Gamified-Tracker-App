export type Module = 'dojo' | 'forge' | 'spirit' | 'vault' | 'quests';

export type WorkoutType = 'Strength' | 'Cardio' | 'Flexibility' | 'Combat';
export type ProjectStatus = 'Backlog' | 'In Progress' | 'Shipped';
export type Priority = 'S' | 'A' | 'B' | 'C';
export type TxType = 'Income' | 'Expense';
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface ApiOk<T> {
  data: T;
  error: null;
}
export interface ApiErr {
  data: null;
  error: string;
}
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export interface XpAwardResult {
  xpEarned: number;
  newTotalXp: number;
  streakUpdated?: boolean;
  streakCount?: number;
  badgesUnlocked?: { id: string; name: string; xpReward: number; rarity: Rarity }[];
}
