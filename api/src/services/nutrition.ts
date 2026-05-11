import { supabase } from './supabase';
import { awardXp, checkBadges, updateStreak } from './gamification';
import { XP } from '@/lib/xp';
import { todayISO } from '@/lib/date';

const goalsFromRow = (r: any) =>
  r
    ? {
        id: r.id,
        calories: r.calories,
        proteinG: r.protein_g,
        carbsG: r.carbs_g,
        fatsG: r.fats_g,
        waterMl: r.water_ml,
      }
    : null;

export const getGoals = async () => {
  const sb = supabase();
  const { data } = await sb.from('nutrition_goals').select('*').limit(1).maybeSingle();
  return goalsFromRow(data);
};

export const upsertGoals = async (body: {
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatsG?: number;
  waterMl?: number;
}) => {
  const sb = supabase();
  const row = {
    calories: body.calories ?? null,
    protein_g: body.proteinG ?? null,
    carbs_g: body.carbsG ?? null,
    fats_g: body.fatsG ?? null,
    water_ml: body.waterMl ?? 4000,
    updated_at: new Date().toISOString(),
  };
  const { data: existing } = await sb.from('nutrition_goals').select('id').limit(1).maybeSingle();
  if (existing) {
    const { data, error } = await sb
      .from('nutrition_goals')
      .update(row)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return goalsFromRow(data);
  }
  const { data, error } = await sb.from('nutrition_goals').insert(row).select().single();
  if (error) throw error;
  return goalsFromRow(data);
};

// TDEE (Mifflin-St Jeor)
const ACTIVITY: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};
export const calcTDEE = (body: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: keyof typeof ACTIVITY;
}) => {
  const { weightKg, heightCm, age, gender, activityLevel } = body;
  const s = gender === 'male' ? 5 : gender === 'female' ? -161 : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + s;
  const mult = ACTIVITY[activityLevel] ?? 1.55;
  const tdee = Math.round(bmr * mult);
  return {
    bmr: Math.round(bmr),
    tdee,
    cuttingCalories: Math.round(tdee - 500),
    bulkingCalories: Math.round(tdee + 350),
    maintenanceCalories: tdee,
  };
};

// ─── Meals ──────────────────────────────────────────────────
const mealFromRow = (r: any) => ({
  id: r.id,
  date: r.date,
  mealType: r.meal_type,
  name: r.name,
  calories: r.calories,
  proteinG: r.protein_g ? Number(r.protein_g) : 0,
  carbsG: r.carbs_g ? Number(r.carbs_g) : 0,
  fatsG: r.fats_g ? Number(r.fats_g) : 0,
  quantityG: r.quantity_g ? Number(r.quantity_g) : null,
  foodId: r.food_id,
  xpEarned: r.xp_earned,
});

export const listMeals = async (date: string) => {
  const sb = supabase();
  const { data } = await sb
    .from('meal_logs')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: true });
  const meals = (data ?? []).map(mealFromRow);
  const totals = meals.reduce(
    (s, m) => ({
      calories: s.calories + m.calories,
      proteinG: s.proteinG + m.proteinG,
      carbsG: s.carbsG + m.carbsG,
      fatsG: s.fatsG + m.fatsG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 },
  );
  return { meals, totals };
};

export const createMeal = async (body: {
  date?: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatsG?: number;
  quantityG?: number;
  foodId?: string;
}) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  const { xpEarned, newTotalXp } = await awardXp({
    base: XP.LOG_MEAL,
    module: 'spirit',
    source: 'meal',
  });
  const { data, error } = await sb
    .from('meal_logs')
    .insert({
      date,
      meal_type: body.mealType,
      name: body.name,
      calories: body.calories,
      protein_g: body.proteinG ?? 0,
      carbs_g: body.carbsG ?? 0,
      fats_g: body.fatsG ?? 0,
      quantity_g: body.quantityG ?? null,
      food_id: body.foodId ?? null,
      xp_earned: xpEarned,
    })
    .select()
    .single();
  if (error) throw error;
  await updateStreak('spirit');
  // Nutrition streak (computed from data) for badge
  const nutritionStreak = await computeNutritionStreak();
  const badges = await checkBadges({ nutritionStreak });
  return { meal: mealFromRow(data), xpEarned, newTotalXp, badgesUnlocked: badges };
};

const computeNutritionStreak = async () => {
  const sb = supabase();
  const { data } = await sb.from('meal_logs').select('date').order('date', { ascending: false });
  if (!data || data.length === 0) return 0;
  const uniqueDates = Array.from(new Set(data.map((r: any) => r.date))).sort().reverse();
  let streak = 0;
  let cursor = new Date(todayISO() + 'T00:00:00Z');
  for (const d of uniqueDates) {
    const dt = new Date(d + 'T00:00:00Z');
    const diff = (cursor.getTime() - dt.getTime()) / 86400000;
    if (diff === 0 || diff === 1) {
      streak++;
      cursor = new Date(dt.getTime() - 86400000);
    } else {
      break;
    }
  }
  return streak;
};

export const updateMeal = async (id: string, body: any) => {
  const sb = supabase();
  const upd: Record<string, any> = {};
  if (body.mealType !== undefined) upd.meal_type = body.mealType;
  if (body.name !== undefined) upd.name = body.name;
  if (body.calories !== undefined) upd.calories = body.calories;
  if (body.proteinG !== undefined) upd.protein_g = body.proteinG;
  if (body.carbsG !== undefined) upd.carbs_g = body.carbsG;
  if (body.fatsG !== undefined) upd.fats_g = body.fatsG;
  if (body.quantityG !== undefined) upd.quantity_g = body.quantityG;
  const { data, error } = await sb.from('meal_logs').update(upd).eq('id', id).select().single();
  if (error) throw error;
  return mealFromRow(data);
};

