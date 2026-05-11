import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP } from '@/lib/xp';
import { todayISO } from '@/lib/date';

const entryFromRow = (r: any) => ({
  id: r.id,
  date: r.date,
  weightKg: Number(r.weight_kg),
  bodyFatPct: r.body_fat_pct != null ? Number(r.body_fat_pct) : null,
  bmi: r.bmi != null ? Number(r.bmi) : null,
  chestCm: r.chest_cm,
  waistCm: r.waist_cm,
  hipsCm: r.hips_cm,
  bicepsCm: r.biceps_cm,
  thighsCm: r.thighs_cm,
  notes: r.notes,
  xpEarned: r.xp_earned,
});

const goalFromRow = (r: any) =>
  r
    ? {
        id: r.id,
        startWeightKg: Number(r.start_weight_kg),
        targetWeightKg: Number(r.target_weight_kg),
        startDate: r.start_date,
        targetDate: r.target_date,
      }
    : null;

export const listWeight = async (params: { from?: string; to?: string }) => {
  const sb = supabase();
  let q = sb.from('weight_entries').select('*').order('date', { ascending: false });
  if (params.from) q = q.gte('date', params.from);
  if (params.to) q = q.lte('date', params.to);
  const { data: entries } = await q;
  const { data: goalRow } = await sb.from('body_goal').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle();
  const goal = goalFromRow(goalRow);
  const latest = entries?.[0];
  let progressPct = 0;
  if (goal && latest) {
    const start = goal.startWeightKg;
    const target = goal.targetWeightKg;
    const cur = Number(latest.weight_kg);
    const total = start - target;
    if (Math.abs(total) > 0.001) {
      progressPct = Math.max(0, Math.min(1, (start - cur) / total));
    } else {
      progressPct = cur <= target ? 1 : 0;
    }
  }
  return {
    entries: (entries ?? []).map(entryFromRow),
    goal,
    progressPct,
  };
};

interface CreateBody {
  date?: string;
  weightKg: number;
  bodyFatPct?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  bicepsCm?: number;
  thighsCm?: number;
  notes?: string;
}

export const createWeight = async (body: CreateBody) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  const { xpEarned, newTotalXp } = await awardXp({
    base: XP.LOG_WEIGHT,
    module: 'spirit',
    source: 'weight',
  });
  const { data: entry, error } = await sb
    .from('weight_entries')
    .upsert(
      {
        date,
        weight_kg: body.weightKg,
        body_fat_pct: body.bodyFatPct ?? null,
        chest_cm: body.chestCm ?? null,
        waist_cm: body.waistCm ?? null,
        hips_cm: body.hipsCm ?? null,
        biceps_cm: body.bicepsCm ?? null,
        thighs_cm: body.thighsCm ?? null,
        notes: body.notes ?? null,
        xp_earned: xpEarned,
      },
      { onConflict: 'date' },
    )
    .select()
    .single();
  if (error) throw error;

  const streak = await updateStreak('spirit');
  const { count } = await sb.from('weight_entries').select('id', { count: 'exact', head: true });

  const { data: goalRow } = await sb.from('body_goal').select('*').limit(1).maybeSingle();
  const goal = goalFromRow(goalRow);
  let goalHit = false;
  let goalXp = 0;
  if (goal) {
    const decreasing = goal.startWeightKg > goal.targetWeightKg;
    if ((decreasing && body.weightKg <= goal.targetWeightKg) || (!decreasing && body.weightKg >= goal.targetWeightKg)) {
      goalHit = true;
      const award = await awardXp({ base: XP.HIT_WEIGHT_GOAL, module: 'spirit', source: 'weight-goal' });
      goalXp = award.xpEarned;
    }
  }

  const badges = await checkBadges({
    weightLogCount: count ?? 0,
    spiritStreak: streak.count,
    goalHit,
  });

  return {
    entry: entryFromRow(entry),
    xpEarned: xpEarned + goalXp,
    newTotalXp: newTotalXp + goalXp,
    badgesUnlocked: badges,
  };
};

export const updateWeight = async (id: string, body: Partial<CreateBody>) => {
  const sb = supabase();
  const update: Record<string, any> = {};
  if (body.weightKg !== undefined) update.weight_kg = body.weightKg;
  if (body.bodyFatPct !== undefined) update.body_fat_pct = body.bodyFatPct;
  if (body.chestCm !== undefined) update.chest_cm = body.chestCm;
  if (body.waistCm !== undefined) update.waist_cm = body.waistCm;
  if (body.hipsCm !== undefined) update.hips_cm = body.hipsCm;
  if (body.bicepsCm !== undefined) update.biceps_cm = body.bicepsCm;
  if (body.thighsCm !== undefined) update.thighs_cm = body.thighsCm;
  if (body.notes !== undefined) update.notes = body.notes;
  const { data, error } = await sb.from('weight_entries').update(update).eq('id', id).select().single();
  if (error) throw error;
  return entryFromRow(data);
};

export const deleteWeight = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('weight_entries').delete().eq('id', id);
  if (error) throw error;
};

export const getGoal = async () => {
  const sb = supabase();
  const { data } = await sb.from('body_goal').select('*').limit(1).maybeSingle();
  return goalFromRow(data);
};

export const upsertGoal = async (body: {
  startWeightKg: number;
  targetWeightKg: number;
  startDate: string;
  targetDate: string;
}) => {
  const sb = supabase();
  const { data: existing } = await sb.from('body_goal').select('id').limit(1).maybeSingle();
  if (existing) {
    const { data, error } = await sb
      .from('body_goal')
      .update({
        start_weight_kg: body.startWeightKg,
        target_weight_kg: body.targetWeightKg,
        start_date: body.startDate,
        target_date: body.targetDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return goalFromRow(data);
  }
  const { data, error } = await sb
    .from('body_goal')
    .insert({
      start_weight_kg: body.startWeightKg,
      target_weight_kg: body.targetWeightKg,
      start_date: body.startDate,
      target_date: body.targetDate,
    })
    .select()
    .single();
  if (error) throw error;
  return goalFromRow(data);
};
