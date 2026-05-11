import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, screenTheme } from '@/lib/themes';
import type { DailyChallenge } from '@/types';

interface Props {
  challenge: DailyChallenge;
}

export function ChallengeCard({ challenge }: Props) {
  const accent = challenge.module in screenTheme
    ? (screenTheme as any)[challenge.module]?.accent ?? '#a78bfa'
    : '#a78bfa';
  const pct = Math.min(1, challenge.progress / Math.max(1, challenge.target));
  return (
    <View style={[styles.card, challenge.completed && { borderColor: accent }]}>
      <View style={styles.head}>
        <View style={[styles.dot, { backgroundColor: accent }]} />
        <Text style={styles.title}>{challenge.title}</Text>
        {challenge.completed && (
          <Ionicons name="checkmark-circle" size={18} color={accent} style={{ marginLeft: 'auto' }} />
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
    </View>
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
