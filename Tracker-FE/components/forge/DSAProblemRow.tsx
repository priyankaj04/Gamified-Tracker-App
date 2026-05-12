import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';
import type { DsaDifficulty, DsaProblem } from '@/types';

const diffColor: Record<DsaDifficulty, string> = {
  Easy: '#4ade80',
  Medium: '#fbbf24',
  Hard: '#ef4444',
};

interface Props {
  problem: DsaProblem;
  onPress?: () => void;
}

export function DSAProblemRow({ problem: p, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={[styles.diff, { borderColor: diffColor[p.difficulty] }]}>
        <Text style={[styles.diffText, { color: diffColor[p.difficulty] }]}>{p.difficulty[0]}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {p.title}
        </Text>
        <View style={styles.meta}>
          <Text style={styles.topic}>{p.topic}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.platform}>{p.platform}</Text>
          {p.timeTakenMin && (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.time}>{p.timeTakenMin}m</Text>
            </>
          )}
        </View>
      </View>
      <View style={styles.right}>
        <Text style={[styles.status, p.status === 'Solved' && { color: '#4ade80' }]}>{p.status}</Text>
        <Text style={styles.date}>{new Date(p.date).toLocaleDateString()}</Text>
      </View>
      {p.problemUrl && <Ionicons name="open-outline" size={14} color={palette.textDim} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    marginBottom: 8,
  },
  diff: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffText: { fontSize: 13, fontWeight: '900' },
  title: { color: palette.text, fontSize: 14, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  topic: { color: '#22d3ee', fontSize: 11, fontWeight: '700' },
  platform: { color: palette.textMuted, fontSize: 11, fontWeight: '600' },
  time: { color: palette.textDim, fontSize: 11, fontWeight: '600' },
  dot: { color: palette.textDim, fontSize: 11 },
  right: { alignItems: 'flex-end', gap: 2 },
  status: { color: palette.textMuted, fontSize: 11, fontWeight: '800' },
  date: { color: palette.textDim, fontSize: 10, fontWeight: '600' },
});