export const deleteMeal = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('meal_logs').delete().eq('id', id);
  if (error) throw error;
};

export const recentMeals = async () => {
  const sb = supabase();
  const { data } = await sb
    .from('meal_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(80);
  const seen = new Set<string>();
  const out: ReturnType<typeof mealFromRow>[] = [];
  for (const r of data ?? []) {
    const m = mealFromRow(r);
    if (seen.has(m.name)) continue;
    seen.add(m.name);
    out.push(m);
    if (out.length >= 10) break;
  }
  return out;
};

export const dailySummary = async (date: string) => {
  const sb = supabase();
  const { meals, totals } = await listMeals(date);
  const goals = await getGoals();
  const { data: water } = await sb
    .from('water_logs')
    .select('amount_ml')
    .eq('date', date)
    .maybeSingle();
  const waterMl = water?.amount_ml ?? 0;
  return {
    date,
    meals,
    caloriesConsumed: totals.calories,
    caloriesGoal: goals?.calories ?? null,
    deficit:
      goals?.calories != null ? goals.calories - totals.calories : null,
    proteinConsumed: totals.proteinG,
    proteinGoal: goals?.proteinG ?? null,
    carbsConsumed: totals.carbsG,
    carbsGoal: goals?.carbsG ?? null,
    fatsConsumed: totals.fatsG,
    fatsGoal: goals?.fatsG ?? null,
    waterMl,
    waterGoal: goals?.waterMl ?? 4000,
  };
};

export const weeklySummary = async () => {
  const sb = supabase();
  const from = new Date();
  from.setDate(from.getDate() - 6);
  const fromIso = from.toISOString().slice(0, 10);
  const { data } = await sb
    .from('meal_logs')
    .select('date, calories, protein_g, carbs_g, fats_g')
    .gte('date', fromIso);
  const map = new Map<string, { calories: number; proteinG: number; carbsG: number; fatsG: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    map.set(d.toISOString().slice(0, 10), { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 });
  }
  (data ?? []).forEach((r: any) => {
    const x = map.get(r.date);
    if (x) {
      x.calories += r.calories ?? 0;
      x.proteinG += Number(r.protein_g ?? 0);
      x.carbsG += Number(r.carbs_g ?? 0);
      x.fatsG += Number(r.fats_g ?? 0);
    }
  });
  return Array.from(map.entries()).map(([date, totals]) => ({ date, ...totals }));
};

// ─── Water ──────────────────────────────────────────────────
export const upsertWater = async (body: { amountMl: number; date?: string }) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  const { data: existing, error: selErr } = await sb
    .from('water_logs')
    .select('*')
    .eq('date', date)
    .maybeSingle();
  if (selErr) throw selErr;
  const delta = Number(body.amountMl);
  if (existing) {
    const next = Number(existing.amount_ml) + delta;
    const { data, error } = await sb
      .from('water_logs')
      .update({ amount_ml: next, logged_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return { id: data.id, date: data.date, amountMl: Number(data.amount_ml) };
  }
  const { data, error } = await sb
    .from('water_logs')
    .insert({ date, amount_ml: delta })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, date: data.date, amountMl: Number(data.amount_ml) };
};

// ─── Food database ──────────────────────────────────────────
const foodFromRow = (r: any) => ({
  id: r.id,
  name: r.name,
  caloriesPer100g: r.calories_per_100g ? Number(r.calories_per_100g) : null,
  proteinPer100g: r.protein_per_100g ? Number(r.protein_per_100g) : null,
  carbsPer100g: r.carbs_per_100g ? Number(r.carbs_per_100g) : null,
  fatsPer100g: r.fats_per_100g ? Number(r.fats_per_100g) : null,
  isCustom: r.is_custom,
});

export const listFoods = async (search?: string) => {
  const sb = supabase();
  let q = sb.from('food_database').select('*').order('name', { ascending: true });
  if (search) q = q.ilike('name', `%${search}%`);
  const { data } = await q;
  return (data ?? []).map(foodFromRow);
};

export const createFood = async (body: {
  name: string;
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatsPer100g?: number;
}) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('food_database')
    .insert({
      name: body.name,
      calories_per_100g: body.caloriesPer100g ?? null,
      protein_per_100g: body.proteinPer100g ?? null,
      carbs_per_100g: body.carbsPer100g ?? null,
      fats_per_100g: body.fatsPer100g ?? null,
      is_custom: true,
    })
    .select()
    .single();
  if (error) throw error;
  return foodFromRow(data);
};

export const updateFood = async (id: string, body: any) => {
  const sb = supabase();
  const upd: Record<string, any> = {};
  if (body.name !== undefined) upd.name = body.name;
  if (body.caloriesPer100g !== undefined) upd.calories_per_100g = body.caloriesPer100g;
  if (body.proteinPer100g !== undefined) upd.protein_per_100g = body.proteinPer100g;
  if (body.carbsPer100g !== undefined) upd.carbs_per_100g = body.carbsPer100g;
  if (body.fatsPer100g !== undefined) upd.fats_per_100g = body.fatsPer100g;
  const { data, error } = await sb.from('food_database').update(upd).eq('id', id).select().single();
  if (error) throw error;
  return foodFromRow(data);
};

export const deleteFood = async (id: string) => {
  const sb = supabase();
  const { error } = await sb.from('food_database').delete().eq('id', id);
  if (error) throw error;
};
