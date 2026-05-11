import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette , spiritText } from '@/lib/themes';
import type { HabitHistoryCell } from '@/types';

interface Props {
  cells: HabitHistoryCell[];
  color?: string;
}

export function HabitGrid({ cells, color = '#4ade80' }: Props) {
  // 90 cells, 13 cols × 7 rows (most recent on right)
  const COLS = 13;
  const ROWS = 7;
  const padded = cells.slice(-COLS * ROWS);
  const grid: HabitHistoryCell[][] = [];
  for (let col = 0; col < COLS; col++) {
    const c: HabitHistoryCell[] = [];
    for (let row = 0; row < ROWS; row++) {
      const idx = col * ROWS + row;
      if (padded[idx]) c.push(padded[idx]);
    }
    grid.push(c);
  }
  return (
    <View>
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
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        <View style={[styles.cell, { backgroundColor: palette.cardAlt, marginHorizontal: 2 }]} />
        <View style={[styles.cell, { backgroundColor: color, opacity: 0.5, marginHorizontal: 2 }]} />
        <View style={[styles.cell, { backgroundColor: color, marginHorizontal: 2 }]} />
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 3 },
  col: { gap: 3 },
  cell: { width: 14, height: 14, borderRadius: 3 },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 10, justifyContent: 'flex-end' },
  legendText: { color: spiritText.secondary, fontSize: 10, fontWeight: '700', marginHorizontal: 4 },
});
