import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/lib/themes';
import type { Recurrence } from '@/types';

interface Props {
  value: Recurrence;
  onChange: (r: Recurrence) => void;
  accent?: string;
}

const KINDS: Array<{ key: string; label: string }> = [
  { key: 'none', label: 'One-off' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function RecurrencePicker({ value, onChange, accent = '#e879f9' }: Props) {
  const current = value?.kind ?? 'none';
  return (
    <View>
      <View style={styles.row}>
        {KINDS.map((k) => {
          const active = current === k.key;
          return (
            <Pressable
              key={k.key}
              onPress={() => {
                if (k.key === 'none') onChange(null);
                else if (k.key === 'daily') onChange({ kind: 'daily' });
                else if (k.key === 'weekly') onChange({ kind: 'weekly', daysOfWeek: [1, 2, 3, 4, 5] });
                else if (k.key === 'monthly') onChange({ kind: 'monthly', dayOfMonth: new Date().getDate() });
              }}
              style={[
                styles.chip,
                active && { borderColor: accent, backgroundColor: accent + '22' },
              ]}>
              <Text style={[styles.chipTxt, active && { color: accent }]}>{k.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {value?.kind === 'weekly' && (
        <View style={styles.daysRow}>
          {DAY_LABELS.map((lbl, i) => {
            const active = value.daysOfWeek.includes(i);
            return (
              <Pressable
                key={i}
                onPress={() => {
                  const days = active
                    ? value.daysOfWeek.filter((d) => d !== i)
                    : [...value.daysOfWeek, i].sort();
                  onChange({ kind: 'weekly', daysOfWeek: days });
                }}
                style={[styles.day, active && { borderColor: accent, backgroundColor: accent + '33' }]}>
                <Text style={[styles.dayTxt, active && { color: accent }]}>{lbl}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {value?.kind === 'monthly' && (
        <Text style={styles.monthHint}>Recurs on day {value.dayOfMonth} every month.</Text>
      )}
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
  chipTxt: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
  daysRow: { flexDirection: 'row', gap: 4, marginTop: 10 },
  day: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTxt: { color: palette.textMuted, fontSize: 12, fontWeight: '800' },
  monthHint: { color: palette.textMuted, marginTop: 8, fontSize: 12 },
});
