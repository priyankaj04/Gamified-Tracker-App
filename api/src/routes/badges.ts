import { Router } from 'express';
import { asyncHandler, ok } from '@/middleware/errorHandler';
import { supabase } from '@/services/supabase';
import { BADGES } from '@/lib/badges';
import type { Rarity } from '@/types';

export const badgesRouter = Router();

badgesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const sb = supabase();
    const { data: unlockedRows } = await sb.from('user_badges').select('*');
    const unlockedMap = new Map((unlockedRows ?? []).map((r) => [r.badge_id, r]));

    const badges = BADGES.map((b) => {
      const u = unlockedMap.get(b.id);
      return {
        id: b.id,
        name: b.name,
        description: b.description,
        rarity: b.rarity,
        module: b.module,
        xpReward: b.xpReward,
        unlocked: !!u,
        unlockedAt: u?.unlocked_at ?? null,
      };
    });

    const byRarity: Record<Rarity, number> = { Common: 0, Rare: 0, Epic: 0, Legendary: 0 };
    badges.forEach((b) => {
      if (b.unlocked) byRarity[b.rarity]++;
    });

    ok(res, {
      badges,
      summary: {
        total: badges.length,
        unlocked: badges.filter((b) => b.unlocked).length,
        byRarity,
      },
    });
  }),
);
