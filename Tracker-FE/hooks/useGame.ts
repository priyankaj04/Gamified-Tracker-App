import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { GameState } from '@/types';

export const gameKeys = {
  state: ['game'] as const,
};

export const useGameState = () =>
  useQuery({
    queryKey: gameKeys.state,
    queryFn: () => api.get<{ data: GameState }>('/game').then(unwrap),
  });

export const useUpdateStreak = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (module: string) =>
      api.patch<{ data: any }>(`/game/streak/${module}`, {}).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: gameKeys.state }),
  });
};
