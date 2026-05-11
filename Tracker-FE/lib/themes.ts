export const palette = {
  // bg stays opaque as a fallback if no scene wraps the screen
  bg: '#070710',
  // bgElevated stays solid for tab bar / modal headers
  bgElevated: '#0d0d18',
  // Cards sit on top of vivid themed backgrounds — keep them dark and mostly
  // opaque so foreground content stays legible over any artwork.
  card: 'rgba(10, 10, 18, 0.88)',
  // cardAlt is a lighter pane used for accents (chips, set rows, etc.)
  cardAlt: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.22)',
  text: '#f5f5fa',
  textMuted: '#c9c9d8',
  textDim: '#8a8aa0',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#ef4444',
};

// Glass tokens — use these for variants beyond the default card
export const glass = {
  white: 'rgba(255, 255, 255, 0.10)',
  whiteStrong: 'rgba(255, 255, 255, 0.20)',
  black: 'rgba(0, 0, 0, 0.65)',
  blackStrong: 'rgba(0, 0, 0, 0.85)',
  border: 'rgba(255, 255, 255, 0.22)',
  borderStrong: 'rgba(255, 255, 255, 0.36)',
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
    accent: '#16a34a',
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

// Spirit-only text tokens — never use gray inside the Spirit module. All
// supporting text is white at descending opacity so it complements the dark
// green accent without bleeding into busy anime backgrounds.
export const spiritText = {
  primary: '#ffffff',
  secondary: 'rgba(255, 255, 255, 0.78)',
  tertiary: 'rgba(255, 255, 255, 0.58)',
  faint: 'rgba(255, 255, 255, 0.38)',
};

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
