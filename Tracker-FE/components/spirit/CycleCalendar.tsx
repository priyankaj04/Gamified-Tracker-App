import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette , spiritText } from '@/lib/themes';
import type { CyclePhase } from '@/types';

interface Props {
  cycleStart: string | null;
  averageCycleLength: number;
}

const PHASE_COLOR: Record<CyclePhase, string> = {
  Menstrual: '#f43f5e',
  Follicular: '#fbbf24',
  Ovulation: '#4ade80',
  Luteal: '#a78bfa',
};

const phaseForDay = (day: number): CyclePhase => {
  if (day <= 5) return 'Menstrual';
  if (day <= 13) return 'Follicular';
  if (day <= 16) return 'Ovulation';
  return 'Luteal';
};

export function CycleCalendar({ cycleStart, averageCycleLength }: Props) {
  if (!cycleStart) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: spiritText.secondary, fontSize: 12 }}>
          Log your last period start to see your cycle
        </Text>
      </View>
    );
  }
  const start = new Date(cycleStart + 'T00:00:00Z');
  const today = new Date();
  const dayInCycle = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
  const cells = [];
  // show 7 days: 3 past, today, 3 future
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const cycleDay = dayInCycle + i;
    const phase = cycleDay > 0 ? phaseForDay(((cycleDay - 1) % averageCycleLength) + 1) : null;
    const isToday = i === 0;
    cells.push(
      <View
        key={i}
        style={[
          styles.cell,
          phase ? { backgroundColor: PHASE_COLOR[phase] + (isToday ? 'ff' : '55') } : null,
          isToday && styles.todayCell,
        ]}>
        <Text style={[styles.dow, isToday && styles.todayText]}>
          {d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
        </Text>
        <Text style={[styles.date, isToday && styles.todayText]}>{d.getDate()}</Text>
      </View>,
    );
  }
  return <View style={styles.row}>{cells}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  cell: {
    flex: 1,
    aspectRatio: 0.6,
    backgroundColor: palette.cardAlt,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  todayCell: { borderWidth: 2, borderColor: palette.text },
  dow: { color: spiritText.secondary, fontSize: 10, fontWeight: '800' },
  date: { color: palette.text, fontSize: 16, fontWeight: '900' },
  todayText: { color: '#0b0b14' },
  empty: {
    padding: 18,
    backgroundColor: palette.card,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
});
