import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { palette } from '@/lib/themes';
import type { MoodTag } from '@/types';

const TAGS: { value: MoodTag; label: string; color: string; emoji: string }[] = [
  { value: 'CrushedIt', label: 'Crushed It', color: '#4ade80', emoji: '💪' },
  { value: 'Solid',     label: 'Solid',      color: '#22d3ee', emoji: '✨' },
  { value: 'Average',   label: 'Average',    color: '#a78bfa', emoji: '⚡' },
  { value: 'Rough',     label: 'Rough',      color: '#f97316', emoji: '😮‍💨' },
  { value: 'Struggled', label: 'Struggled',  color: '#ef4444', emoji: '🥵' },
];

interface Props {
  value: MoodTag | null;
  onChange: (v: MoodTag | null) => void;
}

export function MoodTagSelector({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {TAGS.map((t) => {
        const active = value === t.value;
        return (
          <Pressable
            key={t.value}
            onPress={() => onChange(active ? null : t.value)}
            style={[
              styles.pill,
              active && { backgroundColor: t.color + '22', borderColor: t.color },
            ]}>
            <Text style={styles.emoji}>{t.emoji}</Text>
            <Text style={[styles.label, active && { color: t.color }]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  emoji: { fontSize: 13 },
  label: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
});
