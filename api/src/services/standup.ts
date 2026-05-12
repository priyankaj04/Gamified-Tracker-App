import { supabase } from './supabase';
import { todayISO, previousISO } from '@/lib/date';

const fromRow = (r: any) => ({
  id: r.id,
  date: r.date,
  yesterday: r.yesterday ?? null,
  today: r.today ?? null,
  blockers: r.blockers ?? null,
  projectId: r.project_id ?? null,
  createdAt: r.created_at,
});

export const listStandups = async (limit = 60) => {
  const sb = supabase();
  const { data, error } = await sb.from('standup_logs').select('*').order('date', { ascending: false }).limit(limit);
  if (error) throw error;
  return { standups: (data ?? []).map(fromRow) };
};

export const getToday = async () => {
  const sb = supabase();
  const { data } = await sb.from('standup_logs').select('*').eq('date', todayISO()).maybeSingle();
  return { standup: data ? fromRow(data) : null };
};

interface StandupBody {
  yesterday?: string;
  today?: string;
  blockers?: string;
  projectId?: string | null;
  date?: string;
}

export const upsertStandup = async (body: StandupBody) => {
  const sb = supabase();
  const date = body.date ?? todayISO();
  const { data: existing } = await sb.from('standup_logs').select('*').eq('date', date).maybeSingle();
  if (existing) {
    const upd: any = {};
    if (body.yesterday !== undefined) upd.yesterday = body.yesterday;
    if (body.today !== undefined) upd.today = body.today;
    if (body.blockers !== undefined) upd.blockers = body.blockers;
    if (body.projectId !== undefined) upd.project_id = body.projectId;
    await sb.from('standup_logs').update(upd).eq('id', existing.id);
    const { data } = await sb.from('standup_logs').select('*').eq('id', existing.id).single();
    return fromRow(data);
  }
  // auto-fill yesterday from previous day's "today"
  let yesterdayFill = body.yesterday;
  if (yesterdayFill === undefined) {
    const { data: prev } = await sb.from('standup_logs').select('today').eq('date', previousISO(date)).maybeSingle();
    yesterdayFill = prev?.today ?? '';
  }
  const { data, error } = await sb
    .from('standup_logs')
    .insert({
      date,
      yesterday: yesterdayFill ?? null,
      today: body.today ?? null,
      blockers: body.blockers ?? null,
      project_id: body.projectId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
};

export const deleteStandup = async (id: string) => {
  const sb = supabase();
  await sb.from('standup_logs').delete().eq('id', id);
};

export const exportStandups = async (from?: string, to?: string) => {
  const sb = supabase();
  let q = sb.from('standup_logs').select('*').order('date', { ascending: true });
  if (from) q = q.gte('date', from);
  if (to) q = q.lte('date', to);
  const { data } = await q;
  const text = (data ?? [])
    .map(
      (s: any) =>
        `${s.date}\nYESTERDAY: ${s.yesterday ?? ''}\nTODAY: ${s.today ?? ''}\nBLOCKERS: ${s.blockers ?? ''}\n`,
    )
    .join('\n');
  return { text };
};
