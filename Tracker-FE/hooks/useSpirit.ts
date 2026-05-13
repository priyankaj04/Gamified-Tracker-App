import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type {
  BodyMeasurement,
  CompositionEntry,
  CompositionStats,
  DailyWellness,
  MeasurementsStats,
  SpiritRank,
  StepLog,
  StepsStats,
  UserProfile,
  WeightStats,
  WellnessScore,
  XpAwardResult,
} from '@/types';
import { gameKeys } from './useGame';
import { weightKeys } from './useWeight';

export const spiritKeys = {
  all: ['spirit'] as const,
  profile: ['spirit', 'profile'] as const,
  weightStats: ['spirit', 'weight', 'stats'] as const,
  measurements: ['spirit', 'measurements'] as const,
  measurementsLatest: ['spirit', 'measurements', 'latest'] as const,
  measurementsStats: ['spirit', 'measurements', 'stats'] as const,
  composition: ['spirit', 'composition'] as const,
  compositionStats: ['spirit', 'composition', 'stats'] as const,
  wellness: ['spirit', 'wellness'] as const,
  wellnessToday: ['spirit', 'wellness', 'today'] as const,
  wellnessStats: ['spirit', 'wellness', 'stats'] as const,
  wellnessCorrelation: ['spirit', 'wellness', 'correlation'] as const,
  correlation: ['spirit', 'correlation'] as const,
  steps: ['spirit', 'steps'] as const,
  stepsStats: ['spirit', 'steps', 'stats'] as const,
  score: ['spirit', 'wellness-score'] as const,
  scoreHistory: ['spirit', 'wellness-score', 'history'] as const,
  rank: ['spirit', 'rank'] as const,
};

export const useSpiritRank = () =>
  useQuery({
    queryKey: spiritKeys.rank,
    queryFn: () => api.get<{ data: SpiritRank }>('/spirit/rank').then(unwrap),
  });

// ─── Profile ────────────────────────────────────────────────
export const useProfile = () =>
  useQuery({
    queryKey: spiritKeys.profile,
    queryFn: () => api.get<{ data: UserProfile | null }>('/spirit/profile').then(unwrap),
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<UserProfile>) =>
      api.put<{ data: UserProfile }>('/spirit/profile', body).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: spiritKeys.profile });
      qc.invalidateQueries({ queryKey: spiritKeys.weightStats });
    },
  });
};

// ─── Weight stats ───────────────────────────────────────────
export const useWeightStats = () =>
  useQuery({
    queryKey: spiritKeys.weightStats,
    queryFn: () => api.get<{ data: WeightStats }>('/spirit/weight/stats').then(unwrap),
  });

// ─── Measurements ───────────────────────────────────────────
export const useMeasurements = () =>
  useQuery({
    queryKey: spiritKeys.measurements,
    queryFn: () => api.get<{ data: BodyMeasurement[] }>('/spirit/measurements').then(unwrap),
  });

export const useLatestMeasurement = () =>
  useQuery({
    queryKey: spiritKeys.measurementsLatest,
    queryFn: () => api.get<{ data: BodyMeasurement | null }>('/spirit/measurements/latest').then(unwrap),
  });

export const useMeasurementsStats = () =>
  useQuery({
    queryKey: spiritKeys.measurementsStats,
    queryFn: () => api.get<{ data: MeasurementsStats }>('/spirit/measurements/stats').then(unwrap),
  });

export const useLogMeasurement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<BodyMeasurement>) =>
      api.post<{ data: BodyMeasurement }>('/spirit/measurements', body).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: spiritKeys.measurements });
      qc.invalidateQueries({ queryKey: spiritKeys.measurementsLatest });
      qc.invalidateQueries({ queryKey: spiritKeys.measurementsStats });
    },
  });
};

export const useMeasurementCompare = (date1: string | null, date2: string | null) =>
  useQuery({
    queryKey: ['spirit', 'measurements', 'compare', date1, date2],
    queryFn: () =>
      api
        .get<{ data: { a: BodyMeasurement | null; b: BodyMeasurement | null; delta: Record<string, number | null> } }>(
          '/spirit/measurements/compare',
          { params: { date1, date2 } },
        )
        .then(unwrap),
    enabled: !!date1 && !!date2,
  });

export const useDeleteMeasurement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/spirit/measurements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: spiritKeys.measurements }),
  });
};

// ─── Composition ────────────────────────────────────────────
export const useComposition = () =>
  useQuery({
    queryKey: spiritKeys.composition,
    queryFn: () => api.get<{ data: CompositionEntry[] }>('/spirit/composition').then(unwrap),
  });

export const useCompositionStats = () =>
  useQuery({
    queryKey: spiritKeys.compositionStats,
    queryFn: () => api.get<{ data: CompositionStats }>('/spirit/composition/stats').then(unwrap),
  });

// ─── Daily wellness ─────────────────────────────────────────
export const useWellnessToday = () =>
  useQuery({
    queryKey: spiritKeys.wellnessToday,
    queryFn: () => api.get<{ data: DailyWellness | null }>('/spirit/wellness/today').then(unwrap),
  });

export const useWellnessHistory = () =>
  useQuery({
    queryKey: spiritKeys.wellness,
    queryFn: () => api.get<{ data: DailyWellness[] }>('/spirit/wellness').then(unwrap),
  });

export const useLogWellness = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<DailyWellness>) =>
      api.post<{ data: DailyWellness }>('/spirit/wellness', body).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: spiritKeys.wellnessToday });
      qc.invalidateQueries({ queryKey: spiritKeys.wellness });
      qc.invalidateQueries({ queryKey: spiritKeys.wellnessStats });
    },
  });
};

// ─── Steps ──────────────────────────────────────────────────
export const useSteps = () =>
  useQuery({
    queryKey: spiritKeys.steps,
    queryFn: () => api.get<{ data: StepLog[] }>('/spirit/steps').then(unwrap),
  });

export const useStepsStats = () =>
  useQuery({
    queryKey: spiritKeys.stepsStats,
    queryFn: () => api.get<{ data: StepsStats }>('/spirit/steps/stats').then(unwrap),
  });

export const useSyncSteps = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (body: { steps: number; date?: string; goal?: number }) =>
      api.post<{ data: { log: StepLog } & XpAwardResult }>('/spirit/steps', body).then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Step Goal Hit');
      qc.invalidateQueries({ queryKey: spiritKeys.steps });
      qc.invalidateQueries({ queryKey: spiritKeys.stepsStats });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

// ─── Wellness composite score ───────────────────────────────
export const useWellnessScore = () =>
  useQuery({
    queryKey: spiritKeys.score,
    queryFn: () => api.get<{ data: WellnessScore }>('/spirit/wellness-score').then(unwrap),
  });

export const useWellnessScoreHistory = () =>
  useQuery({
    queryKey: spiritKeys.scoreHistory,
    queryFn: () =>
      api
        .get<{ data: { date: string; total: number; sleep: number; nutrition: number; habits: number; workouts: number; weightTrend: number }[] }>(
          '/spirit/wellness-score/history',
        )
        .then(unwrap),
  });

// ─── Re-export weight keys so screens can invalidate from one place
export { weightKeys };
