-- ════════════════════════════════════════════════════════════
-- FORGE MODULE — full schema migration
-- Run this in Supabase SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS / ALTER guards.
-- ════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- PROJECTS  (extends existing `projects` table from initial commit)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS type          TEXT NOT NULL DEFAULT 'Personal'
    CHECK (type IN ('Personal','Freelance','Open Source','Learning','Work')),
  ADD COLUMN IF NOT EXISTS priority      TEXT NOT NULL DEFAULT 'B'
    CHECK (priority IN ('S','A','B','C')),
  ADD COLUMN IF NOT EXISTS cover_emoji   TEXT DEFAULT '💻',
  ADD COLUMN IF NOT EXISTS cover_color   TEXT DEFAULT '#22d3ee',
  ADD COLUMN IF NOT EXISTS is_pinned     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_archived   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS readme_notes  TEXT,
  ADD COLUMN IF NOT EXISTS start_date    DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS target_ship_date DATE,
  ADD COLUMN IF NOT EXISTS shipped_date  DATE,
  ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS demo_url      TEXT,
  ADD COLUMN IF NOT EXISTS figma_url     TEXT,
  ADD COLUMN IF NOT EXISTS docs_url      TEXT,
  ADD COLUMN IF NOT EXISTS is_portfolio  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS github_data   JSONB,
  ADD COLUMN IF NOT EXISTS github_synced_at TIMESTAMPTZ;

-- relax/extend the status check to support Idea / Review / Archived
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('Idea','Backlog','In Progress','Review','Shipped','Archived'));

CREATE INDEX IF NOT EXISTS idx_projects_status      ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_archived    ON projects(is_archived);
CREATE INDEX IF NOT EXISTS idx_projects_pinned      ON projects(is_pinned);

CREATE TABLE IF NOT EXISTS project_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  color       TEXT NOT NULL DEFAULT '#22d3ee',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_tag_map (
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES project_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

-- ─────────────────────────────────────────────────────────────
-- MILESTONES & SUB-TASKS  (existing table is `project_milestones`,
-- we extend it and add subtasks). We keep the original name.
-- ─────────────────────────────────────────────────────────────

ALTER TABLE project_milestones
  ADD COLUMN IF NOT EXISTS target_date DATE,
  ADD COLUMN IF NOT EXISTS notes       TEXT,
  ADD COLUMN IF NOT EXISTS xp_earned   INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);

