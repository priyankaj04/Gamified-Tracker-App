import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP } from '@/lib/xp';
import { todayISO } from '@/lib/date';

// ─── Profile ────────────────────────────────────────────────
const profileFromRow = (r: any) =>
  r
    ? {
        id: r.id,
        heightCm: r.height_cm ? Number(r.height_cm) : null,
        dateOfBirth: r.date_of_birth,
        gender: r.gender as 'male' | 'female' | 'other' | null,
        activityLevel: r.activity_level,
      }
    : null;

export const getProfile = async () => {
  const sb = supabase();
  const { data } = await sb.from('user_profile').select('*').limit(1).maybeSingle();
  return profileFromRow(data);
};

export const upsertProfile = async (body: {
  heightCm?: number;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
}) => {
  const sb = supabase();
  const update: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (body.heightCm !== undefined) update.height_cm = body.heightCm;
  if (body.dateOfBirth !== undefined) update.date_of_birth = body.dateOfBirth;
  if (body.gender !== undefined) update.gender = body.gender;
  if (body.activityLevel !== undefined) update.activity_level = body.activityLevel;
  const { data: existing } = await sb.from('user_profile').select('id').limit(1).maybeSingle();
  if (existing) {
    const { data, error } = await sb
      .from('user_profile')
      .update(update)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return profileFromRow(data);
  }
  const { data, error } = await sb.from('user_profile').insert(update).select().single();
  if (error) throw error;
  return profileFromRow(data);
};

// ─── Weight: extended stats ─────────────────────────────────
const calcBmi = (weightKg: number, heightCm: number) => {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
};

const bmiCategory = (bmi: number) => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

const idealRange = (heightCm: number) => {
  const h = heightCm / 100;
  return {
    minKg: Math.round(18.5 * h * h * 10) / 10,
    maxKg: Math.round(24.9 * h * h * 10) / 10,
  };
};

export const getWeightStats = async () => {
  const sb = supabase();
  const { data: entries } = await sb
    .from('weight_entries')
    .select('*')
    .order('date', { ascending: true });
  const { data: goalRow } = await sb.from('body_goal').select('*').limit(1).maybeSingle();
  const profile = await getProfile();

  if (!entries || entries.length === 0) {
    return {
      startWeight: null,
      currentWeight: null,
      bestWeight: null,
      highestWeight: null,
      totalChange: 0,
      totalChangePct: 0,
      weeklyAverage: null,
      projectedCompletionDate: null,
      bmi: null,
      bmiCategory: null,
      idealRange: profile?.heightCm ? idealRange(profile.heightCm) : null,
    };
  }

  const weights = entries.map((e) => Number(e.weight_kg));
  const startWeight = weights[0];
  const currentWeight = weights[weights.length - 1];
  const bestWeight = Math.min(...weights);
  const highestWeight = Math.max(...weights);
  const totalChange = currentWeight - startWeight;
  const totalChangePct = startWeight > 0 ? (totalChange / startWeight) * 100 : 0;

  // weekly average: current calendar week (ISO week)
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  const weekEntries = entries.filter((e) => new Date(e.date) >= start);
  const weeklyAverage = weekEntries.length
    ? weekEntries.reduce((s, e) => s + Number(e.weight_kg), 0) / weekEntries.length
    : null;

  // projected completion: weekly rate × weeks remaining
  let projectedCompletionDate: string | null = null;
  if (goalRow && entries.length >= 2) {
    const first = entries[0];
    const last = entries[entries.length - 1];
    const days =
      (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24);
    if (days > 0) {
      const rate = (Number(last.weight_kg) - Number(first.weight_kg)) / days; // kg per day
      const target = Number(goalRow.target_weight_kg);
      const remaining = target - Number(last.weight_kg);
      if (rate !== 0 && Math.sign(rate) === Math.sign(remaining)) {
        const daysToTarget = remaining / rate;
        const eta = new Date(new Date(last.date).getTime() + daysToTarget * 86400_000);
        projectedCompletionDate = eta.toISOString().slice(0, 10);
      }
    }
  }

  const bmi =
    profile?.heightCm && currentWeight ? calcBmi(currentWeight, profile.heightCm) : null;

  return {
    startWeight,
    currentWeight,
    bestWeight,
    highestWeight,
    totalChange: Math.round(totalChange * 10) / 10,
    totalChangePct: Math.round(totalChangePct * 10) / 10,
    weeklyAverage: weeklyAverage ? Math.round(weeklyAverage * 10) / 10 : null,
    projectedCompletionDate,
    bmi,
    bmiCategory: bmi ? bmiCategory(bmi) : null,
    idealRange: profile?.heightCm ? idealRange(profile.heightCm) : null,
  };
};

