import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { Issue, IssueSeverity, IssueStatus } from '@/types';

export const issueKeys = {
  all: ['issues'] as const,
  list: (params?: Record<string, unknown>) => ['issues', 'list', params] as const,
  stats: (projectId?: string) => ['issues', 'stats', projectId] as const,
};

interface ListParams {
  projectId?: string;
  status?: IssueStatus;
  severity?: IssueSeverity;
}

export const useIssues = (params: ListParams = {}) =>
  useQuery({
    queryKey: issueKeys.list(params as any),
    queryFn: () => api.get<{ data: { issues: Issue[] } }>('/issues', { params }).then(unwrap),
  });

export const useIssueStats = (projectId?: string) =>
  useQuery({
    queryKey: issueKeys.stats(projectId),
    queryFn: () =>
      api
        .get<{
          data: { open: number; inProgress: number; fixed: number; wontFix: number; avgTimeToFixDays: number };
        }>('/issues/stats', { params: { projectId } })
        .then(unwrap),
  });

export interface IssueBody {
  projectId: string;
  title: string;
  description?: string | null;
  severity?: IssueSeverity;
  status?: IssueStatus;
  foundDate?: string;
  sessionId?: string | null;
}

export const useCreateIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: IssueBody) => api.post<{ data: Issue }>('/issues', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKeys.all }),
  });
};

export const useUpdateIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<IssueBody> }) =>
      api.put<{ data: Issue }>(`/issues/${id}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKeys.all }),
  });
};

export const useDeleteIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/issues/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKeys.all }),
  });
};

export const useFixIssue = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<{ data: Issue }>(`/issues/${id}/fix`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKeys.all }),
  });
};
