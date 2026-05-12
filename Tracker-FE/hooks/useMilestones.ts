import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { Milestone, Priority, Subtask, XpAwardResult } from '@/types';
import { gameKeys } from './useGame';
import { projectKeys } from './useProjects';

export const milestoneKeys = {
  list: (projectId: string) => ['milestones', 'list', projectId] as const,
};

export const useMilestones = (projectId: string | undefined) =>
  useQuery({
    enabled: !!projectId,
    queryKey: milestoneKeys.list(projectId ?? ''),
    queryFn: () =>
      api
        .get<{ data: { milestones: Milestone[] } }>('/milestones', { params: { projectId } })
        .then(unwrap),
  });

interface CreateBody {
  projectId: string;
  title: string;
  targetDate?: string | null;
  notes?: string | null;
  orderIndex?: number;
}

export const useCreateMilestone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBody) =>
      api.post<{ data: Milestone }>('/milestones', body).then(unwrap),
    onSuccess: (m) => {
      qc.invalidateQueries({ queryKey: milestoneKeys.list(m.projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(m.projectId) });
    },
  });
};

export const useUpdateMilestone = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Omit<CreateBody, 'projectId'>> }) =>
      api.put<{ data: Milestone }>(`/milestones/${id}`, body).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: milestoneKeys.list(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
};

export const useDeleteMilestone = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/milestones/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: milestoneKeys.list(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
};

export const useCompleteMilestone = (projectId: string) => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      api
        .patch<{ data: { milestone: Milestone } & XpAwardResult }>(`/milestones/${id}/complete`, { completed })
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Milestone');
      qc.invalidateQueries({ queryKey: milestoneKeys.list(projectId) });
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useReorderMilestones = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.patch('/milestones/reorder', { ids }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: milestoneKeys.list(projectId) }),
  });
};

// ── Subtasks ──────────────────────────────────────────────────

interface SubtaskBody {
  title: string;
  priority?: Priority;
  estimatedHours?: number | null;
  orderIndex?: number;
}

export const useCreateSubtask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, body }: { milestoneId: string; body: SubtaskBody }) =>
      api.post<{ data: Subtask }>(`/milestones/${milestoneId}/subtasks`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: milestoneKeys.list(projectId) }),
  });
};

export const useUpdateSubtask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      milestoneId,
      subtaskId,
      body,
    }: {
      milestoneId: string;
      subtaskId: string;
      body: Partial<SubtaskBody> & { completed?: boolean };
    }) =>
      api
        .put<{ data: Subtask }>(`/milestones/${milestoneId}/subtasks/${subtaskId}`, body)
        .then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: milestoneKeys.list(projectId) }),
  });
};

export const useDeleteSubtask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, subtaskId }: { milestoneId: string; subtaskId: string }) =>
      api.delete(`/milestones/${milestoneId}/subtasks/${subtaskId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: milestoneKeys.list(projectId) }),
  });
};

export const useToggleSubtask = (projectId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, subtaskId }: { milestoneId: string; subtaskId: string }) =>
      api
        .patch<{ data: Subtask }>(`/milestones/${milestoneId}/subtasks/${subtaskId}/complete`)
        .then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: milestoneKeys.list(projectId) }),
  });
};
