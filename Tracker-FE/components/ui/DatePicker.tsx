import React from 'react';
import { ScrollView, Text, Pressable, StyleSheet, View } from 'react-native';
import { palette } from '@/lib/themes';

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  accent?: string;
  days?: number; // how many past days to show
}

const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const fmtWeekday = (d: Date) =>
  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];

export const todayISO = () => toISO(new Date());

export function DatePicker({ value, onChange, accent = '#a78bfa', days = 14 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const items = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return { date: d, iso: toISO(d) };
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {items.map(({ date, iso }, idx) => {
        const active = value === iso;
        const label = idx === 0 ? 'Today' : idx === 1 ? 'Yest' : fmtWeekday(date);
        return (
          <Pressable
            key={iso}
            onPress={() => onChange(iso)}
            style={[
              styles.chip,
              active && { borderColor: accent, backgroundColor: accent + '22' },
            ]}>
            <Text style={[styles.weekday, active && { color: accent }]}>{label}</Text>
            <Text style={[styles.day, active && { color: accent }]}>{date.getDate()}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 6, paddingVertical: 2 },
  chip: {
    minWidth: 54,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  weekday: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  day: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.3,
  },
});
