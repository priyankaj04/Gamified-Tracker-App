import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ── USER PROFILE ────────────────────────────────────
  await knex.schema.createTable('user_profile', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.decimal('height_cm', 5, 1);
    t.date('date_of_birth');
    t.text('gender');
    t.text('activity_level');
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE user_profile ADD CONSTRAINT user_profile_gender_chk
       CHECK (gender IS NULL OR gender IN ('male','female','other'))`,
  );
  await knex.raw(
    `ALTER TABLE user_profile ADD CONSTRAINT user_profile_activity_chk
       CHECK (activity_level IS NULL OR activity_level IN ('sedentary','light','moderate','active','very_active'))`,
  );

  // Add bmi column to existing weight_entries
  await knex.schema.alterTable('weight_entries', (t) => {
    t.decimal('bmi', 4, 1);
  });

  // ── BODY MEASUREMENTS (separate from weight_entries) ─
  await knex.schema.createTable('body_measurements', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().unique();
    t.decimal('chest_cm', 5, 1);
    t.decimal('waist_cm', 5, 1);
    t.decimal('hips_cm', 5, 1);
    t.decimal('biceps_cm', 5, 1);
    t.decimal('thighs_cm', 5, 1);
    t.decimal('neck_cm', 5, 1);
    t.decimal('shoulders_cm', 5, 1);
    t.decimal('calves_cm', 5, 1);
    t.decimal('forearms_cm', 5, 1);
    t.text('notes');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // ── NUTRITION ───────────────────────────────────────
  await knex.schema.createTable('nutrition_goals', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.integer('calories');
    t.integer('protein_g');
    t.integer('carbs_g');
    t.integer('fats_g');
    t.integer('water_ml').defaultTo(4000);
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('food_database', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.decimal('calories_per_100g', 6, 1);
    t.decimal('protein_per_100g', 5, 1);
    t.decimal('carbs_per_100g', 5, 1);
    t.decimal('fats_per_100g', 5, 1);
    t.boolean('is_custom').notNullable().defaultTo(true);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('meal_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.text('meal_type').notNullable();
    t.text('name').notNullable();
    t.integer('calories').notNullable().defaultTo(0);
    t.decimal('protein_g', 5, 1).defaultTo(0);
    t.decimal('carbs_g', 5, 1).defaultTo(0);
    t.decimal('fats_g', 5, 1).defaultTo(0);
    t.decimal('quantity_g', 6, 1);
    t.uuid('food_id').references('id').inTable('food_database').onDelete('SET NULL');
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE meal_logs ADD CONSTRAINT meal_logs_type_chk
       CHECK (meal_type IN ('Breakfast','Lunch','Dinner','Snack'))`,
  );

  await knex.schema.createTable('water_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE')).unique();
    t.integer('amount_ml').notNullable();
    t.timestamp('logged_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // ── SLEEP ───────────────────────────────────────────
  await knex.schema.createTable('sleep_goal', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.decimal('target_hours', 3, 1).notNullable().defaultTo(8.0);
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('sleep_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().unique();
    t.timestamp('bedtime', { useTz: true }).notNullable();
    t.timestamp('wake_time', { useTz: true }).notNullable();
    t.decimal('duration_hours', 3, 1);
    t.integer('quality');
    t.text('notes');
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE sleep_logs ADD CONSTRAINT sleep_logs_quality_chk
       CHECK (quality IS NULL OR quality BETWEEN 1 AND 5)`,
  );

  // ── HABITS ──────────────────────────────────────────
  await knex.schema.createTable('habits', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('emoji').notNullable().defaultTo('⭐');
    t.text('frequency').notNullable().defaultTo('daily');
    t.specificType('custom_days', 'INTEGER[]');
    t.text('routine_slot').defaultTo('anytime');
    t.integer('xp_per_completion').notNullable().defaultTo(10);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('order_index').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE habits ADD CONSTRAINT habits_freq_chk
       CHECK (frequency IN ('daily','weekdays','custom'))`,
  );
  await knex.raw(
    `ALTER TABLE habits ADD CONSTRAINT habits_slot_chk
       CHECK (routine_slot IN ('morning','evening','anytime'))`,
  );

  await knex.schema.createTable('habit_bundles', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.integer('bonus_xp').notNullable().defaultTo(50);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('habit_bundle_members', (t) => {
    t.uuid('bundle_id').notNullable().references('id').inTable('habit_bundles').onDelete('CASCADE');
    t.uuid('habit_id').notNullable().references('id').inTable('habits').onDelete('CASCADE');
    t.primary(['bundle_id', 'habit_id']);
  });

  await knex.schema.createTable('habit_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('habit_id').notNullable().references('id').inTable('habits').onDelete('CASCADE');
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.boolean('completed').notNullable().defaultTo(true);
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['habit_id', 'date']);
  });

  // ── ENERGY/MOOD ─────────────────────────────────────
  await knex.schema.createTable('daily_wellness', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().unique();
    t.integer('energy_level');
    t.integer('mood');
    t.integer('stress_level');
    t.text('notes');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE daily_wellness ADD CONSTRAINT daily_wellness_energy_chk
       CHECK (energy_level IS NULL OR energy_level BETWEEN 1 AND 5)`,
  );
  await knex.raw(
    `ALTER TABLE daily_wellness ADD CONSTRAINT daily_wellness_mood_chk
       CHECK (mood IS NULL OR mood BETWEEN 1 AND 5)`,
  );
  await knex.raw(
    `ALTER TABLE daily_wellness ADD CONSTRAINT daily_wellness_stress_chk
       CHECK (stress_level IS NULL OR stress_level BETWEEN 1 AND 5)`,
  );

  // ── FASTING ─────────────────────────────────────────
  await knex.schema.createTable('fasting_sessions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.timestamp('start_time', { useTz: true }).notNullable();
    t.timestamp('end_time', { useTz: true });
    t.decimal('target_hours', 4, 1).notNullable();
    t.decimal('actual_hours', 4, 1);
    t.boolean('completed').notNullable().defaultTo(false);
    t.text('notes');
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // ── CYCLE ───────────────────────────────────────────
  await knex.schema.createTable('cycle_settings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.boolean('is_enabled').notNullable().defaultTo(false);
    t.integer('average_cycle_length').notNullable().defaultTo(28);
    t.integer('average_period_length').notNullable().defaultTo(5);
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('cycle_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('start_date').notNullable();
    t.date('end_date');
    t.integer('cycle_length');
    t.text('notes');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('cycle_symptoms', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().unique();
    t.integer('cramps');
    t.integer('bloating');
    t.integer('mood');
    t.integer('energy');
    t.text('notes');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE cycle_symptoms ADD CONSTRAINT cycle_symptoms_chk
       CHECK ((cramps IS NULL OR cramps BETWEEN 0 AND 5)
          AND (bloating IS NULL OR bloating BETWEEN 0 AND 5)
          AND (mood IS NULL OR mood BETWEEN 0 AND 5)
          AND (energy IS NULL OR energy BETWEEN 0 AND 5))`,
  );

  // ── CUSTOM GOALS ────────────────────────────────────
  await knex.schema.createTable('spirit_goals', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('title').notNullable();
    t.text('type').notNullable();
    t.text('unit');
    t.decimal('start_value', 10, 2);
    t.decimal('target_value', 10, 2);
    t.decimal('current_value', 10, 2);
    t.date('start_date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.date('deadline');
    t.boolean('completed').notNullable().defaultTo(false);
    t.timestamp('completed_at', { useTz: true });
    t.boolean('archived').notNullable().defaultTo(false);
    t.integer('xp_reward').notNullable().defaultTo(200);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(
    `ALTER TABLE spirit_goals ADD CONSTRAINT spirit_goals_type_chk
       CHECK (type IN ('numeric','habit','reduction','milestone'))`,
  );

  await knex.schema.createTable('goal_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('goal_id').notNullable().references('id').inTable('spirit_goals').onDelete('CASCADE');
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.decimal('value', 10, 2).notNullable();
    t.text('notes');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // ── STEPS ───────────────────────────────────────────
  await knex.schema.createTable('step_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().unique();
    t.integer('steps').notNullable().defaultTo(0);
    t.integer('goal').notNullable().defaultTo(10000);
    t.boolean('goal_hit').notNullable().defaultTo(false);
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // ── WELLNESS SCORE HISTORY ──────────────────────────
  await knex.schema.createTable('wellness_score_logs', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().unique();
    t.integer('total').notNullable();
    t.integer('sleep_pts').notNullable().defaultTo(0);
    t.integer('nutrition_pts').notNullable().defaultTo(0);
    t.integer('habits_pts').notNullable().defaultTo(0);
    t.integer('workouts_pts').notNullable().defaultTo(0);
    t.integer('weight_trend_pts').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // All Spirit sub-features (weight, nutrition, sleep, habits, fasting, steps,
  // goals) roll into the existing 'spirit' streak row — no new streak modules.
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('wellness_score_logs');
  await knex.schema.dropTableIfExists('step_logs');
  await knex.schema.dropTableIfExists('goal_logs');
  await knex.schema.dropTableIfExists('spirit_goals');
  await knex.schema.dropTableIfExists('cycle_symptoms');
  await knex.schema.dropTableIfExists('cycle_logs');
  await knex.schema.dropTableIfExists('cycle_settings');
  await knex.schema.dropTableIfExists('fasting_sessions');
  await knex.schema.dropTableIfExists('daily_wellness');
  await knex.schema.dropTableIfExists('habit_logs');
  await knex.schema.dropTableIfExists('habit_bundle_members');
  await knex.schema.dropTableIfExists('habit_bundles');
  await knex.schema.dropTableIfExists('habits');
  await knex.schema.dropTableIfExists('sleep_logs');
  await knex.schema.dropTableIfExists('sleep_goal');
  await knex.schema.dropTableIfExists('water_logs');
  await knex.schema.dropTableIfExists('meal_logs');
  await knex.schema.dropTableIfExists('food_database');
  await knex.schema.dropTableIfExists('nutrition_goals');
  await knex.schema.dropTableIfExists('body_measurements');
  await knex.schema.alterTable('weight_entries', (t) => t.dropColumn('bmi'));
  await knex.schema.dropTableIfExists('user_profile');
}
