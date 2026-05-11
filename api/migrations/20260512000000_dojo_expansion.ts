import type { Knex } from 'knex';

const MUSCLE_GROUPS = [
  'Chest','Back','Shoulders','Biceps','Triceps','Forearms','Core',
  'Quads','Hamstrings','Glutes','Calves','Full Body','Cardio',
];
const EQUIPMENT_TYPES = [
  'Barbell','Dumbbell','Machine','Cable','Bodyweight',
  'Resistance Band','Kettlebell','Cardio Machine',
];

export async function up(knex: Knex): Promise<void> {
  // ── EXERCISES LIBRARY ─────────────────────────────────
  await knex.schema.createTable('exercises', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('muscle_primary').notNullable();
    t.specificType('muscle_secondary', 'TEXT[]').notNullable().defaultTo(knex.raw(`'{}'::text[]`));
    t.text('equipment').notNullable();
    t.text('exercise_type').notNullable(); // compound | isolation | cardio
    t.boolean('is_custom').notNullable().defaultTo(false);
    t.boolean('is_favorite').notNullable().defaultTo(false);
    t.text('notes');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.unique(['name']);
  });
  await knex.raw(`ALTER TABLE exercises ADD CONSTRAINT exercises_type_chk
    CHECK (exercise_type IN ('compound','isolation','cardio'))`);

  // ── WORKOUT_EXERCISES: link to exercise + superset support ───
  await knex.schema.alterTable('workout_exercises', (t) => {
    t.uuid('exercise_id').references('id').inTable('exercises').onDelete('SET NULL');
    t.uuid('superset_group_id'); // exercises sharing this id are linked as a superset
    t.text('notes');
  });

  // ── EXERCISE_SETS: set type + previous reference ──────
  await knex.schema.alterTable('exercise_sets', (t) => {
    t.text('set_type').notNullable().defaultTo('Normal');
    t.text('rpe'); // optional rate-of-perceived-exertion or rest notes
  });
  await knex.raw(`ALTER TABLE exercise_sets ADD CONSTRAINT exercise_sets_type_chk
    CHECK (set_type IN ('Normal','Warmup','DropSet','Failure','AMRAP'))`);

  // ── WORKOUTS: mood + cached aggregates ────────────────
  await knex.schema.alterTable('workouts', (t) => {
    t.text('mood_tag'); // 'CrushedIt' | 'Solid' | 'Average' | 'Rough' | 'Struggled'
    t.decimal('total_volume_kg', 12, 2).notNullable().defaultTo(0);
    t.integer('total_sets').notNullable().defaultTo(0);
    t.integer('total_reps').notNullable().defaultTo(0);
    t.uuid('template_id'); // optional FK, added below after table exists
    t.uuid('routine_day_id');
  });
  await knex.raw(`ALTER TABLE workouts ADD CONSTRAINT workouts_mood_chk
    CHECK (mood_tag IS NULL OR mood_tag IN ('CrushedIt','Solid','Average','Rough','Struggled'))`);

  // Drop the original type CHECK so 'Mixed' is allowed too
  await knex.raw(`ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_type_chk`);
  await knex.raw(`ALTER TABLE workouts ADD CONSTRAINT workouts_type_chk
    CHECK (type IN ('Strength','Cardio','Flexibility','Combat','Mixed'))`);

  // ── PERSONAL_RECORDS: expanded ────────────────────────
  await knex.schema.alterTable('personal_records', (t) => {
    t.uuid('exercise_id').references('id').inTable('exercises').onDelete('CASCADE');
    t.decimal('best_volume_kg', 12, 2);
    t.decimal('best_est_one_rm_kg', 8, 2);
  });

  // ── TEMPLATES ─────────────────────────────────────────
  await knex.schema.createTable('workout_templates', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('type').notNullable().defaultTo('Strength');
    t.integer('estimated_minutes').notNullable().defaultTo(60);
    t.text('notes');
    t.timestamp('last_used_at', { useTz: true });
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('template_exercises', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('template_id').notNullable().references('id').inTable('workout_templates').onDelete('CASCADE');
    t.uuid('exercise_id').notNullable().references('id').inTable('exercises').onDelete('CASCADE');
    t.uuid('superset_group_id');
    t.integer('order_index').notNullable().defaultTo(0);
    t.text('notes');
  });

  await knex.schema.createTable('template_sets', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('template_exercise_id').notNullable().references('id').inTable('template_exercises').onDelete('CASCADE');
    t.text('set_type').notNullable().defaultTo('Normal');
    t.integer('target_reps');
    t.decimal('target_weight_kg', 6, 2);
    t.integer('target_duration_seconds');
    t.integer('order_index').notNullable().defaultTo(0);
  });

  // FK from workouts.template_id once table exists
  await knex.raw(
    `ALTER TABLE workouts ADD CONSTRAINT workouts_template_fk
       FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE SET NULL`,
  );

  // ── ROUTINES ──────────────────────────────────────────
  await knex.schema.createTable('routines', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('name').notNullable();
    t.text('description');
    t.boolean('is_active').notNullable().defaultTo(false);
    t.date('started_at');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('routine_days', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('routine_id').notNullable().references('id').inTable('routines').onDelete('CASCADE');
    t.integer('day_of_week').notNullable(); // 0 = Sun … 6 = Sat
    t.uuid('template_id').references('id').inTable('workout_templates').onDelete('SET NULL');
    t.boolean('is_rest_day').notNullable().defaultTo(false);
    t.unique(['routine_id', 'day_of_week']);
  });

  await knex.raw(
    `ALTER TABLE workouts ADD CONSTRAINT workouts_routine_day_fk
       FOREIGN KEY (routine_day_id) REFERENCES routine_days(id) ON DELETE SET NULL`,
  );

  // ── CARDIO ────────────────────────────────────────────
  await knex.schema.createTable('cardio_sessions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('activity_type').notNullable();
    t.date('date').notNullable().defaultTo(knex.raw('CURRENT_DATE'));
    t.integer('duration_minutes').notNullable();
    t.decimal('distance_km', 8, 2);
    t.decimal('avg_pace_min_per_km', 6, 2);
    t.integer('hr_zone'); // 1..5
    t.integer('stars');
    t.text('notes');
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
  await knex.raw(`ALTER TABLE cardio_sessions ADD CONSTRAINT cardio_sessions_stars_chk
    CHECK (stars IS NULL OR stars BETWEEN 1 AND 5)`);
  await knex.raw(`ALTER TABLE cardio_sessions ADD CONSTRAINT cardio_sessions_hr_chk
    CHECK (hr_zone IS NULL OR hr_zone BETWEEN 1 AND 5)`);

  // ── BODY MEASUREMENTS: extend existing weight_entries ──
  await knex.schema.alterTable('weight_entries', (t) => {
    t.decimal('neck_cm', 5, 1);
    t.text('photo_uri'); // local URI; not synced
  });

  // ── REST DAYS (intentional rest) ──────────────────────
  await knex.schema.createTable('rest_days', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.date('date').notNullable().unique();
    t.text('notes');
    t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // ── USER SETTINGS (single row) ────────────────────────
  await knex.schema.createTable('user_settings', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.text('weight_unit').notNullable().defaultTo('kg'); // 'kg' | 'lbs'
    t.text('distance_unit').notNullable().defaultTo('km'); // 'km' | 'mi'
    t.integer('default_rest_seconds').notNullable().defaultTo(90);
    t.boolean('auto_start_rest').notNullable().defaultTo(true);
    t.text('one_rm_formula').notNullable().defaultTo('Epley'); // Epley | Brzycki | Lander
    t.boolean('week_starts_monday').notNullable().defaultTo(true);
    t.integer('barbell_weight_kg').notNullable().defaultTo(20);
    t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Seed single settings row
  await knex('user_settings').insert({});

  // ── SEED EXERCISE LIBRARY (100+) ──────────────────────
  const seed: {
    name: string; muscle_primary: string; muscle_secondary: string[]; equipment: string; exercise_type: string;
  }[] = [
    // Chest
    { name: 'Bench Press',              muscle_primary: 'Chest',  muscle_secondary: ['Triceps','Shoulders'], equipment: 'Barbell',  exercise_type: 'compound' },
    { name: 'Incline Bench Press',      muscle_primary: 'Chest',  muscle_secondary: ['Triceps','Shoulders'], equipment: 'Barbell',  exercise_type: 'compound' },
    { name: 'Decline Bench Press',      muscle_primary: 'Chest',  muscle_secondary: ['Triceps'],             equipment: 'Barbell',  exercise_type: 'compound' },
    { name: 'Dumbbell Bench Press',     muscle_primary: 'Chest',  muscle_secondary: ['Triceps','Shoulders'], equipment: 'Dumbbell', exercise_type: 'compound' },
    { name: 'Incline Dumbbell Press',   muscle_primary: 'Chest',  muscle_secondary: ['Triceps','Shoulders'], equipment: 'Dumbbell', exercise_type: 'compound' },
    { name: 'Dumbbell Fly',             muscle_primary: 'Chest',  muscle_secondary: [],                       equipment: 'Dumbbell', exercise_type: 'isolation' },
    { name: 'Incline Dumbbell Fly',     muscle_primary: 'Chest',  muscle_secondary: [],                       equipment: 'Dumbbell', exercise_type: 'isolation' },
    { name: 'Cable Fly',                muscle_primary: 'Chest',  muscle_secondary: [],                       equipment: 'Cable',    exercise_type: 'isolation' },
    { name: 'Cable Crossover',          muscle_primary: 'Chest',  muscle_secondary: [],                       equipment: 'Cable',    exercise_type: 'isolation' },
    { name: 'Pec Deck',                 muscle_primary: 'Chest',  muscle_secondary: [],                       equipment: 'Machine',  exercise_type: 'isolation' },
    { name: 'Push-up',                  muscle_primary: 'Chest',  muscle_secondary: ['Triceps','Core'],       equipment: 'Bodyweight', exercise_type: 'compound' },
    { name: 'Dips (Chest)',             muscle_primary: 'Chest',  muscle_secondary: ['Triceps'],              equipment: 'Bodyweight', exercise_type: 'compound' },

    // Back
    { name: 'Deadlift',                 muscle_primary: 'Back',   muscle_secondary: ['Glutes','Hamstrings','Forearms'], equipment: 'Barbell',  exercise_type: 'compound' },
    { name: 'Romanian Deadlift',        muscle_primary: 'Hamstrings', muscle_secondary: ['Glutes','Back'],     equipment: 'Barbell',  exercise_type: 'compound' },
    { name: 'Bent-over Row',            muscle_primary: 'Back',   muscle_secondary: ['Biceps','Forearms'],     equipment: 'Barbell',  exercise_type: 'compound' },
    { name: 'Pendlay Row',              muscle_primary: 'Back',   muscle_secondary: ['Biceps'],                equipment: 'Barbell',  exercise_type: 'compound' },
    { name: 'T-Bar Row',                muscle_primary: 'Back',   muscle_secondary: ['Biceps'],                equipment: 'Barbell',  exercise_type: 'compound' },
    { name: 'Dumbbell Row',             muscle_primary: 'Back',   muscle_secondary: ['Biceps','Forearms'],     equipment: 'Dumbbell', exercise_type: 'compound' },
    { name: 'Pull-up',                  muscle_primary: 'Back',   muscle_secondary: ['Biceps'],                equipment: 'Bodyweight', exercise_type: 'compound' },
    { name: 'Chin-up',                  muscle_primary: 'Back',   muscle_secondary: ['Biceps'],                equipment: 'Bodyweight', exercise_type: 'compound' },
    { name: 'Lat Pulldown',             muscle_primary: 'Back',   muscle_secondary: ['Biceps'],                equipment: 'Cable',    exercise_type: 'compound' },
    { name: 'Seated Cable Row',         muscle_primary: 'Back',   muscle_secondary: ['Biceps','Forearms'],     equipment: 'Cable',    exercise_type: 'compound' },
    { name: 'Face Pull',                muscle_primary: 'Shoulders', muscle_secondary: ['Back'],               equipment: 'Cable',    exercise_type: 'isolation' },
    { name: 'Straight Arm Pulldown',    muscle_primary: 'Back',   muscle_secondary: [],                        equipment: 'Cable',    exercise_type: 'isolation' },
    { name: 'Hyperextension',           muscle_primary: 'Back',   muscle_secondary: ['Glutes','Hamstrings'],   equipment: 'Bodyweight', exercise_type: 'isolation' },

    // Shoulders
    { name: 'Overhead Press',           muscle_primary: 'Shoulders', muscle_secondary: ['Triceps','Core'],     equipment: 'Barbell',  exercise_type: 'compound' },
    { name: 'Push Press',               muscle_primary: 'Shoulders', muscle_secondary: ['Triceps','Quads'],    equipment: 'Barbell',  exercise_type: 'compound' },
    { name: 'Dumbbell Shoulder Press',  muscle_primary: 'Shoulders', muscle_secondary: ['Triceps'],            equipment: 'Dumbbell', exercise_type: 'compound' },
    { name: 'Arnold Press',             muscle_primary: 'Shoulders', muscle_secondary: ['Triceps'],            equipment: 'Dumbbell', exercise_type: 'compound' },
    { name: 'Lateral Raise',            muscle_primary: 'Shoulders', muscle_secondary: [],                      equipment: 'Dumbbell', exercise_type: 'isolation' },
    { name: 'Cable Lateral Raise',      muscle_primary: 'Shoulders', muscle_secondary: [],                      equipment: 'Cable',    exercise_type: 'isolation' },
    { name: 'Front Raise',              muscle_primary: 'Shoulders', muscle_secondary: [],                      equipment: 'Dumbbell', exercise_type: 'isolation' },
    { name: 'Rear Delt Fly',            muscle_primary: 'Shoulders', muscle_secondary: ['Back'],               equipment: 'Dumbbell', exercise_type: 'isolation' },
    { name: 'Upright Row',              muscle_primary: 'Shoulders', muscle_secondary: ['Biceps'],             equipment: 'Barbell',  exercise_type: 'compound' },
    { name: 'Shrug',                    muscle_primary: 'Shoulders', muscle_secondary: [],                      equipment: 'Barbell',  exercise_type: 'isolation' },
    { name: 'Dumbbell Shrug',           muscle_primary: 'Shoulders', muscle_secondary: [],                      equipment: 'Dumbbell', exercise_type: 'isolation' },

    // Biceps
    { name: 'Barbell Curl',             muscle_primary: 'Biceps', muscle_secondary: ['Forearms'], equipment: 'Barbell',  exercise_type: 'isolation' },
    { name: 'EZ-Bar Curl',              muscle_primary: 'Biceps', muscle_secondary: ['Forearms'], equipment: 'Barbell',  exercise_type: 'isolation' },
    { name: 'Dumbbell Curl',            muscle_primary: 'Biceps', muscle_secondary: ['Forearms'], equipment: 'Dumbbell', exercise_type: 'isolation' },
    { name: 'Hammer Curl',              muscle_primary: 'Biceps', muscle_secondary: ['Forearms'], equipment: 'Dumbbell', exercise_type: 'isolation' },
    { name: 'Preacher Curl',            muscle_primary: 'Biceps', muscle_secondary: [],            equipment: 'Barbell',  exercise_type: 'isolation' },
    { name: 'Incline Dumbbell Curl',    muscle_primary: 'Biceps', muscle_secondary: [],            equipment: 'Dumbbell', exercise_type: 'isolation' },
    { name: 'Concentration Curl',      muscle_primary: 'Biceps', muscle_secondary: [],            equipment: 'Dumbbell', exercise_type: 'isolation' },
    { name: 'Cable Curl',              muscle_primary: 'Biceps', muscle_secondary: [],            equipment: 'Cable',    exercise_type: 'isolation' },

    // Triceps
    { name: 'Close-grip Bench Press',   muscle_primary: 'Triceps', muscle_secondary: ['Chest','Shoulders'], equipment: 'Barbell',  exercise_type: 'compound' },
    { name: 'Tricep Dips',              muscle_primary: 'Triceps', muscle_secondary: ['Chest'],              equipment: 'Bodyweight', exercise_type: 'compound' },
    { name: 'Skull Crusher',            muscle_primary: 'Triceps', muscle_secondary: [],                      equipment: 'Barbell',  exercise_type: 'isolation' },
    { name: 'Tricep Pushdown',          muscle_primary: 'Triceps', muscle_secondary: [],                      equipment: 'Cable',    exercise_type: 'isolation' },
    { name: 'Rope Pushdown',            muscle_primary: 'Triceps', muscle_secondary: [],                      equipment: 'Cable',    exercise_type: 'isolation' },
    { name: 'Overhead Tricep Extension',muscle_primary: 'Triceps', muscle_secondary: [],                      equipment: 'Dumbbell', exercise_type: 'isolation' },
    { name: 'Tricep Kickback',          muscle_primary: 'Triceps', muscle_secondary: [],                      equipment: 'Dumbbell', exercise_type: 'isolation' },
    { name: 'Diamond Push-up',          muscle_primary: 'Triceps', muscle_secondary: ['Chest'],              equipment: 'Bodyweight', exercise_type: 'compound' },

    // Forearms
    { name: 'Wrist Curl',               muscle_primary: 'Forearms', muscle_secondary: [], equipment: 'Barbell',  exercise_type: 'isolation' },
    { name: 'Reverse Wrist Curl',       muscle_primary: 'Forearms', muscle_secondary: [], equipment: 'Barbell',  exercise_type: 'isolation' },
    { name: 'Reverse Curl',             muscle_primary: 'Forearms', muscle_secondary: ['Biceps'], equipment: 'Barbell', exercise_type: 'isolation' },
    { name: 'Farmer\'s Carry',          muscle_primary: 'Forearms', muscle_secondary: ['Core','Full Body'], equipment: 'Dumbbell', exercise_type: 'compound' },

    // Core
    { name: 'Plank',                    muscle_primary: 'Core', muscle_secondary: ['Shoulders'], equipment: 'Bodyweight', exercise_type: 'isolation' },
    { name: 'Side Plank',               muscle_primary: 'Core', muscle_secondary: [],            equipment: 'Bodyweight', exercise_type: 'isolation' },
    { name: 'Crunch',                   muscle_primary: 'Core', muscle_secondary: [],            equipment: 'Bodyweight', exercise_type: 'isolation' },
    { name: 'Sit-up',                   muscle_primary: 'Core', muscle_secondary: [],            equipment: 'Bodyweight', exercise_type: 'isolation' },
    { name: 'Russian Twist',            muscle_primary: 'Core', muscle_secondary: [],            equipment: 'Bodyweight', exercise_type: 'isolation' },
    { name: 'Hanging Leg Raise',        muscle_primary: 'Core', muscle_secondary: [],            equipment: 'Bodyweight', exercise_type: 'isolation' },
    { name: 'Cable Crunch',             muscle_primary: 'Core', muscle_secondary: [],            equipment: 'Cable',      exercise_type: 'isolation' },
    { name: 'Ab Wheel Rollout',         muscle_primary: 'Core', muscle_secondary: ['Shoulders'], equipment: 'Bodyweight', exercise_type: 'isolation' },
    { name: 'Mountain Climber',         muscle_primary: 'Core', muscle_secondary: ['Cardio'],    equipment: 'Bodyweight', exercise_type: 'compound' },
    { name: 'Bicycle Crunch',           muscle_primary: 'Core', muscle_secondary: [],            equipment: 'Bodyweight', exercise_type: 'isolation' },

    // Quads
    { name: 'Back Squat',               muscle_primary: 'Quads', muscle_secondary: ['Glutes','Hamstrings','Core'], equipment: 'Barbell', exercise_type: 'compound' },
    { name: 'Front Squat',              muscle_primary: 'Quads', muscle_secondary: ['Core'],                       equipment: 'Barbell', exercise_type: 'compound' },
    { name: 'Goblet Squat',             muscle_primary: 'Quads', muscle_secondary: ['Glutes','Core'],              equipment: 'Dumbbell', exercise_type: 'compound' },
    { name: 'Bulgarian Split Squat',    muscle_primary: 'Quads', muscle_secondary: ['Glutes'],                     equipment: 'Dumbbell', exercise_type: 'compound' },
    { name: 'Lunge',                    muscle_primary: 'Quads', muscle_secondary: ['Glutes'],                     equipment: 'Dumbbell', exercise_type: 'compound' },
    { name: 'Walking Lunge',            muscle_primary: 'Quads', muscle_secondary: ['Glutes'],                     equipment: 'Dumbbell', exercise_type: 'compound' },
    { name: 'Leg Press',                muscle_primary: 'Quads', muscle_secondary: ['Glutes'],                     equipment: 'Machine',  exercise_type: 'compound' },
    { name: 'Leg Extension',            muscle_primary: 'Quads', muscle_secondary: [],                              equipment: 'Machine',  exercise_type: 'isolation' },
    { name: 'Hack Squat',               muscle_primary: 'Quads', muscle_secondary: ['Glutes'],                     equipment: 'Machine',  exercise_type: 'compound' },
    { name: 'Box Jump',                 muscle_primary: 'Quads', muscle_secondary: ['Calves'],                     equipment: 'Bodyweight', exercise_type: 'compound' },

    // Hamstrings
    { name: 'Lying Leg Curl',           muscle_primary: 'Hamstrings', muscle_secondary: [], equipment: 'Machine', exercise_type: 'isolation' },
    { name: 'Seated Leg Curl',          muscle_primary: 'Hamstrings', muscle_secondary: [], equipment: 'Machine', exercise_type: 'isolation' },
    { name: 'Good Morning',             muscle_primary: 'Hamstrings', muscle_secondary: ['Glutes','Back'], equipment: 'Barbell', exercise_type: 'compound' },
    { name: 'Stiff-Leg Deadlift',       muscle_primary: 'Hamstrings', muscle_secondary: ['Glutes','Back'], equipment: 'Barbell', exercise_type: 'compound' },

    // Glutes
    { name: 'Hip Thrust',               muscle_primary: 'Glutes', muscle_secondary: ['Hamstrings'], equipment: 'Barbell',    exercise_type: 'compound' },
    { name: 'Glute Bridge',             muscle_primary: 'Glutes', muscle_secondary: ['Hamstrings'], equipment: 'Bodyweight', exercise_type: 'isolation' },
    { name: 'Cable Kickback',           muscle_primary: 'Glutes', muscle_secondary: [],              equipment: 'Cable',     exercise_type: 'isolation' },
    { name: 'Sumo Deadlift',            muscle_primary: 'Glutes', muscle_secondary: ['Hamstrings','Back'], equipment: 'Barbell', exercise_type: 'compound' },

    // Calves
    { name: 'Standing Calf Raise',      muscle_primary: 'Calves', muscle_secondary: [], equipment: 'Machine',    exercise_type: 'isolation' },
    { name: 'Seated Calf Raise',        muscle_primary: 'Calves', muscle_secondary: [], equipment: 'Machine',    exercise_type: 'isolation' },
    { name: 'Donkey Calf Raise',        muscle_primary: 'Calves', muscle_secondary: [], equipment: 'Bodyweight', exercise_type: 'isolation' },

    // Full Body / Olympic / Conditioning
    { name: 'Clean and Press',          muscle_primary: 'Full Body', muscle_secondary: ['Shoulders','Quads','Back'], equipment: 'Barbell',   exercise_type: 'compound' },
    { name: 'Snatch',                   muscle_primary: 'Full Body', muscle_secondary: ['Shoulders','Quads','Back'], equipment: 'Barbell',   exercise_type: 'compound' },
    { name: 'Kettlebell Swing',         muscle_primary: 'Full Body', muscle_secondary: ['Glutes','Hamstrings','Core'], equipment: 'Kettlebell', exercise_type: 'compound' },
    { name: 'Turkish Get-Up',           muscle_primary: 'Full Body', muscle_secondary: ['Core','Shoulders'],         equipment: 'Kettlebell', exercise_type: 'compound' },
    { name: 'Burpee',                   muscle_primary: 'Full Body', muscle_secondary: ['Cardio','Chest'],            equipment: 'Bodyweight', exercise_type: 'compound' },
    { name: 'Thruster',                 muscle_primary: 'Full Body', muscle_secondary: ['Shoulders','Quads'],         equipment: 'Barbell',   exercise_type: 'compound' },
    { name: 'Battle Ropes',             muscle_primary: 'Full Body', muscle_secondary: ['Cardio','Shoulders'],        equipment: 'Bodyweight', exercise_type: 'compound' },

    // Resistance band
    { name: 'Band Pull Apart',          muscle_primary: 'Shoulders', muscle_secondary: ['Back'], equipment: 'Resistance Band', exercise_type: 'isolation' },
    { name: 'Banded Squat',             muscle_primary: 'Quads',     muscle_secondary: ['Glutes'], equipment: 'Resistance Band', exercise_type: 'compound' },
    { name: 'Banded Row',               muscle_primary: 'Back',      muscle_secondary: ['Biceps'], equipment: 'Resistance Band', exercise_type: 'compound' },

    // Cardio
    { name: 'Running',                  muscle_primary: 'Cardio', muscle_secondary: ['Quads','Calves'], equipment: 'Bodyweight',    exercise_type: 'cardio' },
    { name: 'Treadmill',                muscle_primary: 'Cardio', muscle_secondary: ['Quads','Calves'], equipment: 'Cardio Machine', exercise_type: 'cardio' },
    { name: 'Cycling',                  muscle_primary: 'Cardio', muscle_secondary: ['Quads'],         equipment: 'Cardio Machine', exercise_type: 'cardio' },
    { name: 'Stationary Bike',          muscle_primary: 'Cardio', muscle_secondary: ['Quads'],         equipment: 'Cardio Machine', exercise_type: 'cardio' },
    { name: 'Rowing Machine',           muscle_primary: 'Cardio', muscle_secondary: ['Back','Full Body'], equipment: 'Cardio Machine', exercise_type: 'cardio' },
    { name: 'Elliptical',               muscle_primary: 'Cardio', muscle_secondary: ['Full Body'],     equipment: 'Cardio Machine', exercise_type: 'cardio' },
    { name: 'Stairmaster',              muscle_primary: 'Cardio', muscle_secondary: ['Quads','Glutes'], equipment: 'Cardio Machine', exercise_type: 'cardio' },
    { name: 'Jump Rope',                muscle_primary: 'Cardio', muscle_secondary: ['Calves'],        equipment: 'Bodyweight',    exercise_type: 'cardio' },
    { name: 'Swimming',                 muscle_primary: 'Cardio', muscle_secondary: ['Full Body'],     equipment: 'Bodyweight',    exercise_type: 'cardio' },
    { name: 'HIIT',                     muscle_primary: 'Cardio', muscle_secondary: ['Full Body'],     equipment: 'Bodyweight',    exercise_type: 'cardio' },
    { name: 'Badminton',                muscle_primary: 'Cardio', muscle_secondary: ['Full Body'],     equipment: 'Bodyweight',    exercise_type: 'cardio' },
    { name: 'Dance',                    muscle_primary: 'Cardio', muscle_secondary: ['Full Body'],     equipment: 'Bodyweight',    exercise_type: 'cardio' },
  ];

  await knex('exercises').insert(seed).onConflict('name').ignore();
}

export async function down(knex: Knex): Promise<void> {
  // unwind FK constraints + tables in reverse order
  await knex.raw('ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_template_fk');
  await knex.raw('ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_routine_day_fk');

  await knex.schema.dropTableIfExists('user_settings');
  await knex.schema.dropTableIfExists('rest_days');
  await knex.schema.alterTable('weight_entries', (t) => {
    t.dropColumn('neck_cm');
    t.dropColumn('photo_uri');
  });
  await knex.schema.dropTableIfExists('cardio_sessions');
  await knex.schema.dropTableIfExists('routine_days');
  await knex.schema.dropTableIfExists('routines');
  await knex.schema.dropTableIfExists('template_sets');
  await knex.schema.dropTableIfExists('template_exercises');
  await knex.schema.dropTableIfExists('workout_templates');

  await knex.schema.alterTable('personal_records', (t) => {
    t.dropColumn('exercise_id');
    t.dropColumn('best_volume_kg');
    t.dropColumn('best_est_one_rm_kg');
  });

  await knex.raw(`ALTER TABLE workouts DROP CONSTRAINT IF EXISTS workouts_type_chk`);
  await knex.raw(`ALTER TABLE workouts ADD CONSTRAINT workouts_type_chk
    CHECK (type IN ('Strength','Cardio','Flexibility','Combat'))`);

  await knex.schema.alterTable('workouts', (t) => {
    t.dropColumn('mood_tag');
    t.dropColumn('total_volume_kg');
    t.dropColumn('total_sets');
    t.dropColumn('total_reps');
    t.dropColumn('template_id');
    t.dropColumn('routine_day_id');
  });

  await knex.raw(`ALTER TABLE exercise_sets DROP CONSTRAINT IF EXISTS exercise_sets_type_chk`);
  await knex.schema.alterTable('exercise_sets', (t) => {
    t.dropColumn('set_type');
    t.dropColumn('rpe');
  });

  await knex.schema.alterTable('workout_exercises', (t) => {
    t.dropColumn('exercise_id');
    t.dropColumn('superset_group_id');
    t.dropColumn('notes');
  });

  await knex.schema.dropTableIfExists('exercises');
}
