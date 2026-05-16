import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import type { DailyChallenge } from '@/types';

interface Props {
  challenge: DailyChallenge;
}

// Map each challenge key to the screen most useful for making progress.
// Falls back to the module's tab route.
const routeForKey = (key: string, module: string): string => {
  switch (key) {
    case 'log-workout':     return '/dojo/new-workout';
    case 'priority-quests': return '/(tabs)/quests';
    case 'track-tx':        return '/(tabs)/vault';
    case 'fasting-today':   return '/spirit/fasting';
    case 'deep-work':       return '/forge/session-new';
    default:
      if (module === 'dojo')   return '/(tabs)/dojo';
      if (module === 'forge')  return '/(tabs)/forge';
      if (module === 'spirit') return '/(tabs)/spirit';
      if (module === 'vault')  return '/(tabs)/vault';
      if (module === 'quests') return '/(tabs)/quests';
      return '/(tabs)';
  }
};

export function ChallengeCard({ challenge }: Props) {
  const router = useRouter();
  const accent = challenge.module in screenTheme
    ? (screenTheme as any)[challenge.module]?.accent ?? '#a78bfa'
    : '#a78bfa';
  const pct = Math.min(1, challenge.progress / Math.max(1, challenge.target));
  const onPress = () => {
    if (challenge.completed) return;
    const dest = routeForKey(challenge.challengeKey, challenge.module);
    router.push(dest as any);
  };
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        challenge.completed && { borderColor: accent },
        pressed && !challenge.completed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}>
      <View style={styles.head}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={styles.title}>{challenge.title}</Text>
        {challenge.completed ? (
          <Ionicons name="checkmark-circle" size={18} color={accent} style={{ marginLeft: 'auto' }} />
        ) : (
          <Ionicons name="chevron-forward" size={16} color={palette.textMuted} style={{ marginLeft: 'auto' }} />
        )}
      </View>
      <Text style={styles.desc}>{challenge.description}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: accent }]} />
      </View>
      <View style={styles.foot}>
        <Text style={styles.progressTxt}>
          {challenge.progress} / {challenge.target}
        </Text>
        <Text style={[styles.xp, { color: accent }]}>+{challenge.xpReward} XP</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 8,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { color: palette.text, fontWeight: '700', fontSize: 14 },
  desc: { color: palette.textMuted, fontSize: 12, lineHeight: 16 },
  track: {
    height: 6,
    backgroundColor: palette.cardAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
  foot: { flexDirection: 'row', justifyContent: 'space-between' },
  progressTxt: { fontSize: 11, color: palette.textMuted, fontWeight: '600' },
  xp: { fontSize: 12, fontWeight: '800' },
});
