import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';

export interface RoutineDay {
  id: string;
  dayOfWeek: number;
  dayLabel: string;
  templateId: string | null;
  templateName: string | null;
  isRestDay: boolean;
}

export interface Routine {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDeloadWeek: boolean;
  startedAt: string | null;
  createdAt: string;
  days: RoutineDay[];
}

export const routineKeys = {
  all: ['routines'] as const,
  detail: (id: string) => ['routines', id] as const,
  active: ['routines', 'active'] as const,
  today: ['routines', 'today'] as const,
};

export const useRoutines = () =>
  useQuery({
    queryKey: routineKeys.all,
    queryFn: () => api.get<{ data: { routines: Routine[] } }>('/routines').then(unwrap),
  });

export const useRoutine = (id: string | undefined) =>
  useQuery({
    enabled: !!id,
    queryKey: routineKeys.detail(id ?? ''),
    queryFn: () => api.get<{ data: Routine }>(`/routines/${id}`).then(unwrap),
  });

export const useActiveRoutine = () =>
  useQuery({
    queryKey: routineKeys.active,
    queryFn: () => api.get<{ data: Routine | null }>('/routines/active').then(unwrap),
  });

export const useTodayWorkout = () =>
  useQuery({
    queryKey: routineKeys.today,
    queryFn: () =>
      api
        .get<{ data: { routine: Routine | null; today: RoutineDay | null } }>('/routines/active/today')
        .then(unwrap),
  });

export interface RoutineBody {
  name: string;
  description?: string;
  isActive?: boolean;
  isDeloadWeek?: boolean;
  days: { dayOfWeek: number; templateId?: string | null; isRestDay?: boolean }[];
}

export const useCreateRoutine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RoutineBody) => api.post<{ data: Routine }>('/routines', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
};

export const useUpdateRoutine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: RoutineBody }) =>
      api.put<{ data: Routine }>(`/routines/${id}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
};

export const useActivateRoutine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch<{ data: Routine }>(`/routines/${id}/activate`).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
};

export const useDeleteRoutine = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/routines/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routines'] }),
  });
};
