import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/lib/themes';
import type { QuestDifficulty } from '@/types';

interface Props {
  value: QuestDifficulty | null;
  onChange: (v: QuestDifficulty | null) => void;
  accent?: string;
}

const DIFFICULTIES: Array<{ key: QuestDifficulty; label: string; mult: string }> = [
  { key: 'Trivial', label: 'Trivial', mult: '0.5×' },
  { key: 'Normal',  label: 'Normal',  mult: '1×' },
  { key: 'Hard',    label: 'Hard',    mult: '1.5×' },
  { key: 'Boss',    label: 'Boss',    mult: '2.5×' },
];

export function DifficultyPicker({ value, onChange, accent = '#e879f9' }: Props) {
  return (
    <View style={styles.row}>
      {DIFFICULTIES.map((d) => {
        const active = value === d.key;
        return (
          <Pressable
            key={d.key}
            onPress={() => onChange(active ? null : d.key)}
            style={[styles.chip, active && { borderColor: accent, backgroundColor: accent + '22' }]}>
            <Text style={[styles.label, active && { color: accent }]}>{d.label}</Text>
            <Text style={styles.mult}>{d.mult}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  label: { color: palette.textMuted, fontWeight: '800', fontSize: 11 },
  mult: { color: palette.textDim, fontSize: 10, marginTop: 2, fontWeight: '700' },
});
