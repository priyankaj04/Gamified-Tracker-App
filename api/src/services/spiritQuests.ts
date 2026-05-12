import { supabase } from './supabase';
import { awardXp } from './gamification';
import { todayISO } from '@/lib/date';

interface QuestTemplate {
  key: string;
  title: string;
  description: string;
  target: number;
  xpReward: number;
  icon: string;
  // probe(today) → current numeric progress
  probe: (sb: ReturnType<typeof supabase>, date: string) => Promise<number>;
}

const QUEST_POOL: QuestTemplate[] = [
  {
    key: 'water-4l',
    title: 'Hydration Sensei',
    description: 'Drink 4 L of water today',
    target: 4000,
    xpReward: 60,
    icon: 'water',
    probe: async (sb, date) => {
      const { data } = await sb
        .from('water_logs')
        .select('amount_ml')
        .eq('date', date)
        .maybeSingle();
      return Math.min(4000, data?.amount_ml ?? 0);
    },
  },
  {
    key: 'three-meals',
    title: 'Square Meals',
    description: 'Log breakfast, lunch, and dinner',
    target: 3,
    xpReward: 75,
    icon: 'restaurant',
    probe: async (sb, date) => {
      const { data } = await sb.from('meal_logs').select('meal_type').eq('date', date);
      const seen = new Set((data ?? []).map((m: any) => m.meal_type));
      return ['Breakfast', 'Lunch', 'Dinner'].filter((t) => seen.has(t)).length;
    },
  },
  {
    key: 'all-habits',
    title: 'Habit Ninja',
    description: 'Complete every habit today',
    target: 1,
    xpReward: 80,
    icon: 'checkmark-done',
    probe: async (sb, date) => {
      const { data: habits } = await sb
        .from('habits')
        .select('id, frequency, custom_days')
        .eq('is_active', true);
      if (!habits || habits.length === 0) return 0;
      const dow = new Date(date + 'T00:00:00Z').getUTCDay();
      const relevant = habits.filter((h: any) => {
        if (h.frequency === 'daily') return true;
        if (h.frequency === 'weekdays') return dow >= 1 && dow <= 5;
        if (h.frequency === 'custom') return (h.custom_days ?? []).includes(dow);
        return true;
      });
      if (relevant.length === 0) return 1;
      const { data: logs } = await sb
        .from('habit_logs')
        .select('habit_id')
        .eq('date', date)
        .eq('completed', true)
        .in('habit_id', relevant.map((h: any) => h.id));
      return (logs ?? []).length >= relevant.length ? 1 : 0;
    },
  },
  {
    key: 'log-weight',
    title: 'Step on the Scale',
    description: 'Log a weight entry today',
    target: 1,
    xpReward: 40,
    icon: 'scale',
    probe: async (sb, date) => {
      const { data } = await sb.from('weight_entries').select('id').eq('date', date).maybeSingle();
      return data ? 1 : 0;
    },
  },
  {
    key: 'sleep-7h',
    title: 'Well Rested',
    description: 'Log sleep of 7+ hours',
    target: 1,
    xpReward: 50,
    icon: 'moon',
    probe: async (sb, date) => {
      const { data } = await sb
        .from('sleep_logs')
        .select('duration_hours')
        .eq('date', date)
        .maybeSingle();
      return data && Number(data.duration_hours ?? 0) >= 7 ? 1 : 0;
    },
  },
  {
    key: 'mood-checkin',
    title: 'Inner Reflection',
    description: 'Log your mood, energy, and stress',
    target: 1,
    xpReward: 35,
    icon: 'happy',
    probe: async (sb, date) => {
      const { data } = await sb
        .from('daily_wellness')
        .select('mood, energy_level, stress_level')
        .eq('date', date)
        .maybeSingle();
      if (!data) return 0;
      return data.mood != null && data.energy_level != null && data.stress_level != null ? 1 : 0;
    },
  },
  {
    key: 'protein-100',
    title: 'Protein Power',
    description: 'Eat 100g of protein',
    target: 100,
    xpReward: 60,
    icon: 'fitness',
    probe: async (sb, date) => {
      const { data } = await sb.from('meal_logs').select('protein_g').eq('date', date);
      const total = (data ?? []).reduce(
        (s: number, m: any) => s + Number(m.protein_g ?? 0),
        0,
      );
      return Math.min(100, Math.round(total));
    },
  },
  {
    key: 'fast-12h',
    title: 'Fasting Initiate',
    description: 'Complete a 12+ hour fast',
    target: 1,
    xpReward: 70,
    icon: 'timer',
    probe: async (sb, date) => {
      const from = `${date}T00:00:00.000Z`;
      const to = `${date}T23:59:59.999Z`;
      const { data } = await sb
        .from('fasting_sessions')
        .select('end_time, actual_hours, completed')
        .gte('end_time', from)
        .lte('end_time', to)
        .eq('completed', true);
      return (data ?? []).some((f: any) => Number(f.actual_hours ?? 0) >= 12) ? 1 : 0;
    },
  },
  {
    key: 'steps-8k',
    title: 'Wanderer',
    description: 'Take 8,000 steps',
    target: 8000,
    xpReward: 55,
    icon: 'footsteps',
    probe: async (sb, date) => {
      const { data } = await sb.from('step_logs').select('steps').eq('date', date).maybeSingle();
      return Math.min(8000, data?.steps ?? 0);
    },
  },
  {
    key: 'measurements',
    title: 'Body Check',
    description: 'Log your measurements',
    target: 1,
    xpReward: 45,
    icon: 'resize',
    probe: async (sb, date) => {
      const { data } = await sb.from('body_measurements').select('id').eq('date', date).maybeSingle();
      return data ? 1 : 0;
    },
  },
];

