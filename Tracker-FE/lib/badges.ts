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
  // Dojo
  { id: 'first-blood',    name: 'First Blood',    rarity: 'Common',    module: 'dojo',   description: 'Log your first workout',           xpReward: 50 },
  { id: 'three-days',     name: 'Burning Start',  rarity: 'Common',    module: 'dojo',   description: '3-day workout streak',             xpReward: 100 },
  { id: 'iron-will',      name: 'Iron Will',      rarity: 'Rare',      module: 'dojo',   description: '7-day workout streak',             xpReward: 250 },
  { id: 'pr-collector',   name: 'PR Collector',   rarity: 'Rare',      module: 'dojo',   description: 'Set 5 personal records',           xpReward: 300 },
  { id: 'demon-slayer',   name: 'Demon Slayer',   rarity: 'Epic',      module: 'dojo',   description: '30-day workout streak',            xpReward: 750 },
  { id: 'century',        name: 'Century',        rarity: 'Epic',      module: 'dojo',   description: 'Log 100 workouts',                 xpReward: 1000 },
  { id: 'ultra-instinct', name: 'Ultra Instinct', rarity: 'Legendary', module: 'dojo',   description: '365 total workout sessions',       xpReward: 3000 },

  // Forge
  { id: 'hello-world',    name: 'Hello World',    rarity: 'Common',    module: 'forge',  description: 'Create your first project',        xpReward: 50 },
  { id: 'first-session',  name: 'In The Zone',    rarity: 'Common',    module: 'forge',  description: 'Log your first coding session',    xpReward: 50 },
  { id: 'ghost-protocol', name: 'Ghost Protocol', rarity: 'Rare',      module: 'forge',  description: '7-day coding streak',              xpReward: 250 },
  { id: 'full-dive',      name: 'Full Dive',      rarity: 'Rare',      module: 'forge',  description: 'Complete 3 projects (Shipped)',    xpReward: 300 },
  { id: 'hundred-hours',  name: '100 Hours',      rarity: 'Epic',      module: 'forge',  description: '100 total hours of coding logged', xpReward: 750 },
  { id: 'system-admin',   name: 'System Admin',   rarity: 'Legendary', module: 'forge',  description: '50 coding sessions logged',        xpReward: 2000 },

  // Spirit
  { id: 'first-weigh-in', name: 'First Weigh-In', rarity: 'Common',    module: 'spirit', description: 'Log your first weight entry',      xpReward: 50 },
  { id: 'consistent',     name: 'Consistent',     rarity: 'Rare',      module: 'spirit', description: 'Log weight 7 days in a row',       xpReward: 250 },
  { id: 'chakra-control', name: 'Chakra Control', rarity: 'Epic',      module: 'spirit', description: 'Hit your body goal',               xpReward: 1000 },
  { id: 'transformation', name: 'Transformation', rarity: 'Legendary', module: 'spirit', description: 'Reach target weight 30+ days logged', xpReward: 3000 },

  // Vault
  { id: 'ryo-earned',     name: 'Ryo Earned',     rarity: 'Common',    module: 'vault',  description: 'Log your first transaction',       xpReward: 50 },
  { id: 'budget-master',  name: 'Budget Master',  rarity: 'Rare',      module: 'vault',  description: 'Stay under budget for a month',    xpReward: 300 },
  { id: 'loid-forger',    name: 'Loid Forger',    rarity: 'Legendary', module: 'vault',  description: 'Hit a savings goal of ₹1,00,000',  xpReward: 2500 },

  // Quests
  { id: 'novice-hunter',  name: 'Novice Hunter',  rarity: 'Common',    module: 'quests', description: 'Complete your first quest',        xpReward: 50 },
  { id: 'hunter-exam',    name: 'Hunter Exam',    rarity: 'Rare',      module: 'quests', description: 'Complete 20 quests',               xpReward: 250 },
  { id: 'greed-island',   name: 'Greed Island',   rarity: 'Epic',      module: 'quests', description: 'Complete 50 quests',               xpReward: 750 },
  { id: 's-rank',         name: 'S-Rank Hunter',  rarity: 'Legendary', module: 'quests', description: 'Complete 10 S-Rank quests',        xpReward: 2000 },

  // Global
  { id: 'all-rounder',    name: 'All Rounder',    rarity: 'Epic',      module: 'global', description: 'Use all 5 modules in one day',     xpReward: 500 },
  { id: 'the-one',        name: 'The One',        rarity: 'Legendary', module: 'global', description: 'Reach Level 10: Hokage',           xpReward: 5000 },
  { id: 'week-warrior',   name: 'Week Warrior',   rarity: 'Rare',      module: 'global', description: '7-day streak in any module',       xpReward: 300 },
];
