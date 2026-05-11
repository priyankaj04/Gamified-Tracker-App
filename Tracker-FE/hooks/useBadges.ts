import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type { Badge, Rarity } from '@/types';

export const useBadges = () =>
  useQuery({
    queryKey: ['badges'],
    queryFn: () =>
      api
        .get<{
          data: {
            badges: Badge[];
            summary: {
              total: number;
              unlocked: number;
              byRarity: Record<Rarity, number>;
            };
          };
        }>('/badges')
        .then(unwrap),
  });

export const useChallenges = () =>
  useQuery({
    queryKey: ['challenges'],
    queryFn: () =>
      api.get<{ data: { challenges: any[] } }>('/challenges').then(unwrap),
  });
