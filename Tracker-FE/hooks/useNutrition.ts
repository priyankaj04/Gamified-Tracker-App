import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import type {
  FoodItem,
  MealLog,
  NutritionGoals,
  NutritionSummary,
  TDEEResult,
  XpAwardResult,
} from '@/types';
import { gameKeys } from './useGame';

export const nutritionKeys = {
  all: ['nutrition'] as const,
  goals: ['nutrition', 'goals'] as const,
  meals: (date: string) => ['nutrition', 'meals', date] as const,
  recent: ['nutrition', 'meals', 'recent'] as const,
  summary: (date: string) => ['nutrition', 'summary', date] as const,
  weekly: ['nutrition', 'summary', 'weekly'] as const,
  foods: (search?: string) => ['nutrition', 'foods', search] as const,
};

export const useNutritionGoals = () =>
  useQuery({
    queryKey: nutritionKeys.goals,
    queryFn: () => api.get<{ data: NutritionGoals | null }>('/spirit/nutrition/goals').then(unwrap),
  });

export const useUpdateNutritionGoals = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<NutritionGoals>) =>
      api.put<{ data: NutritionGoals }>('/spirit/nutrition/goals', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.all }),
  });
};

export const useTDEE = () =>
  useMutation({
    mutationFn: (body: {
      weightKg: number;
      heightCm: number;
      age: number;
      gender: 'male' | 'female' | 'other';
      activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    }) => api.post<{ data: TDEEResult }>('/spirit/nutrition/tdee', body).then(unwrap),
  });

export const useNutritionSummary = (date: string) =>
  useQuery({
    queryKey: nutritionKeys.summary(date),
    queryFn: () =>
      api.get<{ data: NutritionSummary }>('/spirit/nutrition/summary', { params: { date } }).then(unwrap),
  });

export const useWeeklyNutrition = () =>
  useQuery({
    queryKey: nutritionKeys.weekly,
    queryFn: () =>
      api
        .get<{ data: { date: string; calories: number; proteinG: number; carbsG: number; fatsG: number }[] }>(
          '/spirit/nutrition/summary/weekly',
        )
        .then(unwrap),
  });

export const useRecentMeals = () =>
  useQuery({
    queryKey: nutritionKeys.recent,
    queryFn: () => api.get<{ data: MealLog[] }>('/spirit/nutrition/meals/recent').then(unwrap),
  });

export const useLogMeal = () => {
  const qc = useQueryClient();
  const pushPopup = useAppStore((s) => s.pushPopup);
  return useMutation({
    mutationFn: (body: Partial<MealLog>) =>
      api.post<{ data: { meal: MealLog } & XpAwardResult }>('/spirit/nutrition/meals', body).then(unwrap),
    onSuccess: (res) => {
      if (res.xpEarned) pushPopup(res.xpEarned, 'Meal Logged');
      qc.invalidateQueries({ queryKey: nutritionKeys.all });
      qc.invalidateQueries({ queryKey: gameKeys.state });
    },
  });
};

export const useDeleteMeal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/spirit/nutrition/meals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: nutritionKeys.all }),
  });
};

// Local-date helper — must match `todayISO()` in DatePicker so the optimistic
// cache key lines up with what the screen actually reads.
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
};

export const useLogWater = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amountMl: number; date?: string }) =>
      api
        .post<{ data: { id: string; date: string; amountMl: number } }>('/spirit/nutrition/water', {
          // also pin the server save to the local date so it stays in sync
          date: body.date ?? localToday(),
          amountMl: body.amountMl,
        })
        .then(unwrap),
    onMutate: async (body) => {
      const date = body.date ?? localToday();
      const key = nutritionKeys.summary(date);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<any>(key);
      if (prev) {
        qc.setQueryData(key, { ...prev, waterMl: (prev.waterMl ?? 0) + body.amountMl });
      }
      return { prev, key };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: nutritionKeys.all }),
  });
};

export const useFoods = (search?: string) =>
  useQuery({
    queryKey: nutritionKeys.foods(search),
    queryFn: () =>
      api
        .get<{ data: FoodItem[] }>('/spirit/nutrition/food', { params: search ? { search } : undefined })
        .then(unwrap),
  });

export const useCreateFood = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<FoodItem>) =>
      api.post<{ data: FoodItem }>('/spirit/nutrition/food', body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutrition', 'foods'] }),
  });
};

export const useDeleteFood = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/spirit/nutrition/food/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutrition', 'foods'] }),
  });
};