CREATE TABLE IF NOT EXISTS subtasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id    UUID NOT NULL REFERENCES project_milestones(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  priority        TEXT NOT NULL DEFAULT 'B'
                  CHECK (priority IN ('S','A','B','C')),
  estimated_hours DECIMAL(5,2),
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  order_index     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subtasks_milestone ON subtasks(milestone_id);

-- ─────────────────────────────────────────────────────────────
-- CODING SESSIONS  (extend existing table)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE coding_sessions
  ADD COLUMN IF NOT EXISTS milestone_id   UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS start_time     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_time       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mood           TEXT
    CHECK (mood IN ('Deep Focus','Normal','Distracted','Blocked','Flow State')),
  ADD COLUMN IF NOT EXISTS is_billable    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pomodoro_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sessions_date     ON coding_sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_project  ON coding_sessions(project_id);

CREATE TABLE IF NOT EXISTS session_tags (
  session_id  UUID NOT NULL REFERENCES coding_sessions(id) ON DELETE CASCADE,
  tag         TEXT NOT NULL,
  PRIMARY KEY (session_id, tag)
);

CREATE TABLE IF NOT EXISTS active_timer (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID REFERENCES projects(id) ON DELETE SET NULL,
  milestone_id  UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_running    BOOLEAN NOT NULL DEFAULT TRUE,
  is_pomodoro   BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE active_timer
  ADD COLUMN IF NOT EXISTS is_pomodoro BOOLEAN NOT NULL DEFAULT FALSE;

-- ─────────────────────────────────────────────────────────────
-- LEARNING + TECH SKILLS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS learning_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'Course'
                  CHECK (type IN ('Course','Book','Tutorial','Video','Documentation','Paper')),
  platform        TEXT,
  source_url      TEXT,
  topics          TEXT[] NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'Not Started'
                  CHECK (status IN ('Not Started','In Progress','Completed')),
  progress_pct    INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes           TEXT,
  started_at      DATE,
  completed_at    DATE,
  estimated_hours DECIMAL(6,2),
  actual_hours    DECIMAL(6,2),
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tech_skills (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL UNIQUE,
  category          TEXT NOT NULL DEFAULT 'Other'
                    CHECK (category IN ('Frontend','Backend','Mobile','ML/AI','DevOps','Database','CS Fundamentals','Other')),
  proficiency       TEXT NOT NULL DEFAULT 'Beginner'
                    CHECK (proficiency IN ('Beginner','Intermediate','Advanced','Expert')),
  total_hours       DECIMAL(8,2) NOT NULL DEFAULT 0,
  project_count     INTEGER NOT NULL DEFAULT 0,
  first_used        DATE,
  last_used         DATE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- SNIPPETS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS snippets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  language    TEXT NOT NULL DEFAULT 'javascript',
  content     TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Reference'
              CHECK (category IN ('Bug Fix','Algorithm','Config','Reference','Template')),
  tags        TEXT[] NOT NULL DEFAULT '{}',
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- DEPLOYMENTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS deployments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version         TEXT,
  environment     TEXT NOT NULL DEFAULT 'production'
                  CHECK (environment IN ('development','staging','production')),
  deployed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  release_notes   TEXT,
  deploy_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deployments_project ON deployments(project_id);

-- ─────────────────────────────────────────────────────────────
-- ISSUES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS issues (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  severity    TEXT NOT NULL DEFAULT 'Medium'
              CHECK (severity IN ('Critical','High','Medium','Low')),
  status      TEXT NOT NULL DEFAULT 'Open'
              CHECK (status IN ('Open','In Progress','Fixed','Wont Fix')),
  found_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  fixed_date  DATE,
  session_id  UUID REFERENCES coding_sessions(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_issues_project ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_status  ON issues(status);

-- ─────────────────────────────────────────────────────────────
-- DSA
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dsa_problems (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  platform        TEXT NOT NULL DEFAULT 'LeetCode'
                  CHECK (platform IN ('LeetCode','HackerRank','Codeforces','GeeksForGeeks','Custom')),
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('Easy','Medium','Hard')),
  topic           TEXT NOT NULL DEFAULT 'Arrays'
                  CHECK (topic IN ('Arrays','Strings','Linked Lists','Trees','Graphs',
                                   'Dynamic Programming','Backtracking','Sorting',
                                   'Binary Search','Stacks & Queues','Heaps',
                                   'Tries','Greedy','Math','Bit Manipulation','Other')),
  status          TEXT NOT NULL DEFAULT 'Solved'
                  CHECK (status IN ('Solved','Attempted','Revisit')),
  time_taken_min  INTEGER,
  date            DATE NOT NULL DEFAULT CURRENT_DATE,
  problem_url     TEXT,
  notes           TEXT,
  solution_notes  TEXT,
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dsa_date  ON dsa_problems(date);
CREATE INDEX IF NOT EXISTS idx_dsa_topic ON dsa_problems(topic);

-- ─────────────────────────────────────────────────────────────
-- STANDUP
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS standup_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  yesterday     TEXT,
  today         TEXT,
  blockers      TEXT,
  project_id    UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date)
);

-- ─────────────────────────────────────────────────────────────
-- FORGE SETTINGS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forge_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_coding_goal_min INTEGER NOT NULL DEFAULT 120,
  default_session_min   INTEGER NOT NULL DEFAULT 60,
  pomodoro_work_min     INTEGER NOT NULL DEFAULT 25,
  pomodoro_break_min    INTEGER NOT NULL DEFAULT 5,
  github_username       TEXT,
  work_start_hour       INTEGER NOT NULL DEFAULT 9,
  work_end_hour         INTEGER NOT NULL DEFAULT 23,
  week_start_day        INTEGER NOT NULL DEFAULT 1,
  billable_rate         DECIMAL(10,2),
  billable_currency     TEXT NOT NULL DEFAULT 'INR',
  weekly_dsa_goal       INTEGER NOT NULL DEFAULT 5,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- STREAKS  — insert forge-specific modules
-- ─────────────────────────────────────────────────────────────

INSERT INTO streaks (module) VALUES
  ('forge'), ('dsa'), ('learning')
ON CONFLICT (module) DO NOTHING;
