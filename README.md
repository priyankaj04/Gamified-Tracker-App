# KaizenArc 🌀

> A gamified personal goal tracker with anime aesthetics — built for the phone, built to make you show up every day.

Workouts. Coding projects. Body goals. Money. Todos. Every action earns XP, maintains streaks, and unlocks badge cards. Think Notion crossed with a Shounen anime.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture](#architecture)
3. [Repository Structure](#repository-structure)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Gamification System](#gamification-system)
7. [Mobile App — Screens](#mobile-app--screens)
8. [Environment Variables](#environment-variables)
9. [Setup Guide](#setup-guide)
10. [Development Workflow](#development-workflow)

---

## Tech Stack

### Mobile (`/mobile`)
| Layer | Tool |
|---|---|
| Framework | React Native + Expo SDK 52 |
| Navigation | Expo Router v4 (file-based) |
| Styling | NativeWind v4 (Tailwind for RN) |
| State | Zustand + AsyncStorage persistence |
| Server state | TanStack Query v5 |
| Charts | Victory Native XL |
| Animations | React Native Reanimated v3 |
| HTTP client | Axios |
| Icons | `@expo/vector-icons` (Ionicons) |
| Haptics | `expo-haptics` |
| Notifications | `expo-notifications` (streak reminders) |

### API (`/api`)
| Layer | Tool |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express.js v4 |
| Language | TypeScript |
| DB Client | `@supabase/supabase-js` v2 |
| Validation | Zod |
| Dev server | tsx + nodemon |

### Database
| Layer | Tool |
|---|---|
| Provider | Supabase |
| Database | PostgreSQL 15 |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│               Phone (Expo App)               │
│                                             │
│   Expo Router  ──►  Zustand Store           │
│        │                 │                  │
│   TanStack Query  ◄──  AsyncStorage         │
│        │                                    │
└────────┼────────────────────────────────────┘
         │ HTTP (Axios)
         ▼
┌─────────────────────────────────────────────┐
│           Node.js + Express API              │
│                                             │
│   Routes  ──►  Services  ──►  Supabase JS   │
│                    │                        │
│             Gamification Engine             │
│          (XP · Badges · Streaks)            │
└────────────────────┼────────────────────────┘
                     │ Supabase Client
                     ▼
┌─────────────────────────────────────────────┐
│              Supabase (PostgreSQL)           │
│                                             │
│  game_state · workouts · projects           │
│  weight_entries · transactions · quests     │
│  user_badges · daily_challenges · streaks   │
└─────────────────────────────────────────────┘
```

**Data flow for a typical action (e.g., completing a workout):**
1. User taps "Complete Workout" in Expo app
2. App calls `POST /api/workouts` via Axios
3. Express route validates with Zod, calls `WorkoutService`
4. `WorkoutService` inserts into Supabase, then calls `GamificationService`
5. `GamificationService` calculates XP (base + streak multiplier), updates `game_state`, checks badge conditions, updates `streaks`
6. Response returns `{ workout, xpEarned, newTotal, badgesUnlocked, streakUpdated }`
7. TanStack Query invalidates relevant caches
8. Zustand store updates XP display, triggers animation in UI

---

## Repository Structure

```
kaizenArc/
├── mobile/                         # Expo React Native app
│   ├── app/
│   │   ├── _layout.tsx             # Root layout (fonts, providers, tab bar)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx         # Bottom tab navigator
│   │   │   ├── index.tsx           # Dashboard
│   │   │   ├── dojo.tsx            # Workout tracker
│   │   │   ├── forge.tsx           # Coding projects
│   │   │   ├── spirit.tsx          # Body / weight goals
│   │   │   ├── vault.tsx           # Finance tracker
│   │   │   └── quests.tsx          # Todo / quest board
│   │   ├── hall.tsx                # Badges (full screen modal)
│   │   ├── dojo/
│   │   │   ├── new-workout.tsx     # New workout form
│   │   │   └── [id].tsx            # Workout detail
│   │   ├── forge/
│   │   │   ├── new-project.tsx
│   │   │   └── [id].tsx            # Project detail + sessions
│   │   └── settings.tsx
│   ├── components/
│   │   ├── gamification/
│   │   │   ├── XPBar.tsx           # Animated horizontal XP progress bar
│   │   │   ├── LevelBadge.tsx      # Level pill (e.g., "Jonin")
│   │   │   ├── StreakFlame.tsx     # 🔥 N days counter with pulse animation
│   │   │   ├── BadgeCard.tsx       # Collectible card component (locked/unlocked)
│   │   │   ├── ChallengeCard.tsx   # Daily challenge with progress bar
│   │   │   ├── StarRating.tsx      # 1–5 star input / display
│   │   │   └── XPPopup.tsx         # Floating "+50 XP ⚡" animation
│   │   ├── layout/
│   │   │   ├── PageHeader.tsx      # Per-page header with accent color
│   │   │   ├── SectionTitle.tsx
│   │   │   └── EmptyState.tsx      # Beautiful empty state with SVG + message
│   │   ├── ui/
│   │   │   ├── AnimeTag.tsx        # Priority tags (S/A/B/C) + user tags
│   │   │   ├── StatCard.tsx        # Dark card with label + big number + trend
│   │   │   ├── ProgressRing.tsx    # SVG circle progress ring (Reanimated)
│   │   │   ├── GlowButton.tsx      # Primary button with glow shadow
│   │   │   ├── BottomSheet.tsx     # Reusable modal bottom sheet
│   │   │   └── ActivityGrid.tsx    # 90-day GitHub-style contribution grid
│   │   └── charts/
│   │       ├── TrendLine.tsx       # Victory Native line chart wrapper
│   │       └── DonutChart.tsx      # Victory Native pie chart wrapper
│   ├── hooks/
│   │   ├── useGame.ts              # Query + mutation hooks for /api/game
│   │   ├── useWorkouts.ts
│   │   ├── useProjects.ts
│   │   ├── useWeight.ts
│   │   ├── useFinance.ts
│   │   ├── useQuests.ts
│   │   └── useBadges.ts
│   ├── store/
│   │   └── useAppStore.ts          # Zustand: XP display state, theme, UI flags
│   ├── lib/
│   │   ├── api.ts                  # Axios instance (baseURL from env)
│   │   ├── queryClient.ts          # TanStack Query client config
│   │   ├── xp.ts                   # XP value constants
│   │   ├── levels.ts               # Level definitions + helper fns
│   │   ├── badges.ts               # All badge definitions (static)
│   │   └── themes.ts               # Per-screen accent colors + gradients
│   ├── constants/
│   │   └── index.ts                # API_BASE_URL and other app constants
│   ├── types/
│   │   └── index.ts                # All shared TypeScript types
│   ├── app.json
│   ├── babel.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── api/                            # Express.js backend
│   ├── src/
│   │   ├── index.ts                # Server entry point
│   │   ├── routes/
│   │   │   ├── game.ts             # GET /game, PATCH /game/xp, PATCH /game/streak/:module
│   │   │   ├── workouts.ts         # Full CRUD + /grid + /records
│   │   │   ├── projects.ts         # Full CRUD + milestone toggle
│   │   │   ├── sessions.ts         # Coding sessions CRUD + /grid
│   │   │   ├── weight.ts           # Weight entries + body goal
│   │   │   ├── finance.ts          # Transactions + budgets + monthly summary
│   │   │   ├── quests.ts           # Todos CRUD + tags
│   │   │   ├── badges.ts           # Badge list + unlock status
│   │   │   └── challenges.ts       # Daily challenges
│   │   ├── services/
│   │   │   ├── supabase.ts         # Supabase client singleton
│   │   │   ├── gamification.ts     # XP calc, streak logic, badge checking
│   │   │   ├── workouts.ts
│   │   │   ├── projects.ts
│   │   │   ├── weight.ts
│   │   │   ├── finance.ts
│   │   │   └── quests.ts
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts     # Global Express error handler
│   │   │   └── validate.ts         # Zod validation middleware factory
│   │   └── types/
│   │       └── index.ts            # Shared types (mirrors mobile/types)
│   ├── .env
│   ├── tsconfig.json
│   └── package.json
│
├── .gitignore
└── README.md                       # (this file)
```

---

## Database Schema

Run this SQL in your Supabase SQL Editor to set up all tables.

```sql
-- ─────────────────────────────────────────
-- GAMIFICATION
-- ─────────────────────────────────────────

-- Single row. Use upsert on a fixed UUID or just insert once.
CREATE TABLE game_state (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_xp    INTEGER NOT NULL DEFAULT 0,
  level       INTEGER NOT NULL DEFAULT 1,
  level_title TEXT    NOT NULL DEFAULT 'Academy Student',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE streaks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module            TEXT NOT NULL,           -- 'dojo' | 'forge' | 'spirit' | 'vault' | 'quests'
  count             INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  UNIQUE(module)
);

-- Seed: insert one row per module on setup
INSERT INTO streaks (module) VALUES
  ('dojo'), ('forge'), ('spirit'), ('vault'), ('quests');

-- ─────────────────────────────────────────
-- DOJO (WORKOUTS)
-- ─────────────────────────────────────────

CREATE TABLE workouts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT    NOT NULL,
  type             TEXT    NOT NULL CHECK (type IN ('Strength', 'Cardio', 'Flexibility', 'Combat')),
  date             DATE    NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,
  stars            INTEGER CHECK (stars BETWEEN 1 AND 5),
  notes            TEXT,
  xp_earned        INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workout_exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id  UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE exercise_sets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id       UUID    NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  reps              INTEGER,
  weight_kg         DECIMAL(6,2),
  duration_seconds  INTEGER,     -- used for cardio exercises
  is_pr             BOOLEAN NOT NULL DEFAULT FALSE,
  order_index       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE personal_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_name TEXT    NOT NULL UNIQUE,
  best_weight_kg DECIMAL(6,2),
  best_reps     INTEGER,
  achieved_at   DATE,
  workout_id    UUID REFERENCES workouts(id) ON DELETE SET NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FORGE (CODING PROJECTS)
-- ─────────────────────────────────────────

CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT    NOT NULL,
  description TEXT,
  tech_stack  TEXT[]  NOT NULL DEFAULT '{}',
  github_url  TEXT,
  status      TEXT    NOT NULL DEFAULT 'Backlog'
              CHECK (status IN ('Backlog', 'In Progress', 'Shipped')),
  stars       INTEGER CHECK (stars BETWEEN 1 AND 5),
  total_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  order_index  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE coding_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID REFERENCES projects(id) ON DELETE SET NULL,
  date             DATE    NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER NOT NULL,
  notes            TEXT,
  stars            INTEGER CHECK (stars BETWEEN 1 AND 5),
  xp_earned        INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- SPIRIT (BODY / WEIGHT)
-- ─────────────────────────────────────────

CREATE TABLE body_goal (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_weight_kg  DECIMAL(5,2),
  target_weight_kg DECIMAL(5,2),
  start_date       DATE,
  target_date      DATE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE weight_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date          DATE    NOT NULL,
  weight_kg     DECIMAL(5,2) NOT NULL,
  body_fat_pct  DECIMAL(4,1),
  chest_cm      DECIMAL(5,1),
  waist_cm      DECIMAL(5,1),
  hips_cm       DECIMAL(5,1),
  biceps_cm     DECIMAL(5,1),
  thighs_cm     DECIMAL(5,1),
  notes         TEXT,
  xp_earned     INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date)  -- one entry per day
);

-- ─────────────────────────────────────────
-- VAULT (FINANCE)
-- ─────────────────────────────────────────

CREATE TABLE transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE    NOT NULL DEFAULT CURRENT_DATE,
  amount      DECIMAL(12,2) NOT NULL,
  type        TEXT    NOT NULL CHECK (type IN ('Income', 'Expense')),
  category    TEXT    NOT NULL,
  description TEXT,
  xp_earned   INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- category options (stored in code, not enforced by DB):
-- Food | Transport | Entertainment | Health | Shopping | Education | Investment | Other

CREATE TABLE monthly_budgets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month            TEXT    NOT NULL UNIQUE,   -- format: YYYY-MM
  income           DECIMAL(12,2) NOT NULL DEFAULT 0,
  savings_target   DECIMAL(12,2) NOT NULL DEFAULT 0,
  category_budgets JSONB   NOT NULL DEFAULT '{}',
  -- e.g. { "Food": 5000, "Transport": 2000, "Entertainment": 1500 }
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- QUESTS (TODOS)
-- ─────────────────────────────────────────

CREATE TABLE quests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT    NOT NULL,
  priority     TEXT    NOT NULL DEFAULT 'C' CHECK (priority IN ('S', 'A', 'B', 'C')),
  is_daily     BOOLEAN NOT NULL DEFAULT FALSE,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  due_date     DATE,
  stars        INTEGER CHECK (stars BETWEEN 1 AND 5),
  notes        TEXT,
  xp_earned    INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL DEFAULT '#a78bfa',  -- hex color
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quest_tags (
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  tag_id   UUID NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
  PRIMARY KEY (quest_id, tag_id)
);

-- ─────────────────────────────────────────
-- BADGES & CHALLENGES
-- ─────────────────────────────────────────

-- Badge definitions live in code (api/src/lib/badges.ts).
-- This table only stores what's been unlocked + when.
CREATE TABLE user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id    TEXT NOT NULL UNIQUE,   -- matches id in badges.ts
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  xp_awarded  INTEGER NOT NULL DEFAULT 0
);

-- Daily challenges are generated in code (seeded by date).
-- This table tracks today's progress.
CREATE TABLE daily_challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date          DATE    NOT NULL DEFAULT CURRENT_DATE,
  challenge_key TEXT    NOT NULL,
  progress      INTEGER NOT NULL DEFAULT 0,
  target        INTEGER NOT NULL,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  xp_reward     INTEGER NOT NULL,
  UNIQUE(date, challenge_key)
);
```

---

## API Reference

Base URL (local): `http://localhost:3000/api`

All responses follow:
```json
{ "data": ..., "error": null }
{ "data": null, "error": "message" }
```

---

### Game State

#### `GET /api/game`
Returns current XP, level, and all streaks.

**Response:**
```json
{
  "data": {
    "totalXp": 2340,
    "level": 4,
    "levelTitle": "Jonin",
    "xpToNextLevel": 3000,
    "xpProgress": 0.78,
    "streaks": {
      "dojo":   { "count": 5,  "longestStreak": 12, "lastActivityDate": "2026-05-10" },
      "forge":  { "count": 12, "longestStreak": 14, "lastActivityDate": "2026-05-11" },
      "spirit": { "count": 0,  "longestStreak": 3,  "lastActivityDate": "2026-05-08" },
      "vault":  { "count": 2,  "longestStreak": 7,  "lastActivityDate": "2026-05-10" },
      "quests": { "count": 7,  "longestStreak": 7,  "lastActivityDate": "2026-05-11" }
    }
  }
}
```

#### `PATCH /api/game/xp`
Award XP directly (used for manual corrections, not typical flow — XP is usually awarded by service layer).

**Body:** `{ "amount": 100, "source": "manual" }`

#### `PATCH /api/game/streak/:module`
Called after any log action to update the module's streak.

**Params:** `module` — one of `dojo | forge | spirit | vault | quests`

---

### Workouts

#### `GET /api/workouts`
**Query params:** `?page=1&limit=20&from=YYYY-MM-DD&to=YYYY-MM-DD`

**Response `data`:** `{ workouts: WorkoutSummary[], total: number }`

#### `POST /api/workouts`
Creates workout with exercises and sets in one call. Triggers XP + streak + badge check.

**Body:**
```json
{
  "name": "Push Day",
  "type": "Strength",
  "date": "2026-05-11",
  "durationMinutes": 60,
  "stars": 4,
  "notes": "Felt strong today",
  "exercises": [
    {
      "name": "Bench Press",
      "sets": [
        { "reps": 8, "weightKg": 80, "isPr": false },
        { "reps": 6, "weightKg": 85, "isPr": true }
      ]
    },
    {
      "name": "Tricep Dips",
      "sets": [
        { "reps": 12, "weightKg": 0 }
      ]
    }
  ]
}
```

**Response `data`:**
```json
{
  "workout": { ...workoutObject },
  "xpEarned": 75,
  "newTotalXp": 2415,
  "streakUpdated": true,
  "streakCount": 6,
  "badgesUnlocked": [],
  "personalRecordsSet": ["Bench Press"]
}
```

#### `GET /api/workouts/:id`
Returns full workout detail including exercises and sets.

#### `PUT /api/workouts/:id`
Update workout (same body shape as POST, full replace).

#### `DELETE /api/workouts/:id`

#### `GET /api/workouts/grid`
Returns 90-day heatmap data.

**Response `data`:** `{ grid: { date: string; value: number; workoutId: string | null }[] }`
`value` is 0–4 (intensity level based on XP earned that day, used for color mapping).

#### `GET /api/workouts/records`
**Response `data`:** `{ records: PersonalRecord[] }`

---

### Projects

#### `GET /api/projects`
**Query params:** `?status=In+Progress`

#### `POST /api/projects`
```json
{
  "name": "KaizenArc",
  "description": "This very app",
  "techStack": ["React Native", "Express", "Supabase"],
  "githubUrl": "https://github.com/...",
  "milestones": [
    { "title": "DB Schema done" },
    { "title": "API complete" },
    { "title": "Mobile MVP" }
  ]
}
```

#### `GET /api/projects/:id`
Full project with milestones and recent sessions.

#### `PUT /api/projects/:id`
#### `DELETE /api/projects/:id`

#### `PATCH /api/projects/:id/milestones/:milestoneId`
Toggles milestone completed status. Awards XP if completing.

**Body:** `{ "completed": true }`

**Response `data`:** `{ milestone, xpEarned, newTotalXp, badgesUnlocked }`

---

### Coding Sessions

#### `GET /api/sessions`
**Query params:** `?projectId=uuid&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20`

#### `POST /api/sessions`
```json
{
  "projectId": "uuid-or-null",
  "date": "2026-05-11",
  "durationMinutes": 120,
  "notes": "Built the gamification engine",
  "stars": 5
}
```

**Response `data`:** `{ session, xpEarned, newTotalXp, streakUpdated, streakCount, badgesUnlocked }`

#### `DELETE /api/sessions/:id`

#### `GET /api/sessions/grid`
Same shape as `/workouts/grid`.

---

### Weight & Body

#### `GET /api/weight`
**Query params:** `?from=YYYY-MM-DD&to=YYYY-MM-DD`

**Response `data`:** `{ entries: WeightEntry[], goal: BodyGoal | null, progressPct: number }`

#### `POST /api/weight`
```json
{
  "date": "2026-05-11",
  "weightKg": 68.5,
  "bodyFatPct": 18.2,
  "waistCm": 78,
  "notes": "Morning, before breakfast"
}
```

**Response `data`:** `{ entry, xpEarned, newTotalXp, badgesUnlocked }`

#### `PUT /api/weight/:id`
#### `DELETE /api/weight/:id`

#### `GET /api/weight/goal`
#### `PUT /api/weight/goal`
```json
{
  "startWeightKg": 72,
  "targetWeightKg": 65,
  "startDate": "2026-04-01",
  "targetDate": "2026-08-01"
}
```

---

### Finance

#### `GET /api/finance/transactions`
**Query params:** `?month=2026-05&category=Food&type=Expense&page=1&limit=50`

#### `POST /api/finance/transactions`
```json
{
  "date": "2026-05-11",
  "amount": 450,
  "type": "Expense",
  "category": "Food",
  "description": "Lunch at office"
}
```

**Response `data`:** `{ transaction, xpEarned, newTotalXp }`

#### `PUT /api/finance/transactions/:id`
#### `DELETE /api/finance/transactions/:id`

#### `GET /api/finance/budget/:month`
`:month` format: `2026-05`

**Response `data`:**
```json
{
  "budget": {
    "month": "2026-05",
    "income": 80000,
    "savingsTarget": 25000,
    "categoryBudgets": { "Food": 8000, "Transport": 3000 }
  },
  "actual": {
    "totalExpenses": 34200,
    "totalIncome": 80000,
    "netSavings": 45800,
    "byCategory": { "Food": 6200, "Transport": 2100, "Entertainment": 3800 }
  }
}
```

#### `PUT /api/finance/budget/:month`
```json
{
  "income": 80000,
  "savingsTarget": 25000,
  "categoryBudgets": { "Food": 8000, "Transport": 3000, "Entertainment": 2000 }
}
```

---

### Quests

#### `GET /api/quests`
**Query params:** `?completed=false&priority=S&tagId=uuid&daily=true&page=1&limit=50`

**Response `data`:** `{ quests: Quest[], total: number }`
Each quest includes its tags array.

#### `POST /api/quests`
```json
{
  "title": "Finish the gamification service",
  "priority": "S",
  "isDaily": false,
  "dueDate": "2026-05-15",
  "tagIds": ["tag-uuid-1"],
  "notes": "Include XP calc, streak logic, badge checks"
}
```

#### `PUT /api/quests/:id`
Same body as POST.

#### `PATCH /api/quests/:id/complete`
Marks quest complete, awards XP, updates streak, checks badges.

**Body:** `{ "stars": 4 }` (optional quality rating)

**Response `data`:** `{ quest, xpEarned, newTotalXp, streakUpdated, streakCount, badgesUnlocked }`

#### `DELETE /api/quests/:id`

#### `GET /api/quests/tags`
Returns all user-defined tags.

#### `POST /api/quests/tags`
```json
{ "name": "work", "color": "#22d3ee" }
```

#### `DELETE /api/quests/tags/:id`

---

### Badges

#### `GET /api/badges`
Returns all badge definitions merged with unlock status.

**Response `data`:**
```json
{
  "badges": [
    {
      "id": "first-blood",
      "name": "First Blood",
      "description": "Log your first workout",
      "rarity": "Common",
      "module": "dojo",
      "xpReward": 50,
      "unlocked": true,
      "unlockedAt": "2026-04-10T08:22:00Z"
    },
    {
      "id": "ultra-instinct",
      "name": "Ultra Instinct",
      "rarity": "Legendary",
      "module": "dojo",
      "xpReward": 2000,
      "unlocked": false,
      "unlockedAt": null
    }
  ],
  "summary": {
    "total": 30,
    "unlocked": 7,
    "byRarity": { "Common": 4, "Rare": 2, "Epic": 1, "Legendary": 0 }
  }
}
```

---

### Challenges

#### `GET /api/challenges`
Returns today's 3 challenges (auto-generates them if not in DB yet for today).

**Response `data`:**
```json
{
  "challenges": [
    {
      "id": "uuid",
      "challengeKey": "log-workout",
      "title": "Train Hard",
      "description": "Log a workout today",
      "module": "dojo",
      "progress": 0,
      "target": 1,
      "completed": false,
      "xpReward": 100,
      "expiresAt": "2026-05-11T23:59:59Z"
    }
  ]
}
```

#### `PATCH /api/challenges/:id/progress`
Called automatically by services when relevant actions happen.

**Body:** `{ "increment": 1 }`

**Response `data`:** `{ challenge, justCompleted, xpEarned }`

---

## Gamification System

### XP Values

```typescript
// api/src/lib/xp.ts

export const XP = {
  // Dojo
  COMPLETE_WORKOUT:           50,
  LOG_SET:                     5,
  HIT_PERSONAL_RECORD:        100,

  // Forge
  CREATE_PROJECT:              30,
  LOG_CODING_SESSION:          25,
  COMPLETE_MILESTONE:          80,
  SHIP_PROJECT:               150,

  // Spirit
  LOG_WEIGHT:                  15,
  HIT_WEIGHT_GOAL:            200,

  // Vault
  LOG_TRANSACTION:             10,
  STAY_UNDER_BUDGET:           40,  // awarded at month end if under budget
  HIT_SAVINGS_GOAL:           120,

  // Quests
  COMPLETE_TASK_C:             20,
  COMPLETE_TASK_B:             30,
  COMPLETE_TASK_A:             50,
  COMPLETE_TASK_S:             80,
  COMPLETE_ALL_DAILY_TASKS:    75,
} as const

// Streak multiplier — caps at 3× for 40-day streaks
export const streakMultiplier = (days: number) =>
  Math.min(1 + Math.floor(days / 7) * 0.25, 3)

// Final XP = base × streakMultiplier (round to integer)
```

### Level Definitions

```typescript
// api/src/lib/levels.ts

export const LEVELS = [
  { level: 1,  title: 'Academy Student', xpRequired: 0,      color: '#94a3b8' },
  { level: 2,  title: 'Genin',           xpRequired: 300,    color: '#4ade80' },
  { level: 3,  title: 'Chunin',          xpRequired: 800,    color: '#22d3ee' },
  { level: 4,  title: 'Jonin',           xpRequired: 1800,   color: '#818cf8' },
  { level: 5,  title: 'ANBU',            xpRequired: 3500,   color: '#f472b6' },
  { level: 6,  title: 'Kage',            xpRequired: 7000,   color: '#fbbf24' },
  { level: 7,  title: 'Tailed Beast',    xpRequired: 14000,  color: '#f97316' },
  { level: 8,  title: 'Sage Mode',       xpRequired: 28000,  color: '#a78bfa' },
  { level: 9,  title: 'Six Paths',       xpRequired: 55000,  color: '#ec4899' },
  { level: 10, title: 'Hokage',          xpRequired: 100000, color: '#fbbf24' },
]

export const getLevelFromXP = (xp: number) =>
  [...LEVELS].reverse().find(l => xp >= l.xpRequired) ?? LEVELS[0]

export const getXPProgress = (xp: number) => {
  const current = getLevelFromXP(xp)
  const next    = LEVELS.find(l => l.level === current.level + 1)
  if (!next) return { pct: 1, current, next: null }
  const pct = (xp - current.xpRequired) / (next.xpRequired - current.xpRequired)
  return { pct, current, next }
}
```

### Badges — Full Definitions

```typescript
// api/src/lib/badges.ts

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'

export interface BadgeDef {
  id:          string
  name:        string
  description: string
  rarity:      Rarity
  module:      'dojo' | 'forge' | 'spirit' | 'vault' | 'quests' | 'global'
  xpReward:    number
}

export const BADGES: BadgeDef[] = [
  // ── DOJO ──────────────────────────────────────
  { id: 'first-blood',    name: 'First Blood',    rarity: 'Common',    module: 'dojo',   description: 'Log your first workout',           xpReward: 50   },
  { id: 'three-days',     name: 'Burning Start',  rarity: 'Common',    module: 'dojo',   description: '3-day workout streak',             xpReward: 100  },
  { id: 'iron-will',      name: 'Iron Will',      rarity: 'Rare',      module: 'dojo',   description: '7-day workout streak',             xpReward: 250  },
  { id: 'pr-collector',   name: 'PR Collector',   rarity: 'Rare',      module: 'dojo',   description: 'Set 5 personal records',           xpReward: 300  },
  { id: 'demon-slayer',   name: 'Demon Slayer',   rarity: 'Epic',      module: 'dojo',   description: '30-day workout streak',            xpReward: 750  },
  { id: 'century',        name: 'Century',        rarity: 'Epic',      module: 'dojo',   description: 'Log 100 workouts',                 xpReward: 1000 },
  { id: 'ultra-instinct', name: 'Ultra Instinct', rarity: 'Legendary', module: 'dojo',   description: '365 total workout sessions',       xpReward: 3000 },

  // ── FORGE ─────────────────────────────────────
  { id: 'hello-world',    name: 'Hello World',    rarity: 'Common',    module: 'forge',  description: 'Create your first project',        xpReward: 50   },
  { id: 'first-session',  name: 'In The Zone',    rarity: 'Common',    module: 'forge',  description: 'Log your first coding session',    xpReward: 50   },
  { id: 'ghost-protocol', name: 'Ghost Protocol', rarity: 'Rare',      module: 'forge',  description: '7-day coding streak',              xpReward: 250  },
  { id: 'full-dive',      name: 'Full Dive',      rarity: 'Rare',      module: 'forge',  description: 'Complete 3 projects (Shipped)',    xpReward: 300  },
  { id: 'hundred-hours',  name: '100 Hours',      rarity: 'Epic',      module: 'forge',  description: '100 total hours of coding logged', xpReward: 750  },
  { id: 'system-admin',   name: 'System Admin',   rarity: 'Legendary', module: 'forge',  description: '50 coding sessions logged',        xpReward: 2000 },

  // ── SPIRIT ────────────────────────────────────
  { id: 'first-weigh-in', name: 'First Weigh-In', rarity: 'Common',   module: 'spirit', description: 'Log your first weight entry',      xpReward: 50   },
  { id: 'consistent',     name: 'Consistent',     rarity: 'Rare',      module: 'spirit', description: 'Log weight 7 days in a row',       xpReward: 250  },
  { id: 'chakra-control', name: 'Chakra Control',  rarity: 'Epic',     module: 'spirit', description: 'Hit your body goal',               xpReward: 1000 },
  { id: 'transformation', name: 'Transformation',  rarity: 'Legendary',module: 'spirit', description: 'Reach target weight 30+ days logged', xpReward: 3000 },

  // ── VAULT ─────────────────────────────────────
  { id: 'ryo-earned',     name: 'Ryo Earned',     rarity: 'Common',    module: 'vault',  description: 'Log your first transaction',       xpReward: 50   },
  { id: 'budget-master',  name: 'Budget Master',   rarity: 'Rare',     module: 'vault',  description: 'Stay under budget for a month',    xpReward: 300  },
  { id: 'loid-forger',    name: 'Loid Forger',    rarity: 'Legendary', module: 'vault',  description: 'Hit a savings goal of ₹1,00,000', xpReward: 2500 },

  // ── QUESTS ────────────────────────────────────
  { id: 'novice-hunter',  name: 'Novice Hunter',  rarity: 'Common',    module: 'quests', description: 'Complete your first quest',        xpReward: 50   },
  { id: 'hunter-exam',    name: 'Hunter Exam',    rarity: 'Rare',      module: 'quests', description: 'Complete 20 quests',               xpReward: 250  },
  { id: 'greed-island',   name: 'Greed Island',   rarity: 'Epic',      module: 'quests', description: 'Complete 50 quests',               xpReward: 750  },
  { id: 's-rank',         name: 'S-Rank Hunter',  rarity: 'Legendary', module: 'quests', description: 'Complete 10 S-Rank quests',        xpReward: 2000 },

  // ── GLOBAL ────────────────────────────────────
  { id: 'all-rounder',    name: 'All Rounder',    rarity: 'Epic',      module: 'global', description: 'Use all 5 modules in one day',     xpReward: 500  },
  { id: 'the-one',        name: 'The One',        rarity: 'Legendary', module: 'global', description: 'Reach Level 10: Hokage',           xpReward: 5000 },
  { id: 'week-warrior',   name: 'Week Warrior',   rarity: 'Rare',      module: 'global', description: '7-day streak in any module',       xpReward: 300  },
]

// Badge check function — call after every relevant action
// Returns array of newly unlocked badge IDs
export type BadgeCheckContext = {
  workoutCount?:       number
  workoutStreak?:      number
  prCount?:            number
  projectCount?:       number
  shippedCount?:       number
  sessionCount?:       number
  forgeStreak?:        number
  totalCodingHours?:   number
  weightLogCount?:     number
  spiritStreak?:       number
  goalHit?:            boolean
  transactionCount?:   number
  budgetUnder?:        boolean
  totalSaved?:         number
  questCount?:         number
  sRankQuestCount?:    number
  level?:              number
  modulesUsedToday?:   string[]
}
```

### Streak Logic (in GamificationService)

```typescript
// api/src/services/gamification.ts (pseudocode)

async function updateStreak(module: string): Promise<{ count: number; justBroken: boolean }> {
  const streak = await getStreak(module)
  const today  = new Date().toISOString().split('T')[0]
  const last   = streak.lastActivityDate

  if (last === today) {
    // Already logged today — no change
    return { count: streak.count, justBroken: false }
  }

  const yesterday = getPreviousDate(today)
  if (last === yesterday) {
    // Continuing streak
    const newCount = streak.count + 1
    await updateStreakInDB(module, { count: newCount, lastActivityDate: today,
      longestStreak: Math.max(streak.longestStreak, newCount) })
    return { count: newCount, justBroken: false }
  }

  // Missed at least one day — reset
  await updateStreakInDB(module, { count: 1, lastActivityDate: today })
  return { count: 1, justBroken: streak.count > 1 }
}
```

---

## Mobile App — Screens

### Navigation Structure
```
Root Stack
└── (tabs) — Bottom Tab Navigator
    ├── index       →  Dashboard
    ├── dojo        →  Workout tracker
    ├── forge       →  Coding projects
    ├── spirit      →  Body goals
    ├── vault       →  Finance
    └── quests      →  Todo / Quest board
        
Modals (push on top of tabs):
    ├── hall                    →  Badge collection
    ├── dojo/new-workout        →  New workout form
    ├── dojo/[id]               →  Workout detail
    ├── forge/new-project       →  New project form
    ├── forge/[id]              →  Project detail
    └── settings                →  App settings
```

### Per-Screen Accent Colors
These drive the page header gradient, glow effects, and chart colors.

| Screen | Accent | Accent 2 | Theme feel |
|---|---|---|---|
| Dashboard | `#a78bfa` | `#7c3aed` | Violet command center |
| Dojo | `#f97316` | `#ef4444` | Fire, DBZ, Demon Slayer |
| Forge | `#22d3ee` | `#818cf8` | Cyan, Ghost in the Shell |
| Spirit | `#4ade80` | `#fbbf24` | Chakra green + gold |
| Vault | `#fbbf24` | `#a3e635` | Gold, SPY×FAMILY |
| Quests | `#e879f9` | `#38bdf8` | Fuchsia, HxH |
| Hall | shimmer | — | Holographic rainbow |

### Screen Descriptions

#### Dashboard
- Welcome header: "Ohayou, Priyanka ⚡" + today's date
- XP Bar: animated fill showing progress to next level (level title shown in its color)
- Streak row: one flame badge per module showing current streak
- Daily Challenges: horizontal scroll of 3 challenge cards
- Stats grid: 4 cards — Today's XP, Weekly XP, Active Streaks, Badges Unlocked
- Recent Activity: last 6 actions with module icon, description, time ago
- Quick Add buttons: one per module (+ Workout, + Session, + Weight, + Transaction, + Quest)

#### Dojo
- Sticky header with flame orange gradient bleed
- Stats row: Total Workouts | This Week | Streak | PRs Set
- 90-day activity grid (orange heat scale)
- Workout list: grouped by week, most recent first — each shows name, type, duration, stars, XP
- FAB: "+" to open New Workout sheet
- Personal Records section (collapsible): exercise name | best | date | change indicator

#### Forge
- Sticky header with cyan gradient
- Kanban board: 3 horizontal scrollable columns (Backlog | In Progress | Shipped)
- Project card: name, tech stack chips, milestone progress bar, total hours, stars
- Below kanban: "Recent Sessions" list
- FAB: "+" (opens choice: New Project or Log Session)
- Stats: Total Hours | Projects Shipped | Streak | This Week's Hours

#### Spirit
- Chakra green header
- Big "Goal Progress" section: animated ring showing % of goal achieved + current vs target weight
- Weight trend chart: 30-day area chart, green fill
- Log list: date | weight | change from previous (green ↓ / red ↑)
- FAB: "+" to log new weight entry
- Measurements accordion (collapsed by default): shows latest chest/waist/hips/biceps/thighs

#### Vault
- Gold header
- Monthly overview card: income / expenses / saved / savings target progress bar
- Donut chart: expenses by category (past 30 days)
- Transactions list: grouped by day, income in green, expense in muted red
- FAB: "+" to add transaction
- Monthly budget settings: accessible via top-right gear icon on page

#### Quests
- Fuchsia header with "Hunter Exam Board" subtitle
- Three tabs: Daily | Active | Completed
- Each quest card: priority tag (S/A/B/C in anime rank colors), title, tags, due date badge, XP reward
- Swipe right on quest → complete (triggers haptic + XP animation)
- Swipe left → delete (with confirmation)
- FAB: "+" to add new quest
- Tag filter bar: horizontal scroll of tag pills above the list

#### Hall of Power
- Full-screen modal, dark holographic background
- Grid of badge cards (2 columns on mobile)
- Filter bar: All | Module | Rarity | Unlocked / Locked
- Unlocked badge card: full color, rarity glow, tap opens detail modal
- Locked badge card: grayscale, padlock icon, shows unlock condition
- Legendary badges have animated shimmer border (CSS/Reanimated loop)
- Summary header: "7 / 30 Unlocked · 2150 XP from Badges"

---

## Environment Variables

### API (`api/.env`)
```env
PORT=3000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NODE_ENV=development
```

> Use the **service role key** in the backend (not the anon key). It bypasses RLS. Never expose this on the client.

### Mobile (`mobile/.env`)
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3000/api
```

> On a physical device, `localhost` won't resolve. Use your machine's local IP.
> On Android emulator: `http://10.0.2.2:3000/api`
> On iOS simulator: `http://localhost:3000/api`

---

## Setup Guide

### Prerequisites
- Node.js 20+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account (free tier is fine)
- Expo Go app on your phone

### 1. Clone and Install

```bash
git clone https://github.com/you/kaizenArc.git
cd kaizenArc

# Install API deps
cd api && npm install && cd ..

# Install mobile deps
cd mobile && npm install && cd ..
```

### 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New Project
2. Open the SQL Editor → paste the full schema from [Database Schema](#database-schema) → Run
3. After schema runs, seed the initial game state:

```sql
-- Run this once to create the single game_state row
INSERT INTO game_state (total_xp, level, level_title)
VALUES (0, 1, 'Academy Student');
```

4. Copy your project URL and service role key from **Project Settings → API**

### 3. Configure Environment

```bash
# API
cp api/.env.example api/.env
# Fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

# Mobile
cp mobile/.env.example mobile/.env
# Fill in EXPO_PUBLIC_API_BASE_URL with your machine's local IP
```

### 4. Run

```bash
# Terminal 1 — Start API
cd api
npm run dev
# Starts on http://localhost:3000

# Terminal 2 — Start Expo
cd mobile
npx expo start
# Scan QR with Expo Go on your phone
```

### 5. Verify

Hit `GET http://localhost:3000/api/game` in Postman or your browser.  
You should see the seeded game state with 0 XP and empty streaks.

---

## Development Workflow

### Adding a New Badge

1. Add the definition to `api/src/lib/badges.ts` (follow the `BadgeDef` type)
2. Add the check condition to `GamificationService.checkBadges()` in `api/src/services/gamification.ts`
3. Call `checkBadges()` in whichever route service should trigger it
4. The badge automatically appears in `GET /api/badges` as locked
5. Mobile renders it in Hall of Power — no mobile changes needed for a new badge

### Adding a New Module

1. Create the Supabase table(s) in SQL Editor
2. Add route file in `api/src/routes/`
3. Add service file in `api/src/services/`
4. Register route in `api/src/index.ts`
5. Create a screen in `mobile/app/(tabs)/`
6. Create hook in `mobile/hooks/`
7. Add tab entry in `mobile/app/(tabs)/_layout.tsx`

### Branch Strategy

```
main          →  production-ready
dev           →  integration branch
feat/dojo     →  feature branches per module
feat/forge
feat/gamification
```

### Testing API Routes

A Bruno or Postman collection lives at `api/requests/kaizenArc.json`.  
Import it to test all endpoints with pre-filled example bodies.

---

## Deployment Notes (Future)

| Component | Suggested platform |
|---|---|
| API | Railway, Render, or Fly.io (free tier) |
| Database | Supabase (already hosted) |
| Mobile | Expo EAS Build → TestFlight / Play Store internal testing |

The API needs a stable URL for the Expo app to point to once you move off local dev. Update `EXPO_PUBLIC_API_BASE_URL` in Expo's EAS secrets.

---

*Built by Priyanka — because showing up every day deserves to feel like a boss fight.*