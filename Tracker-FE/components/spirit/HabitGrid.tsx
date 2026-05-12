import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, spiritText } from '@/lib/themes';
import type { HabitHistoryCell } from '@/types';

interface Props {
  cells: HabitHistoryCell[];
  color?: string;
}

export function HabitGrid({ cells, color = '#4ade80' }: Props) {
  // Use last 91 days arranged as 13 cols × 7 rows.
  const ROWS = 7;
  const grid = useMemo(() => {
    const padded = cells.slice(-91);
    const out: HabitHistoryCell[][] = [];
    for (let i = 0; i < padded.length; i += ROWS) {
      out.push(padded.slice(i, i + ROWS));
    }
    return out;
  }, [cells]);

  return (
    <View style={[styles.wrap, { borderColor: color + '33' }]}>
      <View style={styles.grid}>
        {grid.map((col, ci) => (
          <View key={ci} style={styles.col}>
            {col.map((cell, ri) => (
              <View
                key={ri}
                style={[
                  styles.cell,
                  cell.completed ? { backgroundColor: color } : { backgroundColor: palette.cardAlt },
                ]}
              />
            ))}
            {Array.from({ length: ROWS - col.length }).map((_, i) => (
              <View key={`pad-${i}`} style={[styles.cell, { opacity: 0 }]} />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={[styles.legendCell, { backgroundColor: palette.cardAlt }]} />
        <View style={[styles.legendCell, { backgroundColor: color, opacity: 0.5 }]} />
        <View style={[styles.legendCell, { backgroundColor: color }]} />
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  grid: { flexDirection: 'row', gap: 3, width: '100%' },
  col: { flex: 1, gap: 3 },
  cell: { width: '100%', aspectRatio: 1, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  legendCell: { width: 12, height: 12, borderRadius: 3, marginHorizontal: 1 },
  legendText: { fontSize: 10, color: spiritText.secondary, fontWeight: '700' },
});
