import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { celebrate } from '@/lib/celebrate';
import type { ActiveTimer, CodingSession, GridCell, SessionMood, XpAwardResult } from '@/types';
import { gameKeys } from './useGame';
import { projectKeys } from './useProjects';

export const sessionKeys = {
  all: ['sessions'] as const,
  list: (params?: Record<string, unknown>) => ['sessions', 'list', params] as const,
  today: ['sessions', 'today'] as const,
  grid: (days?: number) => ['sessions', 'grid', days] as const,
  activeTimer: ['sessions', 'timer', 'active'] as const,
};

interface ListParams {
  projectId?: string;
  from?: string;
  to?: string;
  tag?: string;
  page?: number;
  limit?: number;
}

export const useSessions = (params: ListParams = {}) =>
  useQuery({
    queryKey: sessionKeys.list(params as any),
    queryFn: () =>
      api.get<{ data: { sessions: CodingSession[] } }>('/sessions', { params }).then(unwrap),
  });

export const useTodaySessions = () =>
  useQuery({
    queryKey: sessionKeys.today,
    queryFn: () =>
      api
        .get<{ data: { totalMinutes: number; sessions: CodingSession[] } }>('/sessions/today')
        .then(unwrap),
  });

export const useSessionGrid = (days = 365) =>
  useQuery({
    queryKey: sessionKeys.grid(days),
    queryFn: () =>
      api
        .get<{
          data: { grid: (GridCell & { totalMinutes: number; sessionIds: string[] })[] };
        }>('/sessions/grid', { params: { days } })
        .then(unwrap),
  });

export interface SessionBody {
  projectId?: string | null;
  milestoneId?: string | null;
  date?: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes: number;
  mood?: SessionMood | null;
  notes?: string | null;
  stars?: number | null;
  isBillable?: boolean;
  pomodoroCount?: number;
  tags?: string[];
}

export const useCreateSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SessionBody) =>
      api.post<{ data: { session: CodingSession } & XpAwardResult }>('/sessions', body).then(unwrap),
    onSuccess: (res) => {
      celebrate({ xp: res.xpEarned, label: 'Session Logged' });
      qc.invalidateQueries({ queryKey: sessionKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
      qc.invalidateQueries({ queryKey: ['forge-stats'] });
    },
  });
};

export const useUpdateSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<SessionBody> }) =>
      api.put<{ data: CodingSession }>(`/sessions/${id}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.all }),
  });
};

export const useDeleteSession = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sessions/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.all }),
  });
};

// ── Active timer ──────────────────────────────────────────────

export const useActiveTimer = () =>
  useQuery({
    queryKey: sessionKeys.activeTimer,
    queryFn: () =>
      api.get<{ data: { timer: ActiveTimer | null } }>('/sessions/timer/active').then(unwrap),
    // Time is computed locally off startedAt — no need to poll every 5s; that
    // was the source of the visible stutter. Keep a generous safety refetch.
    refetchInterval: 60_000,
  });

export const useStartTimer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { projectId?: string | null; milestoneId?: string | null; isPomodoro?: boolean }) =>
      api
        .post<{ data: { timerId: string; startedAt: string; isPomodoro: boolean } }>(
          '/sessions/timer/start',
          body,
        )
        .then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.activeTimer }),
  });
};

export const useStopTimer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api
        .post<{
          data: { elapsedSec: number; projectId: string | null; milestoneId: string | null };
        }>('/sessions/timer/stop')
        .then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: sessionKeys.activeTimer }),
  });
};
