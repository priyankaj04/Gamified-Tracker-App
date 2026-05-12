import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { DeployEnvironment, Deployment } from '@/types';

export const deploymentKeys = {
  all: ['deployments'] as const,
  list: (projectId: string) => ['deployments', 'list', projectId] as const,
  latest: ['deployments', 'latest'] as const,
};

export const useDeployments = (projectId: string | undefined) =>
  useQuery({
    enabled: !!projectId,
    queryKey: deploymentKeys.list(projectId ?? ''),
    queryFn: () =>
      api
        .get<{ data: { deployments: Deployment[] } }>('/deployments', { params: { projectId } })
        .then(unwrap),
  });

export interface DeploymentBody {
  projectId: string;
  version?: string | null;
  environment?: DeployEnvironment;
  deployedAt?: string;
  releaseNotes?: string | null;
  deployUrl?: string | null;
}

export const useCreateDeployment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DeploymentBody) =>
      api.post<{ data: Deployment }>('/deployments', body).then(unwrap),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: deploymentKeys.list(d.projectId) });
    },
  });
};

export const useUpdateDeployment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<DeploymentBody> }) =>
      api.put<{ data: Deployment }>(`/deployments/${id}`, body).then(unwrap),
    onSuccess: (d) => qc.invalidateQueries({ queryKey: deploymentKeys.list(d.projectId) }),
  });
};

export const useDeleteDeployment = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/deployments/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: deploymentKeys.list(projectId) }),
  });
};
