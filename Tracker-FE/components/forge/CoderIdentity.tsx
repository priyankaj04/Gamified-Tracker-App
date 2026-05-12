import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { palette } from '@/lib/themes';
import { getXPProgress } from '@/lib/levels';

interface Props {
  totalXp: number;
  forgeStreak: number;
  dailyGoalPct: number;
  todayMinutes: number;
  accent?: string;
  greeting?: string;
}

const greetingFor = (hour: number) => {
  if (hour < 5) return 'Late-night session?';
  if (hour < 12) return 'Good morning, Coder.';
  if (hour < 17) return 'Afternoon, Coder.';
  if (hour < 21) return 'Evening focus time.';
  return 'Burning the midnight oil?';
};

export function CoderIdentity({
  totalXp,
  forgeStreak,
  dailyGoalPct,
  todayMinutes,
  accent = '#22d3ee',
  greeting,
}: Props) {
  const xp = getXPProgress(totalXp);
  const pct = Math.min(1, xp.pct);

  // ── pulse halo behind the level chip ─────────────────────────
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + pulse.value * 0.4,
    transform: [{ scale: 0.85 + pulse.value * 0.2 }],
  }));

  // ── shimmer over the XP bar ─────────────────────────────────
  const shimmer = useSharedValue(0);
  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
  }, [shimmer]);
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -120 + shimmer.value * 300 }],
  }));

  const hour = new Date().getHours();
  const motivational =
    forgeStreak >= 7
      ? `🔥 ${forgeStreak}-day streak — don't break it`
      : todayMinutes === 0
      ? "You haven't coded today. Let's go."
      : dailyGoalPct >= 100
      ? "Crushing today's goal. Stack another hour?"
      : 'Pick a project. Open the editor. Build.';

  return (
    <View style={[styles.wrap, { borderColor: accent + '55' }]}>
      <LinearGradient
        colors={[accent + '33', '#7c3aed22', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.headRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.greeting}>{greeting ?? greetingFor(hour)}</Text>
          <Text style={styles.tagline}>{motivational}</Text>
        </View>
        <View style={styles.levelWrap}>
          <Animated.View
            style={[styles.halo, { backgroundColor: xp.current.color + '55' }, haloStyle]}
          />
          <View style={[styles.levelChip, { borderColor: xp.current.color }]}>
            <Text style={styles.levelNum}>LV</Text>
            <Text style={[styles.levelValue, { color: xp.current.color }]}>{xp.current.level}</Text>
          </View>
        </View>
      </View>

      <View style={styles.levelTitleRow}>
        <Text style={[styles.levelTitle, { color: xp.current.color }]}>{xp.current.title}</Text>
        {xp.next && (
          <Text style={styles.xpToNext}>
            {Math.max(0, xp.next.xpRequired - totalXp).toLocaleString()} XP to {xp.next.title}
          </Text>
        )}
      </View>

      <View style={styles.xpTrack}>
        <View style={[styles.xpFill, { width: `${pct * 100}%`, backgroundColor: xp.current.color }]} />
        <Animated.View style={[styles.xpShimmer, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.xpShimmerInner}
          />
        </Animated.View>
      </View>

      <View style={styles.xpRow}>
        <Text style={styles.xpText}>
          {totalXp.toLocaleString()} <Text style={styles.xpUnit}>XP</Text>
        </Text>
        <Text style={styles.streakText}>
          🔥 {forgeStreak} <Text style={styles.streakSub}>day streak</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
    overflow: 'hidden',
    backgroundColor: palette.card,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tagline: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  levelWrap: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: { position: 'absolute', width: 90, height: 90, borderRadius: 45 },
  levelChip: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,18,0.85)',
  },
  levelNum: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  levelValue: { fontSize: 24, fontWeight: '900', letterSpacing: -1 },

  levelTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  levelTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  xpToNext: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' },

  xpTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  xpFill: { height: '100%', borderRadius: 5 },
  xpShimmer: { position: 'absolute', top: 0, bottom: 0, width: 80 },
  xpShimmerInner: { flex: 1, opacity: 0.85 },

  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  xpText: { color: '#ffffff', fontWeight: '900', fontSize: 15 },
  xpUnit: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '800' },
  streakText: { color: '#fb923c', fontWeight: '900', fontSize: 15 },
  streakSub: { color: 'rgba(251,146,60,0.7)', fontSize: 11, fontWeight: '700' },
});
