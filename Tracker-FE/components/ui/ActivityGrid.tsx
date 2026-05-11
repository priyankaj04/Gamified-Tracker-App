import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '@/lib/themes';
import type { GridCell } from '@/types';

interface Props {
  data: GridCell[]; // up to 90 cells, oldest first
  accent: string;
  columns?: number;
}

const intensityAlpha = ['00', '33', '55', '88', 'cc'];

export function ActivityGrid({ data, accent, columns = 18 }: Props) {
  // pad to a consistent grid
  const padded = [...data];
  const target = columns * 5;
  while (padded.length < target) padded.unshift({ date: '', value: 0 });

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {Array.from({ length: columns * 5 }).map((_, i) => {
          const cell = padded[i] ?? { date: '', value: 0 };
          const v = Math.max(0, Math.min(4, cell.value | 0));
          const bg = v === 0 ? palette.cardAlt : accent + intensityAlpha[v];
          return <View key={i} style={[styles.cell, { backgroundColor: bg }]} />;
        })}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        {intensityAlpha.map((a, i) => (
          <View
            key={i}
            style={[styles.cell, { backgroundColor: i === 0 ? palette.cardAlt : accent + a, marginHorizontal: 2 }]}
          />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, paddingHorizontal: 20 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  cell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  legendText: { fontSize: 10, color: palette.textMuted, fontWeight: '600' },
});
