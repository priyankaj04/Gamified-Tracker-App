import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { WorkoutTemplate, SetType, WorkoutType } from '@/types';

export const templateKeys = {
  all: ['templates'] as const,
  detail: (id: string) => ['templates', id] as const,
};

export const useTemplates = () =>
  useQuery({
    queryKey: templateKeys.all,
    queryFn: () =>
      api
        .get<{ data: { templates: WorkoutTemplate[] } }>('/templates')
        .then(unwrap),
  });

export const useTemplate = (id: string | undefined) =>
  useQuery({
    enabled: !!id,
    queryKey: templateKeys.detail(id ?? ''),
    queryFn: () => api.get<{ data: WorkoutTemplate }>(`/templates/${id}`).then(unwrap),
  });

export interface TemplateBody {
  name: string;
  type?: WorkoutType;
  estimatedMinutes?: number;
  notes?: string;
  exercises: {
    exerciseId: string;
    supersetGroupId?: string | null;
    notes?: string;
    sets: {
      setType?: SetType;
      targetReps?: number;
      targetWeightKg?: number;
      targetDurationSeconds?: number;
    }[];
  }[];
}

export const useCreateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TemplateBody) =>
      api.post<{ data: WorkoutTemplate }>('/templates', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
};

export const useUpdateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TemplateBody }) =>
      api.put<{ data: WorkoutTemplate }>(`/templates/${id}`, body).then(unwrap),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: templateKeys.all });
      qc.invalidateQueries({ queryKey: templateKeys.detail(vars.id) });
    },
  });
};

export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
};

export const useDuplicateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ data: WorkoutTemplate }>(`/templates/${id}/duplicate`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
};
