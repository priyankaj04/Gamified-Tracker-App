import { supabase } from './supabase';
import type { SnippetCategory } from '@/types';

const snippetFromRow = (r: any) => ({
  id: r.id,
  projectId: r.project_id ?? null,
  title: r.title,
  language: r.language,
  content: r.content,
  category: r.category as SnippetCategory,
  tags: r.tags ?? [],
  isPinned: !!r.is_pinned,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

interface ListParams {
  projectId?: string;
  language?: string;
  category?: string;
  search?: string;
  pinned?: boolean;
}

export const listSnippets = async (p: ListParams) => {
  const sb = supabase();
  let q = sb
    .from('snippets')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (p.projectId) q = q.eq('project_id', p.projectId);
  if (p.language) q = q.eq('language', p.language);
  if (p.category) q = q.eq('category', p.category);
  if (p.pinned !== undefined) q = q.eq('is_pinned', p.pinned);
  if (p.search) q = q.or(`title.ilike.%${p.search}%,content.ilike.%${p.search}%`);
  const { data, error } = await q;
  if (error) throw error;
  return { snippets: (data ?? []).map(snippetFromRow) };
};

interface SnippetBody {
  projectId?: string | null;
  title: string;
  language?: string;
  content: string;
  category?: SnippetCategory;
  tags?: string[];
}

export const createSnippet = async (body: SnippetBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('snippets')
    .insert({
      project_id: body.projectId ?? null,
      title: body.title,
      language: body.language ?? 'javascript',
      content: body.content,
      category: body.category ?? 'Reference',
      tags: body.tags ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return snippetFromRow(data);
};

export const updateSnippet = async (id: string, body: Partial<SnippetBody>) => {
  const sb = supabase();
  const upd: any = { updated_at: new Date().toISOString() };
  if (body.projectId !== undefined) upd.project_id = body.projectId;
  if (body.title !== undefined) upd.title = body.title;
  if (body.language !== undefined) upd.language = body.language;
  if (body.content !== undefined) upd.content = body.content;
  if (body.category !== undefined) upd.category = body.category;
  if (body.tags !== undefined) upd.tags = body.tags;
  await sb.from('snippets').update(upd).eq('id', id);
  const { data } = await sb.from('snippets').select('*').eq('id', id).single();
  return snippetFromRow(data);
};

export const deleteSnippet = async (id: string) => {
  const sb = supabase();
  await sb.from('snippets').delete().eq('id', id);
};

export const togglePin = async (id: string) => {
  const sb = supabase();
  const { data: cur } = await sb.from('snippets').select('is_pinned').eq('id', id).maybeSingle();
  await sb.from('snippets').update({ is_pinned: !cur?.is_pinned }).eq('id', id);
  const { data } = await sb.from('snippets').select('*').eq('id', id).single();
  return snippetFromRow(data);
};
