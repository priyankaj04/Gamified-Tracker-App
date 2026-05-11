import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { CycleLog, CycleSettings, CycleSymptom, CycleToday } from '@/types';

export const cycleKeys = {
  all: ['cycle'] as const,
  settings: ['cycle', 'settings'] as const,
  list: ['cycle', 'list'] as const,
  today: ['cycle', 'today'] as const,
  prediction: ['cycle', 'prediction'] as const,
  symptoms: (date: string) => ['cycle', 'symptoms', date] as const,
};

export interface CyclePrediction {
  nextPeriodStart: string | null;
  daysUntil: number | null;
  averageCycleLength: number;
  lastPeriodStart: string | null;
  sampleSize: number;
}

export const useCyclePrediction = () =>
  useQuery({
    queryKey: cycleKeys.prediction,
    queryFn: () => api.get<{ data: CyclePrediction }>('/spirit/cycle/prediction').then(unwrap),
  });

export const useCycleSettings = () =>
  useQuery({
    queryKey: cycleKeys.settings,
    queryFn: () => api.get<{ data: CycleSettings }>('/spirit/cycle/settings').then(unwrap),
  });

export const useUpdateCycleSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<CycleSettings>) =>
      api.put<{ data: CycleSettings }>('/spirit/cycle/settings', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: cycleKeys.all }),
  });
};

export const useCycles = () =>
  useQuery({
    queryKey: cycleKeys.list,
    queryFn: () => api.get<{ data: CycleLog[] }>('/spirit/cycle').then(unwrap),
  });

export const useCycleToday = () =>
  useQuery({
    queryKey: cycleKeys.today,
    queryFn: () => api.get<{ data: CycleToday }>('/spirit/cycle/today').then(unwrap),
  });

export const useStartCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { startDate?: string; endDate?: string; notes?: string }) =>
      api.post<{ data: CycleLog }>('/spirit/cycle/start', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: cycleKeys.all }),
  });
};

export const useUpdateCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { startDate?: string; endDate?: string; notes?: string };
    }) => api.put<{ data: CycleLog }>(`/spirit/cycle/${id}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: cycleKeys.all }),
  });
};

export const useDeleteCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/spirit/cycle/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: cycleKeys.all }),
  });
};

export const useEndCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { endDate?: string }) =>
      api.patch<{ data: CycleLog }>('/spirit/cycle/end', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: cycleKeys.all }),
  });
};

export const useCycleSymptoms = (date: string) =>
  useQuery({
    queryKey: cycleKeys.symptoms(date),
    queryFn: () =>
      api
        .get<{ data: CycleSymptom | null }>('/spirit/cycle/symptoms', { params: { date } })
        .then(unwrap),
  });

export const useLogSymptoms = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<CycleSymptom>) =>
      api.post<{ data: CycleSymptom }>('/spirit/cycle/symptoms', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: cycleKeys.all }),
  });
};
