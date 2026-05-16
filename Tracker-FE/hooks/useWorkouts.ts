import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { celebrate } from '@/lib/celebrate';
import { detectLevelUp } from '@/lib/levels';
import type {
  DojoRank,
  GridCell,
  PersonalRecord,
  Workout,
  WorkoutSummary,
  XpAwardResult,
} from '@/types';
import { gameKeys } from './useGame';

export const workoutKeys = {
  all: ['workouts'] as const,
  list: (params?: Record<string, unknown>) => ['workouts', 'list', params] as const,
  detail: (id: string) => ['workouts', id] as const,
  grid: ['workouts', 'grid'] as const,
  records: ['workouts', 'records'] as const,
  rank: ['workouts', 'rank'] as const,
};

export const useDojoRank = () =>
  useQuery({
    queryKey: workoutKeys.rank,
    queryFn: () => api.get<{ data: DojoRank }>('/workouts/rank').then(unwrap),
  });

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

export interface PersonalRecordRich {
  id: string;
  exerciseId: string | null;
  exerciseName: string;
  musclePrimary: string | null;
  equipment: string | null;
  bestWeightKg: number | null;
  bestReps: number | null;
  bestVolumeKg: number | null;
  bestEstOneRmKg: number | null;
  achievedAt: string;
}

export const usePersonalRecords = () =>
  useQuery({
    queryKey: workoutKeys.records,
    queryFn: () =>
      api
        .get<{ data: { records: PersonalRecordRich[] } }>('/workouts/records')
        .then(unwrap),
  });

export interface ExerciseHistoryPoint {
  date: string;
  topWeightKg: number;
  topReps: number;
  volumeKg: number;
  estOneRmKg: number;
}

export const useExerciseHistory = (params: { exerciseId?: string; name?: string }) =>
  useQuery({
    enabled: !!(params.exerciseId || params.name),
    queryKey: ['workouts', 'history', params],
    queryFn: () =>
      api
        .get<{ data: { series: ExerciseHistoryPoint[] } }>('/workouts/records/history', { params })
        .then(unwrap),
  });

export interface WeeklyStats {
  week: { weekStart: string; workouts: number; volume: number; minutes: number; sets: number }[];
}
export const useWeeklyStats = (weeks = 12) =>
  useQuery({
    queryKey: ['workouts', 'stats', 'weekly', weeks],
    queryFn: () =>
      api.get<{ data: WeeklyStats }>('/workouts/stats/weekly', { params: { weeks } }).then(unwrap),
  });

export interface MuscleStats {
  weeks: number;
  muscles: { muscle: string; setsPerWeek: number; volumePerWeek: number }[];
}
export const useMuscleStats = (weeks = 4) =>
  useQuery({
    queryKey: ['workouts', 'stats', 'muscles', weeks],
    queryFn: () =>
      api.get<{ data: MuscleStats }>('/workouts/stats/muscles', { params: { weeks } }).then(unwrap),
  });

export interface AllTimeStats {
  totalWorkouts: number;
  totalVolumeKg: number;
  totalMinutes: number;
  totalPRs: number;
  favoriteExercise: string | null;
  topMuscle: string | null;
  currentStreak: number;
  longestStreak: number;
}
export const useAllTimeStats = () =>
  useQuery({
    queryKey: ['workouts', 'stats', 'all-time'],
    queryFn: () => api.get<{ data: AllTimeStats }>('/workouts/stats/all-time').then(unwrap),
  });

export const useBulkDeleteWorkouts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { from: string; to: string }) =>
      api.delete<{ data: { deleted: number } }>('/workouts/bulk', { data: body }).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: workoutKeys.all }),
  });
};

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export const useImportWorkouts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (csv: string) =>
      api.post<{ data: ImportResult }>('/workouts/import', { csv }).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: workoutKeys.all }),
  });
};

import type { MoodTag, SetType, WorkoutType } from '@/types';

interface CreateBody {
  name: string;
  type: WorkoutType;
  date?: string;
  durationMinutes?: number;
  stars?: number | null;
  notes?: string;
  moodTag?: MoodTag;
  templateId?: string | null;
  routineDayId?: string | null;
  exercises: {
    name: string;
    exerciseId?: string;
    supersetGroupId?: string | null;
    notes?: string;
    sets: {
      reps?: number;
      weightKg?: number;
      durationSeconds?: number;
      setType?: SetType;
      isPr?: boolean;
    }[];
  }[];
}

export const useCreateWorkout = () => {
  const qc = useQueryClient();
  const pushBadgeUnlock = useAppStore((s) => s.pushBadgeUnlock);
  const pushLevelUp = useAppStore((s) => s.pushLevelUp);
  return useMutation({
    mutationFn: (body: CreateBody) =>
      api
        .post<{ data: { workout: Workout } & XpAwardResult & { personalRecordsSet: string[] } }>(
          '/workouts',
          body,
        )
        .then(unwrap),
    onSuccess: (res) => {
      // Workouts are infrequent, deliberate actions — always worth confetti.
      // Badge unlock or PR escalates to epic; level-up will trigger its own modal+confetti elsewhere.
      const hasBadge = (res.badgesUnlocked?.length ?? 0) > 0;
      const hasPR = (res.personalRecordsSet?.length ?? 0) > 0;
      celebrate({
        xp: res.xpEarned,
        label: hasPR ? 'New PR! 🏆' : 'Workout Complete',
        level: hasBadge || hasPR ? 'epic' : 'big',
      });
      (res.badgesUnlocked ?? []).forEach((b) => pushBadgeUnlock(b));

      const prior = qc.getQueryData<{ totalXp: number }>(gameKeys.state)?.totalXp ?? 0;
      const lu = detectLevelUp(prior, (res as any).newTotalXp ?? prior);
      if (lu) {
        pushLevelUp({
          previousLevel: lu.previousLevel,
          newLevel: lu.newLevel.level,
          newTitle: lu.newLevel.title,
          newColor: lu.newLevel.color,
        });
      }

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

export const useUpdateWorkout = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateBody }) =>
      api.put<{ data: Workout }>(`/workouts/${id}`, body).then(unwrap),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: workoutKeys.all });
      qc.invalidateQueries({ queryKey: workoutKeys.detail(vars.id) });
    },
  });
};

export const useSaveWorkoutAsTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      api
        .post<{ data: { id: string; name: string } }>(`/workouts/${id}/save-as-template`, { name })
        .then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
};
