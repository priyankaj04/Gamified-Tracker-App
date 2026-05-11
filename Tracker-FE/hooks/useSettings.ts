import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';

export interface UserSettings {
  weightUnit: 'kg' | 'lbs';
  distanceUnit: 'km' | 'mi';
  defaultRestSeconds: number;
  autoStartRest: boolean;
  oneRmFormula: 'Epley' | 'Brzycki' | 'Lander';
  weekStartsMonday: boolean;
  barbellWeightKg: number;
  workoutReminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  streakAtRiskEnabled: boolean;
  weeklySummaryEnabled: boolean;
}

export const useSettings = () =>
  useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get<{ data: UserSettings }>('/settings').then(unwrap),
  });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<UserSettings>) =>
      api.put<{ data: UserSettings }>('/settings', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
};

// Display helpers
export const toDisplayWeight = (kg: number | null | undefined, unit: 'kg' | 'lbs') => {
  if (kg == null) return null;
  return unit === 'lbs' ? kg * 2.20462 : kg;
};

export const fromDisplayWeight = (v: number, unit: 'kg' | 'lbs') => {
  return unit === 'lbs' ? v / 2.20462 : v;
};

export const toDisplayDistance = (km: number | null | undefined, unit: 'km' | 'mi') => {
  if (km == null) return null;
  return unit === 'mi' ? km * 0.621371 : km;
};
