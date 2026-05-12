import { supabase } from './supabase';
import { todayISO } from '@/lib/date';

const dayMs = 86400000;
const startOfWeek = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
};
const startOfMonth = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
};

export const summary = async () => {
  const sb = supabase();
  const { data: sessions } = await sb.from('coding_sessions').select('*');
  const all = sessions ?? [];
  const today = todayISO();
  const todayMinutes = all
    .filter((s: any) => s.date === today)
    .reduce((sum: number, s: any) => sum + (s.duration_minutes ?? 0), 0);
  const weekStart = startOfWeek();
  const weekMinutes = all
    .filter((s: any) => new Date(s.date) >= weekStart)
    .reduce((sum: number, s: any) => sum + (s.duration_minutes ?? 0), 0);
  const monthStart = startOfMonth();
  const monthMinutes = all
    .filter((s: any) => new Date(s.date) >= monthStart)
    .reduce((sum: number, s: any) => sum + (s.duration_minutes ?? 0), 0);
  const allTimeMin = all.reduce((sum: number, s: any) => sum + (s.duration_minutes ?? 0), 0);
  const totalSessions = all.length;
  const avgSessionMinutes = totalSessions ? Math.round(allTimeMin / totalSessions) : 0;

  // day-of-week / hour-of-day
  const dowSum: number[] = Array(7).fill(0);
  const dowCount: number[] = Array(7).fill(0);
  const hourSum: number[] = Array(24).fill(0);
  all.forEach((s: any) => {
    const d = new Date(s.date);
    dowSum[d.getDay()] += s.duration_minutes ?? 0;
    dowCount[d.getDay()] += 1;
    if (s.start_time) hourSum[new Date(s.start_time).getHours()] += s.duration_minutes ?? 0;
  });
  const dowAvg = dowSum.map((v, i) => (dowCount[i] ? v / dowCount[i] : 0));
  const peakDow = dowAvg.indexOf(Math.max(...dowAvg));
  const peakHour = hourSum.indexOf(Math.max(...hourSum));

  // consistency
  const datesActive = new Set<string>(all.map((s: any) => s.date));
  const consistency = (days: number) => {
    let active = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (datesActive.has(d.toISOString().split('T')[0])) active++;
    }
    return Math.round((active / days) * 100);
  };

  // personal bests
  const longestSession = all.reduce((m: number, s: any) => Math.max(m, s.duration_minutes ?? 0), 0);
  const byDate: Record<string, number> = {};
  all.forEach((s: any) => {
    byDate[s.date] = (byDate[s.date] ?? 0) + (s.duration_minutes ?? 0);
  });
  const mostHoursInDay = Math.max(0, ...Object.values(byDate)) / 60;
  const { data: streak } = await sb.from('streaks').select('*').eq('module', 'forge').maybeSingle();

  return {
    todayMinutes,
    weekMinutes,
    monthMinutes,
    allTimeHours: Math.round((allTimeMin / 60) * 10) / 10,
    totalSessions,
    avgSessionMinutes,
    mostProductiveDayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][peakDow],
    mostProductiveHourOfDay: peakHour,
    codingConsistency30d: consistency(30),
    codingConsistency90d: consistency(90),
    personalBests: {
      longestSession,
      mostHoursInDay: Math.round(mostHoursInDay * 10) / 10,
      currentStreak: streak?.count ?? 0,
      longestStreak: streak?.longest_streak ?? 0,
    },
  };
};

export const weekly = async () => {
  const sb = supabase();
  const { data } = await sb.from('coding_sessions').select('date, duration_minutes');
  const byDate: Record<string, number> = {};
  (data ?? []).forEach((s: any) => {
    byDate[s.date] = (byDate[s.date] ?? 0) + (s.duration_minutes ?? 0);
  });
  const out: { date: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toISOString().split('T')[0];
    out.push({ date: k, minutes: byDate[k] ?? 0 });
  }
  return { days: out };
};

export const weeklyChart = async () => {
  const sb = supabase();
  const { data } = await sb.from('coding_sessions').select('date, duration_minutes');
  const byWeek: Record<string, number> = {};
  (data ?? []).forEach((s: any) => {
    const d = new Date(s.date);
    d.setDate(d.getDate() - d.getDay());
    const k = d.toISOString().split('T')[0];
    byWeek[k] = (byWeek[k] ?? 0) + (s.duration_minutes ?? 0);
  });
  const out: { weekStart: string; minutes: number }[] = [];
  const cur = new Date();
  cur.setDate(cur.getDate() - cur.getDay());
  for (let i = 11; i >= 0; i--) {
    const d = new Date(cur);
    d.setDate(cur.getDate() - i * 7);
    const k = d.toISOString().split('T')[0];
    out.push({ weekStart: k, minutes: byWeek[k] ?? 0 });
  }
  return { weeks: out };
};