// ─── Measurements ───────────────────────────────────────────
const mFromRow = (r: any) => ({
  id: r.id,
  date: r.date,
  chestCm: r.chest_cm ? Number(r.chest_cm) : null,
  waistCm: r.waist_cm ? Number(r.waist_cm) : null,
  hipsCm: r.hips_cm ? Number(r.hips_cm) : null,
  bicepsCm: r.biceps_cm ? Number(r.biceps_cm) : null,
  thighsCm: r.thighs_cm ? Number(r.thighs_cm) : null,
  neckCm: r.neck_cm ? Number(r.neck_cm) : null,
  shouldersCm: r.shoulders_cm ? Number(r.shoulders_cm) : null,
  calvesCm: r.calves_cm ? Number(r.calves_cm) : null,
  forearmsCm: r.forearms_cm ? Number(r.forearms_cm) : null,
  notes: r.notes,
});

export const listMeasurements = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('body_measurements')
    .select('*')
    .order('date', { ascending: false });
  return (data ?? []).map(mFromRow);
};

export const latestMeasurement = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('body_measurements')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mFromRow(data) : null;
};

export const upsertMeasurement = async (body: {
  date?: string;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  bicepsCm?: number;
  thighsCm?: number;
  neckCm?: number;
  shouldersCm?: number;
  calvesCm?: number;
  forearmsCm?: number;
  notes?: string;
}) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  const row: Record<string, any> = { date };
  if (body.chestCm !== undefined) row.chest_cm = body.chestCm;
  if (body.waistCm !== undefined) row.waist_cm = body.waistCm;
  if (body.hipsCm !== undefined) row.hips_cm = body.hipsCm;
  if (body.bicepsCm !== undefined) row.biceps_cm = body.bicepsCm;
  if (body.thighsCm !== undefined) row.thighs_cm = body.thighsCm;
  if (body.neckCm !== undefined) row.neck_cm = body.neckCm;
  if (body.shouldersCm !== undefined) row.shoulders_cm = body.shouldersCm;
  if (body.calvesCm !== undefined) row.calves_cm = body.calvesCm;
  if (body.forearmsCm !== undefined) row.forearms_cm = body.forearmsCm;
  if (body.notes !== undefined) row.notes = body.notes;
  const { data, error } = await sb
    .from('body_measurements')
    .upsert(row, { onConflict: 'date' })
    .select()
    .single();
  if (error) throw error;
  return mFromRow(data);
};

export const updateMeasurement = async (id: string, body: any) => {
  const sb = supabase();
  const row: Record<string, any> = {};
  if (body.chestCm !== undefined) row.chest_cm = body.chestCm;
  if (body.waistCm !== undefined) row.waist_cm = body.waistCm;
  if (body.hipsCm !== undefined) row.hips_cm = body.hipsCm;
  if (body.bicepsCm !== undefined) row.biceps_cm = body.bicepsCm;
  if (body.thighsCm !== undefined) row.thighs_cm = body.thighsCm;
  if (body.neckCm !== undefined) row.neck_cm = body.neckCm;
  if (body.shouldersCm !== undefined) row.shoulders_cm = body.shouldersCm;
  if (body.calvesCm !== undefined) row.calves_cm = body.calvesCm;
  if (body.forearmsCm !== undefined) row.forearms_cm = body.forearmsCm;
  if (body.notes !== undefined) row.notes = body.notes;
  const { data, error } = await sb
    .from('body_measurements')
    .update(row)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mFromRow(data);
};

export const deleteMeasurement = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('body_measurements').delete().eq('id', id);
  if (error) throw error;
};

