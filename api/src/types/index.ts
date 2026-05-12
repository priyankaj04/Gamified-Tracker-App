export type Module = 'dojo' | 'forge' | 'spirit' | 'vault' | 'quests' | 'dsa' | 'learning';

export type WorkoutType = 'Strength' | 'Cardio' | 'Flexibility' | 'Combat';
export type ProjectStatus = 'Idea' | 'Backlog' | 'In Progress' | 'Review' | 'Shipped' | 'Archived';
export type ProjectType = 'Personal' | 'Freelance' | 'Open Source' | 'Learning' | 'Work';
export type Priority = 'S' | 'A' | 'B' | 'C';
export type SessionMood = 'Deep Focus' | 'Normal' | 'Distracted' | 'Blocked' | 'Flow State';
export type LearningType = 'Course' | 'Book' | 'Tutorial' | 'Video' | 'Documentation' | 'Paper';
export type LearningStatus = 'Not Started' | 'In Progress' | 'Completed';
export type Proficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type SkillCategory = 'Frontend' | 'Backend' | 'Mobile' | 'ML/AI' | 'DevOps' | 'Database' | 'CS Fundamentals' | 'Other';
export type SnippetCategory = 'Bug Fix' | 'Algorithm' | 'Config' | 'Reference' | 'Template';
export type DeployEnvironment = 'development' | 'staging' | 'production';
export type IssueSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type IssueStatus = 'Open' | 'In Progress' | 'Fixed' | 'Wont Fix';
export type DsaPlatform = 'LeetCode' | 'HackerRank' | 'Codeforces' | 'GeeksForGeeks' | 'Custom';
export type DsaDifficulty = 'Easy' | 'Medium' | 'Hard';
export type DsaTopic =
  | 'Arrays' | 'Strings' | 'Linked Lists' | 'Trees' | 'Graphs'
  | 'Dynamic Programming' | 'Backtracking' | 'Sorting'
  | 'Binary Search' | 'Stacks & Queues' | 'Heaps'
  | 'Tries' | 'Greedy' | 'Math' | 'Bit Manipulation' | 'Other';
export type DsaStatus = 'Solved' | 'Attempted' | 'Revisit';
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
