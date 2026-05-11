export const palette = {
  // bg stays opaque as a fallback if no scene wraps the screen
  bg: '#070710',
  // bgElevated stays solid for tab bar / modal headers
  bgElevated: '#0d0d18',
  // card surfaces are now translucent glass that floats over the themed image.
  // Dark glass: image still bleeds through subtly, content stays legible.
  card: 'rgba(8, 8, 16, 0.62)',
  // cardAlt is a lighter pane used for accents (chips, set rows, etc.)
  cardAlt: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.16)',
  text: '#f5f5fa',
  textMuted: '#c9c9d8',
  textDim: '#8a8aa0',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#ef4444',
};

// Glass tokens — use these for variants beyond the default card
export const glass = {
  white: 'rgba(255, 255, 255, 0.08)',
  whiteStrong: 'rgba(255, 255, 255, 0.16)',
  black: 'rgba(0, 0, 0, 0.55)',
  blackStrong: 'rgba(0, 0, 0, 0.78)',
  border: 'rgba(255, 255, 255, 0.16)',
  borderStrong: 'rgba(255, 255, 255, 0.30)',
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