export const compareMeasurements = async (date1: string, date2: string) => {
  const sb = supabase();
  const { data } = await sb
    .from('body_measurements')
    .select('*')
    .in('date', [date1, date2]);
  const map = new Map((data ?? []).map((r: any) => [r.date, mFromRow(r)]));
  const a = map.get(date1) ?? null;
  const b = map.get(date2) ?? null;
  const fields: (keyof ReturnType<typeof mFromRow>)[] = [
    'chestCm',
    'waistCm',
    'hipsCm',
    'bicepsCm',
    'thighsCm',
    'neckCm',
    'shouldersCm',
    'calvesCm',
    'forearmsCm',
  ];
  const delta: Record<string, number | null> = {};
  fields.forEach((f) => {
    if (a && b && a[f] != null && b[f] != null) {
      delta[f as string] = Number(((b[f] as number) - (a[f] as number)).toFixed(1));
    } else {
      delta[f as string] = null;
    }
  });
  return { a, b, delta };
};

const whrCategory = (ratio: number, gender: 'male' | 'female' | 'other' | null | undefined) => {
  // Use male thresholds for 'male'/'other' or null
  if (gender === 'female') {
    if (ratio < 0.8) return 'Excellent';
    if (ratio < 0.85) return 'Good';
    if (ratio < 0.9) return 'Average';
    return 'At Risk';
  }
  if (ratio < 0.9) return 'Excellent';
  if (ratio < 0.95) return 'Good';
  if (ratio < 1.0) return 'Average';
  return 'At Risk';
};

export const measurementsStats = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('body_measurements')
    .select('*')
    .order('date', { ascending: true });
  const profile = await getProfile();
  if (!data || data.length === 0) {
    return { totalLost: {}, waistToHipRatio: null, waistToHipCategory: null, trend: {} };
  }
  const rows = data.map(mFromRow);
  const first = rows[0];
  const latest = rows[rows.length - 1];
  const fields = [
    'chestCm',
    'waistCm',
    'hipsCm',
    'bicepsCm',
    'thighsCm',
    'neckCm',
    'shouldersCm',
    'calvesCm',
    'forearmsCm',
  ] as const;
  const totalLost: Record<string, number> = {};
  const trend: Record<string, 'up' | 'down' | 'flat'> = {};
  fields.forEach((f) => {
    const a = first[f];
    const b = latest[f];
    if (a != null && b != null) {
      const diff = b - a;
      totalLost[f] = Math.round(-diff * 10) / 10; // positive = lost
      trend[f] = diff > 0.2 ? 'up' : diff < -0.2 ? 'down' : 'flat';
    }
  });
  let waistToHipRatio: number | null = null;
  let waistToHipCategory: string | null = null;
  if (latest.waistCm && latest.hipsCm) {
    waistToHipRatio = Math.round((latest.waistCm / latest.hipsCm) * 100) / 100;
    waistToHipCategory = whrCategory(waistToHipRatio, profile?.gender);
  }
  return { totalLost, waistToHipRatio, waistToHipCategory, trend };
};

// ─── Composition ────────────────────────────────────────────
const bodyFatCategory = (bf: number, gender: string | null | undefined) => {
  if (gender === 'female') {
    if (bf < 13) return 'Essential';
    if (bf < 21) return 'Athletic';
    if (bf < 25) return 'Fitness';
    if (bf < 32) return 'Average';
    return 'Obese';
  }
  if (bf < 6) return 'Essential';
  if (bf < 14) return 'Athletic';
  if (bf < 18) return 'Fitness';
  if (bf < 25) return 'Average';
  return 'Obese';
};

export const compositionHistory = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('weight_entries')
    .select('date, weight_kg, body_fat_pct')
    .not('body_fat_pct', 'is', null)
    .order('date', { ascending: true });
  return (data ?? []).map((r: any) => {
    const w = Number(r.weight_kg);
    const bf = Number(r.body_fat_pct);
    const leanMassKg = Math.round(w * (1 - bf / 100) * 10) / 10;
    const fatMassKg = Math.round(w * (bf / 100) * 10) / 10;
    return {
      date: r.date,
      weight: w,
      bodyFatPct: bf,
      leanMassKg,
      fatMassKg,
    };
  });
};

export const compositionStats = async () => {
  const history = await compositionHistory();
  const profile = await getProfile();
  if (history.length === 0) {
    return {
      currentBodyFatPct: null,
      category: null,
      leanMassKg: null,
      fatMassKg: null,
      recomposition: null,
    };
  }
  const latest = history[history.length - 1];
  const first = history[0];
  const cat = bodyFatCategory(latest.bodyFatPct, profile?.gender);
  let recomposition: null | { leanUp: boolean; fatDown: boolean } = null;
  if (history.length >= 2) {
    recomposition = {
      leanUp: latest.leanMassKg > first.leanMassKg,
      fatDown: latest.fatMassKg < first.fatMassKg,
    };
  }
  return {
    currentBodyFatPct: latest.bodyFatPct,
    category: cat,
    leanMassKg: latest.leanMassKg,
    fatMassKg: latest.fatMassKg,
    recomposition,
  };
};

