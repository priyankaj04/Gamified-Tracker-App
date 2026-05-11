import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // pgcrypto is what supplies gen_random_uuid()
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  // ── GAMIFICATION ─────────────────────────────────────
  await knex.schema.createTable('game_state', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.integer('total_xp').notNullable().defaultTo(0);
    t.integer('level').notNullable().defaultTo(1);
    t.text('level_title').notNullable().defaultTo('Academy Student');
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('streaks', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('module').notNullable().unique();
    t.integer('count').notNullable().defaultTo(0);
    t.integer('longest_streak').notNullable().defaultTo(0);
    t.date('last_activity_date');
  });

  // ── DOJO ─────────────────────────────────────────────
  await knex.schema.createTable('workouts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('type').notNullable();
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.integer('duration_minutes');
    t.integer('stars');
    t.text('notes');
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE workouts ADD CONSTRAINT workouts_type_chk
       CHECK (type IN ('Strength', 'Cardio', 'Flexibility', 'Combat'))`,
  );
  await knex.raw(
    `ALTER TABLE workouts ADD CONSTRAINT workouts_stars_chk
       CHECK (stars IS NULL OR stars BETWEEN 1 AND 5)`,
  );

  await knex.schema.createTable('workout_exercises', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('workout_id').notNullable().references('id').inTable('workouts').onDelete('CASCADE');
    t.text('name').notNullable();
    t.integer('order_index').notNullable().defaultTo(0);
  });

  await knex.schema.createTable('exercise_sets', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('exercise_id').notNullable().references('id').inTable('workout_exercises').onDelete('CASCADE');
    t.integer('reps');
    t.decimal('weight_kg', 6, 2);
    t.integer('duration_seconds');
    t.boolean('is_pr').notNullable().defaultTo(false);
    t.integer('order_index').notNullable().defaultTo(0);
  });

  await knex.schema.createTable('personal_records', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('exercise_name').notNullable().unique();
    t.decimal('best_weight_kg', 6, 2);
    t.integer('best_reps');
    t.date('achieved_at');
    t.uuid('workout_id').references('id').inTable('workouts').onDelete('SET NULL');
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // ── FORGE ────────────────────────────────────────────
  await knex.schema.createTable('projects', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('description');
    t.specificType('tech_stack', 'TEXT[]').notNullable().defaultTo(knex.raw(`'{}'::text[]`));
    t.text('github_url');
    t.text('status').notNullable().defaultTo('Backlog');
    t.integer('stars');
    t.decimal('total_hours', 8, 2).notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE projects ADD CONSTRAINT projects_status_chk
       CHECK (status IN ('Backlog', 'In Progress', 'Shipped'))`,
  );
  await knex.raw(
    `ALTER TABLE projects ADD CONSTRAINT projects_stars_chk
       CHECK (stars IS NULL OR stars BETWEEN 1 AND 5)`,
  );

  await knex.schema.createTable('project_milestones', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
    t.text('title').notNullable();
    t.boolean('completed').notNullable().defaultTo(false);
    t.timestamp('completed_at', { useTz: true });
    t.integer('order_index').notNullable().defaultTo(0);
  });

  await knex.schema.createTable('coding_sessions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('project_id').references('id').inTable('projects').onDelete('SET NULL');
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.integer('duration_minutes').notNullable();
    t.text('notes');
    t.integer('stars');
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE coding_sessions ADD CONSTRAINT coding_sessions_stars_chk
       CHECK (stars IS NULL OR stars BETWEEN 1 AND 5)`,
  );

  // ── SPIRIT ───────────────────────────────────────────
  await knex.schema.createTable('body_goal', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.decimal('start_weight_kg', 5, 2);
    t.decimal('target_weight_kg', 5, 2);
    t.date('start_date');
    t.date('target_date');
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('weight_entries', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().unique();
    t.decimal('weight_kg', 5, 2).notNullable();
    t.decimal('body_fat_pct', 4, 1);
    t.decimal('chest_cm', 5, 1);
    t.decimal('waist_cm', 5, 1);
    t.decimal('hips_cm', 5, 1);
    t.decimal('biceps_cm', 5, 1);
    t.decimal('thighs_cm', 5, 1);
    t.text('notes');
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // ── VAULT ────────────────────────────────────────────
  await knex.schema.createTable('transactions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.decimal('amount', 12, 2).notNullable();
    t.text('type').notNullable();
    t.text('category').notNullable();
    t.text('description');
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE transactions ADD CONSTRAINT transactions_type_chk
       CHECK (type IN ('Income', 'Expense'))`,
  );

  await knex.schema.createTable('monthly_budgets', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('month').notNullable().unique();
    t.decimal('income', 12, 2).notNullable().defaultTo(0);
    t.decimal('savings_target', 12, 2).notNullable().defaultTo(0);
    t.jsonb('category_budgets').notNullable().defaultTo(knex.raw(`'{}'::jsonb`));
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // ── QUESTS ───────────────────────────────────────────
  await knex.schema.createTable('quests', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('title').notNullable();
    t.text('priority').notNullable().defaultTo('C');
    t.boolean('is_daily').notNullable().defaultTo(false);
    t.boolean('completed').notNullable().defaultTo(false);
    t.timestamp('completed_at', { useTz: true });
    t.date('due_date');
    t.integer('stars');
    t.text('notes');
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE quests ADD CONSTRAINT quests_priority_chk
       CHECK (priority IN ('S', 'A', 'B', 'C'))`,
  );
  await knex.raw(
    `ALTER TABLE quests ADD CONSTRAINT quests_stars_chk
       CHECK (stars IS NULL OR stars BETWEEN 1 AND 5)`,
  );

  await knex.schema.createTable('tags', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable().unique();
    t.text('color').notNullable().defaultTo('#a78bfa');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('quest_tags', (t) => {
    t.uuid('quest_id').notNullable().references('id').inTable('quests').onDelete('CASCADE');
    t.uuid('tag_id').notNullable().references('id').inTable('tags').onDelete('CASCADE');
    t.primary(['quest_id', 'tag_id']);
  });

  // ── BADGES & CHALLENGES ──────────────────────────────
  await knex.schema.createTable('user_badges', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('badge_id').notNullable().unique();
    t.timestamp('unlocked_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.integer('xp_awarded').notNullable().defaultTo(0);
  });

  await knex.schema.createTable('daily_challenges', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.text('challenge_key').notNullable();
    t.integer('progress').notNullable().defaultTo(0);
    t.integer('target').notNullable();
    t.boolean('completed').notNullable().defaultTo(false);
    t.integer('xp_reward').notNullable();
    t.unique(['date', 'challenge_key']);
  });

  // ── SEED ─────────────────────────────────────────────
  await knex('streaks')
    .insert(
      ['dojo', 'forge', 'spirit', 'vault', 'quests'].map((module) => ({ module })),
    )
    .onConflict('module')
    .ignore();

  const gameRow = await knex('game_state').first();
  if (!gameRow) {
    await knex('game_state').insert({ total_xp: 0, level: 1, level_title: 'Academy Student' });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('daily_challenges');
  await knex.schema.dropTableIfExists('user_badges');
  await knex.schema.dropTableIfExists('quest_tags');
  await knex.schema.dropTableIfExists('tags');
  await knex.schema.dropTableIfExists('quests');
  await knex.schema.dropTableIfExists('monthly_budgets');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('weight_entries');
  await knex.schema.dropTableIfExists('body_goal');
  await knex.schema.dropTableIfExists('coding_sessions');
  await knex.schema.dropTableIfExists('project_milestones');
  await knex.schema.dropTableIfExists('projects');
  await knex.schema.dropTableIfExists('personal_records');
  await knex.schema.dropTableIfExists('exercise_sets');
  await knex.schema.dropTableIfExists('workout_exercises');
  await knex.schema.dropTableIfExists('workouts');
  await knex.schema.dropTableIfExists('streaks');
  await knex.schema.dropTableIfExists('game_state');
}
