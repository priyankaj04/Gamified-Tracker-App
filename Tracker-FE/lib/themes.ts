export const palette = {
  bg: '#0b0b14',
  bgElevated: '#13131f',
  card: '#1a1a2a',
  cardAlt: '#22223a',
  border: '#2a2a44',
  text: '#f5f5fa',
  textMuted: '#a3a3b8',
  textDim: '#6e6e85',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#ef4444',
};

export const screenTheme = {
  dashboard: {
    accent: '#a78bfa',
    accent2: '#7c3aed',
    label: 'Dashboard',
  },
  dojo: {
    accent: '#f97316',
    accent2: '#ef4444',
    label: 'Dojo',
  },
  forge: {
    accent: '#22d3ee',
    accent2: '#818cf8',
    label: 'Forge',
  },
  spirit: {
    accent: '#4ade80',
    accent2: '#fbbf24',
    label: 'Spirit',
  },
  vault: {
    accent: '#fbbf24',
    accent2: '#a3e635',
    label: 'Vault',
  },
  quests: {
    accent: '#e879f9',
    accent2: '#38bdf8',
    label: 'Quests',
  },
  hall: {
    accent: '#a78bfa',
    accent2: '#22d3ee',
    label: 'Hall of Power',
  },
} as const;

export type ScreenKey = keyof typeof screenTheme;

export const rarityColor = {
  Common: '#94a3b8',
  Rare: '#22d3ee',
  Epic: '#a78bfa',
  Legendary: '#fbbf24',
} as const;

export const priorityColor = {
  S: '#ef4444',
  A: '#f97316',
  B: '#22d3ee',
  C: '#94a3b8',
} as const;