// ─── Daily wellness (energy/mood) ───────────────────────────
const wellnessFromRow = (r: any) =>
  r
    ? {
        id: r.id,
        date: r.date,
        energyLevel: r.energy_level,
        mood: r.mood,
        stressLevel: r.stress_level,
        notes: r.notes,
      }
    : null;

export const upsertWellness = async (body: {
  date?: string;
  energyLevel?: number;
  mood?: number;
  stressLevel?: number;
  notes?: string;
}) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  const row: Record<string, any> = { date };
  if (body.energyLevel !== undefined) row.energy_level = body.energyLevel;
  if (body.mood !== undefined) row.mood = body.mood;
  if (body.stressLevel !== undefined) row.stress_level = body.stressLevel;
  if (body.notes !== undefined) row.notes = body.notes;
  const { data, error } = await sb
    .from('daily_wellness')
    .upsert(row, { onConflict: 'date' })
    .select()
    .single();
  if (error) throw error;
  return wellnessFromRow(data);
};

export const listWellness = async (params: { from?: string; to?: string }) => {
  const sb = supabase();
  let q = sb.from('daily_wellness').select('*').order('date', { ascending: false });
  if (params.from) q = q.gte('date', params.from);
  if (params.to) q = q.lte('date', params.to);
  const { data } = await q;
  return (data ?? []).map(wellnessFromRow);
};

export const todayWellness = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('daily_wellness')
    .select('*')
    .eq('date', todayISO())
    .maybeSingle();
  return wellnessFromRow(data);
};

export const wellnessStats = async () => {
  const sb = supabase();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  const { data } = await sb
    .from('daily_wellness')
    .select('*')
    .gte('date', from.toISOString().slice(0, 10));
  if (!data || data.length === 0) {
    return { avgEnergy: null, avgMood: null, avgStress: null, days: 0 };
  }
  const valid = (arr: number[]) => arr.filter((x): x is number => typeof x === 'number');
  const energy = valid(data.map((r: any) => r.energy_level));
  const mood = valid(data.map((r: any) => r.mood));
  const stress = valid(data.map((r: any) => r.stress_level));
  const avg = (xs: number[]) =>
    xs.length ? Math.round((xs.reduce((s, n) => s + n, 0) / xs.length) * 10) / 10 : null;
  return {
    avgEnergy: avg(energy),
    avgMood: avg(mood),
    avgStress: avg(stress),
    days: data.length,
  };
};

export const wellnessCorrelation = async () => {
  const sb = supabase();
  const from = new Date();
  from.setDate(from.getDate() - 89);
  const fromIso = from.toISOString().slice(0, 10);
  const { data: w } = await sb
    .from('daily_wellness')
    .select('date, mood, energy_level')
    .gte('date', fromIso);
  const { data: workouts } = await sb
    .from('workouts')
    .select('date')
    .gte('date', fromIso);
  const workoutDays = new Set((workouts ?? []).map((r: any) => r.date));
  const onDays: number[] = [];
  const offDays: number[] = [];
  const eOn: number[] = [];
  const eOff: number[] = [];
  (w ?? []).forEach((r: any) => {
    const inWorkout = workoutDays.has(r.date);
    if (r.mood != null) (inWorkout ? onDays : offDays).push(r.mood);
    if (r.energy_level != null) (inWorkout ? eOn : eOff).push(r.energy_level);
  });
  const avg = (xs: number[]) =>
    xs.length ? Math.round((xs.reduce((s, n) => s + n, 0) / xs.length) * 10) / 10 : null;
  return {
    workoutMood: avg(onDays),
    restMood: avg(offDays),
    workoutEnergy: avg(eOn),
    restEnergy: avg(eOff),
    workoutDayCount: onDays.length,
    restDayCount: offDays.length,
    enough: onDays.length >= 7 && offDays.length >= 7,
  };
};

