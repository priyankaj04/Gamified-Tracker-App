import { supabase } from './supabase';
import { todayISO } from '@/lib/date';
import type { IssueSeverity, IssueStatus } from '@/types';

const fromRow = (r: any) => ({
  id: r.id,
  projectId: r.project_id,
  title: r.title,
  description: r.description ?? null,
  severity: r.severity as IssueSeverity,
  status: r.status as IssueStatus,
  foundDate: r.found_date,
  fixedDate: r.fixed_date ?? null,
  sessionId: r.session_id ?? null,
  daysOpen:
    r.fixed_date
      ? Math.floor((new Date(r.fixed_date).getTime() - new Date(r.found_date).getTime()) / 86400000)
      : Math.floor((Date.now() - new Date(r.found_date).getTime()) / 86400000),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const listIssues = async (p: { projectId?: string; status?: string; severity?: string }) => {
  const sb = supabase();
  let q = sb.from('issues').select('*').order('created_at', { ascending: false });
  if (p.projectId) q = q.eq('project_id', p.projectId);
  if (p.status) q = q.eq('status', p.status);
  if (p.severity) q = q.eq('severity', p.severity);
  const { data, error } = await q;
  if (error) throw error;
  return { issues: (data ?? []).map(fromRow) };
};

interface IssueBody {
  projectId: string;
  title: string;
  description?: string | null;
  severity?: IssueSeverity;
  status?: IssueStatus;
  foundDate?: string;
  sessionId?: string | null;
}

export const createIssue = async (body: IssueBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('issues')
    .insert({
      project_id: body.projectId,
      title: body.title,
      description: body.description ?? null,
      severity: body.severity ?? 'Medium',
      status: body.status ?? 'Open',
      found_date: body.foundDate ?? todayISO(),
      session_id: body.sessionId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
};

export const updateIssue = async (id: string, body: Partial<IssueBody>) => {
  const sb = supabase();
  const upd: any = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) upd.title = body.title;
  if (body.description !== undefined) upd.description = body.description;
  if (body.severity !== undefined) upd.severity = body.severity;
  if (body.status !== undefined) upd.status = body.status;
  if (body.foundDate !== undefined) upd.found_date = body.foundDate;
  await sb.from('issues').update(upd).eq('id', id);
  const { data } = await sb.from('issues').select('*').eq('id', id).single();
  return fromRow(data);
};

export const deleteIssue = async (id: string) => {
  const sb = supabase();
  await sb.from('issues').delete().eq('id', id);
};

export const markFixed = async (id: string) => {
  const sb = supabase();
  await sb
    .from('issues')
    .update({ status: 'Fixed', fixed_date: todayISO(), updated_at: new Date().toISOString() })
    .eq('id', id);
  const { data } = await sb.from('issues').select('*').eq('id', id).single();
  return fromRow(data);
};

export const issueStats = async (projectId?: string) => {
  const sb = supabase();
  let q = sb.from('issues').select('*');
  if (projectId) q = q.eq('project_id', projectId);
  const { data } = await q;
  const all = data ?? [];
  const fixed = all.filter((i: any) => i.status === 'Fixed' && i.fixed_date);
  const times = fixed.map(
    (i: any) => (new Date(i.fixed_date).getTime() - new Date(i.found_date).getTime()) / 86400000,
  );
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  return {
    open: all.filter((i: any) => i.status === 'Open').length,
    inProgress: all.filter((i: any) => i.status === 'In Progress').length,
    fixed: fixed.length,
    wontFix: all.filter((i: any) => i.status === 'Wont Fix').length,
    avgTimeToFixDays: Math.round(avg * 10) / 10,
  };
};
