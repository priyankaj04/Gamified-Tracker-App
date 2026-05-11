export interface LevelDef {
  level: number;
  title: string;
  xpRequired: number;
  color: string;
}

export const LEVELS: LevelDef[] = [
  { level: 1, title: 'Academy Student', xpRequired: 0, color: '#94a3b8' },
  { level: 2, title: 'Genin', xpRequired: 300, color: '#4ade80' },
  { level: 3, title: 'Chunin', xpRequired: 800, color: '#22d3ee' },
  { level: 4, title: 'Jonin', xpRequired: 1800, color: '#818cf8' },
  { level: 5, title: 'ANBU', xpRequired: 3500, color: '#f472b6' },
  { level: 6, title: 'Kage', xpRequired: 7000, color: '#fbbf24' },
  { level: 7, title: 'Tailed Beast', xpRequired: 14000, color: '#f97316' },
  { level: 8, title: 'Sage Mode', xpRequired: 28000, color: '#a78bfa' },
  { level: 9, title: 'Six Paths', xpRequired: 55000, color: '#ec4899' },
  { level: 10, title: 'Hokage', xpRequired: 100000, color: '#fbbf24' },
];

export const getLevelFromXP = (xp: number): LevelDef =>
  [...LEVELS].reverse().find((l) => xp >= l.xpRequired) ?? LEVELS[0];

export const getXPProgress = (xp: number) => {
  const current = getLevelFromXP(xp);
  const next = LEVELS.find((l) => l.level === current.level + 1);
  if (!next) return { pct: 1, current, next: null, xpInLevel: 0, xpForLevel: 0 };
  const xpInLevel = xp - current.xpRequired;
  const xpForLevel = next.xpRequired - current.xpRequired;
  const pct = xpInLevel / xpForLevel;
  return { pct, current, next, xpInLevel, xpForLevel };
};
