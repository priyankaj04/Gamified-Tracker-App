import { supabase } from './supabase';
import { todayISO } from '@/lib/date';

// Compute consecutive-day streaks for each Spirit sub-feature directly from
// the log tables. No new streak rows added — the global 'spirit' module
// streak still exists; these are derived for badges & UI only.

const streakFromDates = (dates: string[]): number => {
  if (!dates.length) return 0;
  const sorted = Array.from(new Set(dates)).sort().reverse();
  const today = todayISO();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);
  // Streak counts from today backward; allow yesterday as the starting day
  // (so logging "last night's sleep this morning" still counts).
  let cursor: Date;
  if (sorted[0] === today) cursor = new Date(today + 'T00:00:00Z');
  else if (sorted[0] === yesterday) cursor = new Date(yesterday + 'T00:00:00Z');
  else return 0;
  let count = 0;
  for (const d of sorted) {
    const cursorIso = cursor.toISOString().slice(0, 10);
    if (d === cursorIso) {
      count++;
      cursor = new Date(cursor.getTime() - 86_400_000);
    } else if (d < cursorIso) {
      break;
    }
  }
  return count;
};

const longestStreakFromDates = (dates: string[]): number => {
  if (!dates.length) return 0;
  const sorted = Array.from(new Set(dates)).sort();
  let longest = 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00Z').getTime();
    const curr = new Date(sorted[i] + 'T00:00:00Z').getTime();
    if ((curr - prev) / 86_400_000 === 1) {
      run++;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  return Math.max(longest, run);
};

export const allSpiritStreaks = async () => {
  const sb = supabase();

  const [
    weightRes,
    mealRes,
    sleepRes,
    sleepQualityRes,
    habitLogRes,
    activeHabitsRes,
    fastRes,
  ] = await Promise.all([
    sb.from('weight_entries').select('date').order('date', { ascending: false }).limit(120),
    sb.from('meal_logs').select('date').order('date', { ascending: false }).limit(400),
    sb.from('sleep_logs').select('date').order('date', { ascending: false }).limit(120),
    sb
      .from('sleep_logs')
      .select('date, quality')
      .order('date', { ascending: false })
      .limit(120),
    sb.from('habit_logs').select('date, habit_id, completed').limit(2000),
    sb.from('habits').select('id, frequency, custom_days').eq('is_active', true),
    sb
      .from('fasting_sessions')
      .select('start_time, completed')
      .eq('completed', true)
      .order('start_time', { ascending: false })
      .limit(120),
  ]);

  const weightDates = (weightRes.data ?? []).map((r: any) => r.date);
  const mealDates = (mealRes.data ?? []).map((r: any) => r.date);
  const sleepDates = (sleepRes.data ?? []).map((r: any) => r.date);
  const goodSleepDates = (sleepQualityRes.data ?? [])
    .filter((r: any) => (r.quality ?? 0) >= 4)
    .map((r: any) => r.date);
  const fastDates = (fastRes.data ?? []).map((r: any) =>
    new Date(r.start_time).toISOString().slice(0, 10),
  );

  // Habits: "all relevant habits done" per day across last 90 days
  const habits = activeHabitsRes.data ?? [];
  const habitLogs = habitLogRes.data ?? [];
  const completedByDate = new Map<string, Set<string>>();
  habitLogs.forEach((l: any) => {
    if (!l.completed) return;
    if (!completedByDate.has(l.date)) completedByDate.set(l.date, new Set());
    completedByDate.get(l.date)!.add(l.habit_id);
  });
  const isRelevantForDay = (h: any, dow: number) => {
    if (h.frequency === 'daily') return true;
    if (h.frequency === 'weekdays') return dow >= 1 && dow <= 5;
    if (h.frequency === 'custom') return (h.custom_days ?? []).includes(dow);
    return true;
  };
  const habitFullDays: string[] = [];
  if (habits.length > 0) {
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const dow = d.getUTCDay();
      const relevant = habits.filter((h: any) => isRelevantForDay(h, dow));
      if (relevant.length === 0) continue;
      const done = completedByDate.get(iso) ?? new Set();
      if (relevant.every((h: any) => done.has(h.id))) habitFullDays.push(iso);
    }
  }

  return {
    weight: {
      current: streakFromDates(weightDates),
      longest: longestStreakFromDates(weightDates),
      total: weightDates.length,
    },
    nutrition: {
      current: streakFromDates(mealDates),
      longest: longestStreakFromDates(mealDates),
      total: new Set(mealDates).size,
    },
    sleep: {
      current: streakFromDates(sleepDates),
      longest: longestStreakFromDates(sleepDates),
      total: sleepDates.length,
    },
    sleepQuality: {
      current: streakFromDates(goodSleepDates),
      longest: longestStreakFromDates(goodSleepDates),
      total: goodSleepDates.length,
    },
    habits: {
      current: streakFromDates(habitFullDays),
      longest: longestStreakFromDates(habitFullDays),
      total: habitFullDays.length,
    },
    fasting: {
      current: streakFromDates(fastDates),
      longest: longestStreakFromDates(fastDates),
      total: fastDates.length,
    },
  };
};
