import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '@/lib/themes';
import type { GridCell } from '@/types';

interface Props {
  data: GridCell[]; // up to 90 cells, oldest first
  accent: string;
  showLegend?: boolean;
}

const intensityAlpha = ['00', '33', '55', '88', 'cc'];
const ROWS = 7;

export function ActivityGrid({ data, accent, showLegend = true }: Props) {
  const grid = useMemo(() => {
    const padded = data.slice(-91);
    const out: GridCell[][] = [];
    for (let i = 0; i < padded.length; i += ROWS) {
      out.push(padded.slice(i, i + ROWS));
    }
    return out;
  }, [data]);

  return (
    <View style={[styles.wrap, { borderColor: accent + '33' }]}>
      <View style={styles.grid}>
        {grid.map((col, ci) => (
          <View key={ci} style={styles.col}>
            {col.map((cell, ri) => {
              const v = Math.max(0, Math.min(4, cell.value | 0));
              const bg = v === 0 ? palette.cardAlt : accent + intensityAlpha[v];
              return <View key={ri} style={[styles.cell, { backgroundColor: bg }]} />;
            })}
            {Array.from({ length: ROWS - col.length }).map((_, i) => (
              <View key={`pad-${i}`} style={[styles.cell, { opacity: 0 }]} />
            ))}
          </View>
        ))}
      </View>
      {showLegend && (
        <View style={styles.legend}>
          <Text style={styles.legendText}>Less</Text>
          {intensityAlpha.map((a, i) => (
            <View
              key={i}
              style={[
                styles.legendCell,
                { backgroundColor: i === 0 ? palette.cardAlt : accent + a },
              ]}
            />
          ))}
          <Text style={styles.legendText}>More</Text>
        </View>
      )}
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
  legendText: { fontSize: 10, color: palette.textMuted, fontWeight: '700' },
});