// Deterministic daily picker — same 3 quests through the day, refresh at midnight
const pickDailyKeys = (date: string, count = 3): string[] => {
  // Hash the date to a deterministic but date-varying seed.
  let seed = 0;
  for (let i = 0; i < date.length; i++) seed = (seed * 31 + date.charCodeAt(i)) >>> 0;
  const pool = [...QUEST_POOL];
  const selected: string[] = [];
  while (selected.length < count && pool.length > 0) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const idx = seed % pool.length;
    selected.push(pool[idx].key);
    pool.splice(idx, 1);
  }
  return selected;
};

const ensureTodayQuests = async (): Promise<void> => {
  const sb = supabase();
  const date = todayISO();
  const { data: existing } = await sb.from('spirit_quests').select('quest_key').eq('date', date);
  if (existing && existing.length >= 3) return;
  const existingKeys = new Set((existing ?? []).map((r: any) => r.quest_key));
  const keys = pickDailyKeys(date).filter((k) => !existingKeys.has(k));
  if (keys.length === 0) return;
  const rows = keys
    .map((k) => QUEST_POOL.find((t) => t.key === k))
    .filter((t): t is QuestTemplate => !!t)
    .map((t) => ({
      date,
      quest_key: t.key,
      title: t.title,
      description: t.description,
      target: t.target,
      xp_reward: t.xpReward,
      icon: t.icon,
    }));
  if (rows.length > 0) {
    await sb.from('spirit_quests').insert(rows);
  }
};

export const todayQuests = async () => {
  await ensureTodayQuests();
  const sb = supabase();
  const date = todayISO();
  const { data } = await sb
    .from('spirit_quests')
    .select('*')
    .eq('date', date)
    .order('created_at', { ascending: true });
  if (!data) return [];

  // Refresh progress for non-claimed quests so the UI shows live counts
  const updated = await Promise.all(
    data.map(async (q: any) => {
      if (q.claimed) return q;
      const template = QUEST_POOL.find((t) => t.key === q.quest_key);
      if (!template) return q;
      const progress = await template.probe(sb, date);
      const completed = progress >= q.target;
      if (q.progress !== progress || q.completed !== completed) {
        await sb
          .from('spirit_quests')
          .update({ progress, completed })
          .eq('id', q.id);
        return { ...q, progress, completed };
      }
      return q;
    }),
  );

  return updated.map((q: any) => ({
    id: q.id,
    date: q.date,
    questKey: q.quest_key,
    title: q.title,
    description: q.description,
    target: q.target,
    progress: q.progress,
    completed: q.completed,
    claimed: q.claimed,
    xpReward: q.xp_reward,
    icon: q.icon,
  }));
};

export const claimQuest = async (id: string) => {
  const sb = supabase();
  const { data: q } = await sb.from('spirit_quests').select('*').eq('id', id).maybeSingle();
  if (!q) throw new Error('Quest not found');
  if (!q.completed) throw new Error('Quest not completed yet');
  if (q.claimed) throw new Error('Already claimed');

  const award = await awardXp({
    base: q.xp_reward,
    module: 'spirit',
    source: `spirit-quest:${q.quest_key}`,
  });
  await sb.from('spirit_quests').update({ claimed: true }).eq('id', id);
  return {
    questId: id,
    xpEarned: award.xpEarned,
    newTotalXp: award.newTotalXp,
  };
};
