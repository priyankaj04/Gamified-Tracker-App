import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { CodingSession, Milestone, Project, XpAwardResult } from '@/types';
import { gameKeys } from './useGame';

export const projectKeys = {
  all: ['projects'] as const,
  list: (status?: string) => ['projects', 'list', status] as const,
  detail: (id: string) => ['projects', id] as const,
};

export const useProjects = (status?: string) =>
  useQuery({
    queryKey: projectKeys.list(status),
    queryFn: () =>
      api
        .get<{ data: { projects: Project[] } }>('/projects', { params: status ? { status } : undefined })
        .then(unwrap),
  });

export const useProject = (id: string | undefined) =>
  useQuery({
    enabled: !!id,
    queryKey: projectKeys.detail(id ?? ''),
    queryFn: () => api.get<{ data: Project }>(`/projects/${id}`).then(unwrap),
  });

interface CreateBody {
  name: string;
  description?: string;
  techStack: string[];
  githubUrl?: string;
  milestones?: { title: string }[];
}

export const useCreateProject = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (body: CreateBody) =>
      api.post<{ data: { project: Project } & XpAwardResult }>('/projects', body).then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Project Created');
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useToggleMilestone = (projectId: string) => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      api
        .patch<{ data: { milestone: Milestone } & XpAwardResult }>(
          `/projects/${projectId}/milestones/${id}`,
          { completed },
        )
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Milestone');
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useCodingSessions = (params?: { projectId?: string; from?: string; to?: string }) =>
  useQuery({
    queryKey: ['sessions', 'list', params],
    queryFn: () =>
      api
        .get<{ data: { sessions: CodingSession[] } }>('/sessions', { params })
        .then(unwrap),
  });

interface SessionBody {
  projectId?: string | null;
  date?: string;
  durationMinutes: number;
  notes?: string;
  stars?: number | null;
}

export const useLogSession = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (body: SessionBody) =>
      api.post<{ data: { session: CodingSession } & XpAwardResult }>('/sessions', body).then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Session Logged');
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};
