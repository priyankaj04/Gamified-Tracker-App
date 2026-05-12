import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { StandupLog } from '@/types';

export const standupKeys = {
  all: ['standup'] as const,
  list: ['standup', 'list'] as const,
  today: ['standup', 'today'] as const,
};

export const useStandups = () =>
  useQuery({
    queryKey: standupKeys.list,
    queryFn: () => api.get<{ data: { standups: StandupLog[] } }>('/standup').then(unwrap),
  });

export const useTodayStandup = () =>
  useQuery({
    queryKey: standupKeys.today,
    queryFn: () =>
      api.get<{ data: { standup: StandupLog | null } }>('/standup/today').then(unwrap),
  });

export interface StandupBody {
  yesterday?: string;
  today?: string;
  blockers?: string;
  projectId?: string | null;
  date?: string;
}

export const useUpsertStandup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: StandupBody) => api.post<{ data: StandupLog }>('/standup', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: standupKeys.all }),
  });
};

export const useDeleteStandup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/standup/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: standupKeys.all }),
  });
};

export const useStandupExport = (from?: string, to?: string) =>
  useQuery({
    enabled: false,
    queryKey: ['standup', 'export', from, to],
    queryFn: () =>
      api.get<{ data: { text: string } }>('/standup/export', { params: { from, to } }).then(unwrap),
  });