export const byProject = async () => {
  const sb = supabase();
  const { data: sessions } = await sb.from('coding_sessions').select('project_id, duration_minutes');
  const minutesById: Record<string, number> = {};
  let total = 0;
  (sessions ?? []).forEach((s: any) => {
    if (!s.project_id) return;
    minutesById[s.project_id] = (minutesById[s.project_id] ?? 0) + (s.duration_minutes ?? 0);
    total += s.duration_minutes ?? 0;
  });
  const ids = Object.keys(minutesById);
  const projectMap: Record<string, string> = {};
  if (ids.length) {
    const { data: ps } = await sb.from('projects').select('id, name').in('id', ids);
    (ps ?? []).forEach((p: any) => {
      projectMap[p.id] = p.name;
    });
  }
  const rows = Object.entries(minutesById)
    .map(([id, min]) => ({
      projectId: id,
      projectName: projectMap[id] ?? '?',
      minutes: min,
      pct: total ? Math.round((min / total) * 100) : 0,
    }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 10);
  return { projects: rows };
};

export const dailyGoal = async () => {
  const sb = supabase();
  const { data: settings } = await sb.from('forge_settings').select('daily_coding_goal_min').limit(1).maybeSingle();
  const goal = settings?.daily_coding_goal_min ?? 120;
  const today = todayISO();
  const { data: sessions } = await sb.from('coding_sessions').select('duration_minutes').eq('date', today);
  const todayMinutes = (sessions ?? []).reduce((s: number, r: any) => s + (r.duration_minutes ?? 0), 0);
  // streak: walk back day-by-day from today while goal hit
  const { data: all } = await sb.from('coding_sessions').select('date, duration_minutes');
  const minutesByDate: Record<string, number> = {};
  (all ?? []).forEach((s: any) => {
    minutesByDate[s.date] = (minutesByDate[s.date] ?? 0) + (s.duration_minutes ?? 0);
  });
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toISOString().split('T')[0];
    if ((minutesByDate[k] ?? 0) >= goal) streak++;
    else {
      if (i === 0) break;
      break;
    }
  }
  let longest = 0;
  let run = 0;
  const sortedDates = Object.keys(minutesByDate).sort();
  let prev: string | null = null;
  for (const d of sortedDates) {
    if (minutesByDate[d] >= goal) {
      if (prev && Math.floor((new Date(d).getTime() - new Date(prev).getTime()) / dayMs) === 1) run++;
      else run = 1;
      longest = Math.max(longest, run);
      prev = d;
    } else {
      run = 0;
      prev = null;
    }
  }
  return {
    goalMinutes: goal,
    todayMinutes,
    pct: Math.min(100, Math.round((todayMinutes / Math.max(1, goal)) * 100)),
    goalStreak: streak,
    longestGoalStreak: longest,
  };
};

export const billable = async (month: string) => {
  const sb = supabase();
  const [yStr, mStr] = month.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const { data: settings } = await sb.from('forge_settings').select('billable_rate, billable_currency').limit(1).maybeSingle();
  const rate = Number(settings?.billable_rate ?? 0);
  const currency = settings?.billable_currency ?? 'INR';
  const { data: sessions } = await sb
    .from('coding_sessions')
    .select('project_id, duration_minutes, is_billable, projects(name)')
    .eq('is_billable', true)
    .gte('date', from)
    .lte('date', to);
  const byProject: Record<string, { name: string; minutes: number }> = {};
  (sessions ?? []).forEach((s: any) => {
    const k = s.project_id ?? 'none';
    if (!byProject[k]) byProject[k] = { name: s.projects?.name ?? 'Untitled', minutes: 0 };
    byProject[k].minutes += s.duration_minutes ?? 0;
  });
  const rows = Object.entries(byProject).map(([projectId, v]) => ({
    projectId,
    projectName: v.name,
    hours: Math.round((v.minutes / 60) * 100) / 100,
    earnings: Math.round((v.minutes / 60) * rate * 100) / 100,
  }));
  const totalHours = rows.reduce((s, r) => s + r.hours, 0);
  const totalEarnings = rows.reduce((s, r) => s + r.earnings, 0);
  return { month, currency, rate, projects: rows, totalHours, totalEarnings };
};
