-- KaizenArc — Supabase / PostgreSQL schema
-- Run this in the Supabase SQL Editor.

-- ─────────────────────────────────────────
-- GAMIFICATION
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS game_state (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_xp    INTEGER NOT NULL DEFAULT 0,
  level       INTEGER NOT NULL DEFAULT 1,
  level_title TEXT    NOT NULL DEFAULT 'Academy Student',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS streaks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module             TEXT NOT NULL,
  count              INTEGER NOT NULL DEFAULT 0,
  longest_streak     INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  UNIQUE(module)
);

INSERT INTO streaks (module)
VALUES ('dojo'), ('forge'), ('spirit'), ('vault'), ('quests')
ON CONFLICT (module) DO NOTHING;

-- ─────────────────────────────────────────
-- DOJO
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workouts (
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

CREATE TABLE IF NOT EXISTS workout_exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id  UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exercise_sets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id      UUID    NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  reps             INTEGER,
  weight_kg        DECIMAL(6,2),
  duration_seconds INTEGER,
  is_pr            BOOLEAN NOT NULL DEFAULT FALSE,
  order_index      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS personal_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_name  TEXT    NOT NULL UNIQUE,
  best_weight_kg DECIMAL(6,2),
  best_reps      INTEGER,
  achieved_at    DATE,
  workout_id     UUID REFERENCES workouts(id) ON DELETE SET NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FORGE
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
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

CREATE TABLE IF NOT EXISTS project_milestones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT    NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  order_index  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS coding_sessions (
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
-- SPIRIT
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS body_goal (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_weight_kg  DECIMAL(5,2),
  target_weight_kg DECIMAL(5,2),
  start_date       DATE,
  target_date      DATE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weight_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL,
  weight_kg    DECIMAL(5,2) NOT NULL,
  body_fat_pct DECIMAL(4,1),
  chest_cm     DECIMAL(5,1),
  waist_cm     DECIMAL(5,1),
  hips_cm      DECIMAL(5,1),
  biceps_cm    DECIMAL(5,1),
  thighs_cm    DECIMAL(5,1),
  notes        TEXT,
  xp_earned    INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date)
);

-- ─────────────────────────────────────────
-- VAULT
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE    NOT NULL DEFAULT CURRENT_DATE,
  amount      DECIMAL(12,2) NOT NULL,
  type        TEXT    NOT NULL CHECK (type IN ('Income', 'Expense')),
  category    TEXT    NOT NULL,
  description TEXT,
  xp_earned   INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_budgets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month            TEXT    NOT NULL UNIQUE,
  income           DECIMAL(12,2) NOT NULL DEFAULT 0,
  savings_target   DECIMAL(12,2) NOT NULL DEFAULT 0,
  category_budgets JSONB   NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- QUESTS
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT    NOT NULL,
  description         TEXT,
  priority            TEXT    NOT NULL DEFAULT 'C' CHECK (priority IN ('S', 'A', 'B', 'C')),
  difficulty          TEXT    CHECK (difficulty IS NULL OR difficulty IN ('Trivial','Normal','Hard','Boss')),
  is_daily            BOOLEAN NOT NULL DEFAULT FALSE,
  is_boss             BOOLEAN NOT NULL DEFAULT FALSE,
  completed           BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at        TIMESTAMPTZ,
  due_date            DATE,
  remind_at           TIMESTAMPTZ,
  stars               INTEGER CHECK (stars BETWEEN 1 AND 5),
  notes               TEXT,
  estimated_minutes   INTEGER,
  actual_minutes      INTEGER,
  xp_earned           INTEGER NOT NULL DEFAULT 0,
  display_order       INTEGER NOT NULL DEFAULT 0,
  parent_quest_id     UUID REFERENCES quests(id) ON DELETE SET NULL,
  recurrence          JSONB,
  last_rollover_date  DATE,
  archived_at         TIMESTAMPTZ,
  template_id         UUID,
  linked_module       TEXT,
  linked_module_id    UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quests_archived_idx  ON quests(archived_at);
CREATE INDEX IF NOT EXISTS quests_due_idx       ON quests(due_date);
CREATE INDEX IF NOT EXISTS quests_parent_idx    ON quests(parent_quest_id);
CREATE INDEX IF NOT EXISTS quests_completed_idx ON quests(completed);

CREATE TABLE IF NOT EXISTS tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL DEFAULT '#a78bfa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quest_tags (
  quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  tag_id   UUID NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
  PRIMARY KEY (quest_id, tag_id)
);

CREATE TABLE IF NOT EXISTS quest_steps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id     UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  done         BOOLEAN NOT NULL DEFAULT FALSE,
  done_at      TIMESTAMPTZ,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS quest_steps_quest_idx ON quest_steps(quest_id);

CREATE TABLE IF NOT EXISTS quest_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  title             TEXT NOT NULL,
  priority          TEXT NOT NULL DEFAULT 'C',
  difficulty        TEXT,
  is_daily          BOOLEAN NOT NULL DEFAULT FALSE,
  is_boss           BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence        JSONB,
  estimated_minutes INTEGER,
  notes             TEXT,
  tag_ids           JSONB NOT NULL DEFAULT '[]'::jsonb,
  step_labels       JSONB NOT NULL DEFAULT '[]'::jsonb,
  use_count         INTEGER NOT NULL DEFAULT 0,
  last_used_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quest_active_timer (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id    UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  elapsed_sec INTEGER NOT NULL DEFAULT 0,
  is_running  BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS quest_combo (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count             INTEGER NOT NULL DEFAULT 0,
  last_complete_at  TIMESTAMPTZ,
  window_ends_at    TIMESTAMPTZ
);
INSERT INTO quest_combo (count) SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM quest_combo);

CREATE TABLE IF NOT EXISTS quest_settings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_priority         TEXT NOT NULL DEFAULT 'C',
  default_tab              TEXT NOT NULL DEFAULT 'Active',
  auto_archive_days        INTEGER NOT NULL DEFAULT 30,
  reminder_offset_minutes  INTEGER NOT NULL DEFAULT 60,
  sounds_enabled           BOOLEAN NOT NULL DEFAULT TRUE,
  combo_enabled            BOOLEAN NOT NULL DEFAULT TRUE,
  penalty_enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO quest_settings (id) SELECT gen_random_uuid() WHERE NOT EXISTS (SELECT 1 FROM quest_settings);

CREATE TABLE IF NOT EXISTS quest_challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  period        TEXT NOT NULL,
  target        INTEGER NOT NULL,
  progress      INTEGER NOT NULL DEFAULT 0,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  xp_reward     INTEGER NOT NULL DEFAULT 100,
  starts_on     DATE NOT NULL,
  ends_on       DATE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(key, starts_on)
);

-- ─────────────────────────────────────────
-- BADGES & CHALLENGES
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id    TEXT NOT NULL UNIQUE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  xp_awarded  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS daily_challenges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date          DATE    NOT NULL DEFAULT CURRENT_DATE,
  challenge_key TEXT    NOT NULL,
  progress      INTEGER NOT NULL DEFAULT 0,
  target        INTEGER NOT NULL,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  xp_reward     INTEGER NOT NULL,
  UNIQUE(date, challenge_key)
);

-- ─────────────────────────────────────────
-- SEED: ensure the single game_state row exists
-- ─────────────────────────────────────────
INSERT INTO game_state (total_xp, level, level_title)
SELECT 0, 1, 'Academy Student'
WHERE NOT EXISTS (SELECT 1 FROM game_state);
