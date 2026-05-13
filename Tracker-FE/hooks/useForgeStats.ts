import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { ForgeRank, ForgeSettings, ForgeStats } from '@/types';

export const forgeStatsKeys = {
  summary: ['forge-stats', 'summary'] as const,
  weekly: ['forge-stats', 'weekly'] as const,
  weeklyChart: ['forge-stats', 'weekly-chart'] as const,
  byProject: ['forge-stats', 'by-project'] as const,
  dailyGoal: ['forge-stats', 'daily-goal'] as const,
  billable: (month: string) => ['forge-stats', 'billable', month] as const,
  settings: ['forge-settings'] as const,
  rank: ['forge-stats', 'rank'] as const,
};

export const useForgeRank = () =>
  useQuery({
    queryKey: forgeStatsKeys.rank,
    queryFn: () => api.get<{ data: ForgeRank }>('/forge-stats/rank').then(unwrap),
  });

export const useForgeSummary = () =>
  useQuery({
    queryKey: forgeStatsKeys.summary,
    queryFn: () => api.get<{ data: ForgeStats }>('/forge-stats/summary').then(unwrap),
  });

export const useWeeklyHours = () =>
  useQuery({
    queryKey: forgeStatsKeys.weekly,
    queryFn: () =>
      api
        .get<{ data: { days: { date: string; minutes: number }[] } }>('/forge-stats/weekly')
        .then(unwrap),
  });

export const useWeeklyChart = () =>
  useQuery({
    queryKey: forgeStatsKeys.weeklyChart,
    queryFn: () =>
      api
        .get<{ data: { weeks: { weekStart: string; minutes: number }[] } }>('/forge-stats/weekly-chart')
        .then(unwrap),
  });

export const useHoursByProject = () =>
  useQuery({
    queryKey: forgeStatsKeys.byProject,
    queryFn: () =>
      api
        .get<{
          data: { projects: { projectId: string; projectName: string; minutes: number; pct: number }[] };
        }>('/forge-stats/by-project')
        .then(unwrap),
  });

export const useDailyGoal = () =>
  useQuery({
    queryKey: forgeStatsKeys.dailyGoal,
    queryFn: () =>
      api
        .get<{
          data: {
            goalMinutes: number;
            todayMinutes: number;
            pct: number;
            goalStreak: number;
            longestGoalStreak: number;
          };
        }>('/forge-stats/daily-goal')
        .then(unwrap),
  });

export const useBillable = (month: string) =>
  useQuery({
    queryKey: forgeStatsKeys.billable(month),
    queryFn: () =>
      api
        .get<{
          data: {
            month: string;
            currency: string;
            rate: number;
            projects: { projectId: string; projectName: string; hours: number; earnings: number }[];
            totalHours: number;
            totalEarnings: number;
          };
        }>('/forge-stats/billable', { params: { month } })
        .then(unwrap),
  });

export const useForgeSettings = () =>
  useQuery({
    queryKey: forgeStatsKeys.settings,
    queryFn: () => api.get<{ data: ForgeSettings }>('/forge-settings').then(unwrap),
  });

export const useUpdateForgeSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ForgeSettings>) =>
      api.put<{ data: ForgeSettings }>('/forge-settings', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: forgeStatsKeys.settings }),
  });
};
