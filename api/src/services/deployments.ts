import { supabase } from './supabase';
import type { DeployEnvironment } from '@/types';

const fromRow = (r: any) => ({
  id: r.id,
  projectId: r.project_id,
  version: r.version ?? null,
  environment: r.environment as DeployEnvironment,
  deployedAt: r.deployed_at,
  releaseNotes: r.release_notes ?? null,
  deployUrl: r.deploy_url ?? null,
  createdAt: r.created_at,
});

export const listDeployments = async (projectId: string) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('deployments')
    .select('*')
    .eq('project_id', projectId)
    .order('deployed_at', { ascending: false });
  if (error) throw error;
  return { deployments: (data ?? []).map(fromRow) };
};

interface DeployBody {
  projectId: string;
  version?: string | null;
  environment?: DeployEnvironment;
  deployedAt?: string;
  releaseNotes?: string | null;
  deployUrl?: string | null;
}

export const createDeployment = async (body: DeployBody) => {
  const sb = supabase();
  const { data, error } = await sb
    .from('deployments')
    .insert({
      project_id: body.projectId,
      version: body.version ?? null,
      environment: body.environment ?? 'production',
      deployed_at: body.deployedAt ?? new Date().toISOString(),
      release_notes: body.releaseNotes ?? null,
      deploy_url: body.deployUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(data);
};

export const updateDeployment = async (id: string, body: Partial<DeployBody>) => {
  const sb = supabase();
  const upd: any = {};
  if (body.version !== undefined) upd.version = body.version;
  if (body.environment !== undefined) upd.environment = body.environment;
  if (body.deployedAt !== undefined) upd.deployed_at = body.deployedAt;
  if (body.releaseNotes !== undefined) upd.release_notes = body.releaseNotes;
  if (body.deployUrl !== undefined) upd.deploy_url = body.deployUrl;
  await sb.from('deployments').update(upd).eq('id', id);
  const { data } = await sb.from('deployments').select('*').eq('id', id).single();
  return fromRow(data);
};

export const deleteDeployment = async (id: string) => {
  const sb = supabase();
  await sb.from('deployments').delete().eq('id', id);
};

export const latestPerProject = async () => {
  const sb = supabase();
  const { data } = await sb.from('deployments').select('*').order('deployed_at', { ascending: false });
  const map: Record<string, any> = {};
  (data ?? []).forEach((d: any) => {
    if (!map[d.project_id]) map[d.project_id] = fromRow(d);
  });
  return { deployments: Object.values(map) };
};
