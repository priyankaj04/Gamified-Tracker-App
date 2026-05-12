import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, screenTheme, spiritText } from '@/lib/themes';
import { useBadges } from '@/hooks/useBadges';
import { useSpiritStreaks } from '@/hooks/useSpiritQuests';
import { useFastingStats } from '@/hooks/useFasting';

interface Goal {
  badgeId: string;
  name: string;
  target: number;
  current: number;
  icon: any;
  description: string;
}

export function NextBadgeCard() {
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;
  const badges = useBadges();
  const streaks = useSpiritStreaks();
  const fasting = useFastingStats();

  const next: Goal | null = useMemo(() => {
    const badgeList = badges.data?.badges ?? [];
    const unlocked = new Set(badgeList.filter((b) => b.unlocked).map((b) => b.id));
    const candidates: Goal[] = [
      {
        badgeId: 'consistent',
        name: 'Consistent',
        target: 7,
        current: streaks.data?.weight.current ?? 0,
        icon: 'scale',
        description: 'Log weight 7 days in a row',
      },
      {
        badgeId: 'nutritionist',
        name: 'Nutritionist',
        target: 30,
        current: streaks.data?.nutrition.current ?? 0,
        icon: 'restaurant',
        description: 'Log meals 30 days straight',
      },
      {
        badgeId: 'deep-sleep',
        name: 'Deep Sleep',
        target: 14,
        current: streaks.data?.sleepQuality.current ?? 0,
        icon: 'moon',
        description: 'Quality sleep 14 days in a row',
      },
      {
        badgeId: 'intermittent-master',
        name: 'Intermittent Master',
        target: 20,
        current: fasting.data?.completedFasts ?? 0,
        icon: 'timer',
        description: 'Complete 20 fasts',
      },
      {
        badgeId: 'habit-stack',
        name: 'Habit Stack',
        target: 7,
        current: streaks.data?.habits.current ?? 0,
        icon: 'checkmark-done',
        description: 'All habits 7 days in a row',
      },
    ];
    const remaining = candidates.filter((c) => !unlocked.has(c.badgeId) && c.target > c.current);
    if (remaining.length === 0) return null;
    // Pick the one closest to completion (highest % toward target)
    return remaining.reduce((best, c) => {
      const a = best.current / best.target;
      const b = c.current / c.target;
      return b > a ? c : best;
    });
  }, [badges.data, streaks.data, fasting.data]);

  if (!next) return null;

  const pct = Math.min(1, next.current / next.target);

  return (
    <View style={[styles.card, { borderColor: accent + '55' }]}>
      <LinearGradient
        colors={[accent2 + '22', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.head}>
        <View style={[styles.iconWrap, { backgroundColor: accent2 + '33' }]}>
          <Ionicons name={next.icon} size={18} color={accent2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>Next Badge</Text>
          <Text style={styles.name}>{next.name}</Text>
        </View>
        <Text style={styles.count}>
          <Text style={{ color: accent2 }}>{next.current}</Text>
          <Text style={styles.muted}>/{next.target}</Text>
        </Text>
      </View>
      <Text style={styles.desc}>{next.description}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { backgroundColor: accent2, width: `${pct * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 14,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    gap: 8,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: spiritText.secondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  name: { color: '#ffffff', fontSize: 15, fontWeight: '900', marginTop: 1 },
  desc: { color: spiritText.secondary, fontSize: 12, fontWeight: '700' },
  count: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  muted: { color: spiritText.secondary, fontWeight: '800' },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 3 },
});
