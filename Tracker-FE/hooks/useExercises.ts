import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { Exercise, ExerciseType } from '@/types';

export const exerciseKeys = {
  all: ['exercises'] as const,
  list: (params?: unknown) => ['exercises', 'list', params] as const,
  meta: ['exercises', 'meta'] as const,
};

export interface ExerciseFilters {
  search?: string;
  muscle?: string;
  equipment?: string;
  type?: ExerciseType;
  favorite?: boolean;
}

export const useExercises = (filters: ExerciseFilters = {}) =>
  useQuery({
    queryKey: exerciseKeys.list(filters),
    queryFn: () =>
      api
        .get<{ data: { exercises: Exercise[] } }>('/exercises', { params: filters })
        .then(unwrap),
  });

export const useExerciseMeta = () =>
  useQuery({
    queryKey: exerciseKeys.meta,
    queryFn: () =>
      api
        .get<{ data: { muscleGroups: string[]; equipmentTypes: string[] } }>('/exercises/meta')
        .then(unwrap),
    staleTime: Infinity,
  });

interface CreateBody {
  name: string;
  musclePrimary: string;
  muscleSecondary?: string[];
  equipment: string;
  exerciseType: ExerciseType;
  notes?: string;
}

export const useCreateExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateBody) => api.post<{ data: Exercise }>('/exercises', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: exerciseKeys.all }),
  });
};

export const useUpdateExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateBody> & { isFavorite?: boolean } }) =>
      api.put<{ data: Exercise }>(`/exercises/${id}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: exerciseKeys.all }),
  });
};

export interface LastSet {
  date: string | null;
  weightKg: number;
  reps: number;
}

export const useLastSet = (ref: { exerciseId?: string; name?: string }) =>
  useQuery({
    enabled: !!(ref.exerciseId || ref.name),
    queryKey: ['exercises', 'last-set', ref],
    queryFn: () =>
      api
        .get<{ data: { last: LastSet | null } }>('/exercises/last-set', {
          params: { id: ref.exerciseId, name: ref.name },
        })
        .then(unwrap),
    staleTime: 60_000,
  });

export const useDeleteExercise = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/exercises/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: exerciseKeys.all }),
  });
};
