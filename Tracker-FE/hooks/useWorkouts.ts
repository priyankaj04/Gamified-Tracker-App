import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type { GridCell, PersonalRecord, Workout, WorkoutSummary, XpAwardResult } from '@/types';
import { gameKeys } from './useGame';

export const workoutKeys = {
  all: ['workouts'] as const,
  list: (params?: Record<string, unknown>) => ['workouts', 'list', params] as const,
  detail: (id: string) => ['workouts', id] as const,
  grid: ['workouts', 'grid'] as const,
  records: ['workouts', 'records'] as const,
};

export const useWorkouts = (params?: { page?: number; limit?: number; from?: string; to?: string }) =>
  useQuery({
    queryKey: workoutKeys.list(params),
    queryFn: () =>
      api
        .get<{ data: { workouts: WorkoutSummary[]; total: number } }>('/workouts', { params })
        .then(unwrap),
  });

export const useWorkout = (id: string | undefined) =>
  useQuery({
    enabled: !!id,
    queryKey: workoutKeys.detail(id ?? ''),
    queryFn: () => api.get<{ data: Workout }>(`/workouts/${id}`).then(unwrap),
  });

export const useWorkoutGrid = () =>
  useQuery({
    queryKey: workoutKeys.grid,
    queryFn: () => api.get<{ data: { grid: GridCell[] } }>('/workouts/grid').then(unwrap),
  });

export const usePersonalRecords = () =>
  useQuery({
    queryKey: workoutKeys.records,
    queryFn: () => api.get<{ data: { records: PersonalRecord[] } }>('/workouts/records').then(unwrap),
  });

interface CreateBody {
  name: string;
  type: string;
  date?: string;
  durationMinutes?: number;
  stars?: number | null;
  notes?: string;
  exercises: { name: string; sets: { reps?: number; weightKg?: number; durationSeconds?: number; isPr?: boolean }[] }[];
}

export const useCreateWorkout = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (body: CreateBody) =>
      api
        .post<{ data: { workout: Workout } & XpAwardResult & { personalRecordsSet: string[] } }>(
          '/workouts',
          body,
        )
        .then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Workout Complete');
      qc.invalidateQueries({ queryKey: workoutKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
      qc.invalidateQueries({ queryKey: ['badges'] });
    },
  });
};

export const useDeleteWorkout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/workouts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: workoutKeys.all }),
  });
};