// ─── Workout-body correlation ───────────────────────────────
export const weightWorkoutCorrelation = async () => {
  const sb = supabase();
  const { data: entries } = await sb
    .from('weight_entries')
    .select('date, weight_kg')
    .order('date', { ascending: true });
  const { data: workouts } = await sb.from('workouts').select('date, name');
  const workoutByDate = new Map<string, string>();
  (workouts ?? []).forEach((w: any) => workoutByDate.set(w.date, w.name));
  const rows = (entries ?? []).map((e: any) => ({
    date: e.date,
    weight: Number(e.weight_kg),
    hadWorkout: workoutByDate.has(e.date),
    workoutName: workoutByDate.get(e.date) ?? null,
  }));
  // Compute avg weight change on workout days vs rest days
  let workoutDelta = 0;
  let workoutCount = 0;
  let restDelta = 0;
  let restCount = 0;
  for (let i = 1; i < rows.length; i++) {
    const d = rows[i].weight - rows[i - 1].weight;
    if (rows[i].hadWorkout) {
      workoutDelta += d;
      workoutCount++;
    } else {
      restDelta += d;
      restCount++;
    }
  }
  return {
    rows,
    avgChangeOnWorkoutDays: workoutCount ? Math.round((workoutDelta / workoutCount) * 100) / 100 : null,
    avgChangeOnRestDays: restCount ? Math.round((restDelta / restCount) * 100) / 100 : null,
  };
};

// ─── Steps ──────────────────────────────────────────────────
const stepsFromRow = (r: any) => ({
  id: r.id,
  date: r.date,
  steps: r.steps,
  goal: r.goal,
  goalHit: r.goal_hit,
  xpEarned: r.xp_earned,
});

export const syncSteps = async (body: { date?: string; steps: number; goal?: number }) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  const goal = body.goal ?? 10000;
  const goalHit = body.steps >= goal;

  // Look up existing row
  const { data: existing } = await sb
    .from('step_logs')
    .select('*')
    .eq('date', date)
    .maybeSingle();

  let xpEarned = existing?.xp_earned ?? 0;
  let newTotalXp = 0;
  let badges: any[] = [];
  // Award XP once per day when goal flips from not-hit to hit
  if (goalHit && !existing?.goal_hit) {
    const award = await awardXp({ base: XP.HIT_STEP_GOAL, module: 'spirit', source: 'steps' });
    xpEarned = award.xpEarned;
    newTotalXp = award.newTotalXp;
    const streak = await updateStreak('spirit');
    badges = await checkBadges({ stepGoalStreak: streak.count, spiritStreak: streak.count });
  }

  const row = {
    date,
    steps: body.steps,
    goal,
    goal_hit: goalHit,
    xp_earned: xpEarned,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await sb
    .from('step_logs')
    .upsert(row, { onConflict: 'date' })
    .select()
    .single();
  if (error) throw error;
  return {
    log: stepsFromRow(data),
    xpEarned: goalHit && !existing?.goal_hit ? xpEarned : 0,
    newTotalXp,
    badgesUnlocked: badges,
  };
};

export const listSteps = async (params: { from?: string; to?: string }) => {
  const sb = supabase();
  let q = sb.from('step_logs').select('*').order('date', { ascending: false });
  if (params.from) q = q.gte('date', params.from);
  if (params.to) q = q.lte('date', params.to);
  const { data } = await q;
  return (data ?? []).map(stepsFromRow);
};

export const stepsStats = async () => {
  const sb = supabase();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  const { data: all } = await sb.from('step_logs').select('*');
  const { data: recent } = await sb
    .from('step_logs')
    .select('*')
    .gte('date', from.toISOString().slice(0, 10));
  const { data: streak } = await sb.from('streaks').select('*').eq('module', 'spirit').maybeSingle();
  const totalSteps = (all ?? []).reduce((s: number, r: any) => s + (r.steps ?? 0), 0);
  const last7 = (recent ?? []).slice(-7);
  const avg7 = last7.length
    ? Math.round(last7.reduce((s: number, r: any) => s + (r.steps ?? 0), 0) / last7.length)
    : 0;
  const daysGoalHit = (recent ?? []).filter((r: any) => r.goal_hit).length;
  return {
    totalStepsAllTime: totalSteps,
    avgDailySteps7d: avg7,
    currentStreak: streak?.count ?? 0,
    longestStreak: streak?.longest_streak ?? 0,
    daysGoalHit,
  };
};
