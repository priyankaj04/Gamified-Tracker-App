import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { palette } from '@/lib/themes';

interface Cell {
  date: string;
  value: number;
  totalMinutes?: number;
  count?: number;
  sessionIds?: string[];
}

interface Props {
  data: Cell[];
  /** 5-stop scale, dim → bright */
  scale?: string[];
  onPressCell?: (cell: Cell) => void;
  showLegend?: boolean;
}

const defaultScale = ['#0a0a0f', '#0e3a4a', '#0e5f7a', '#0891b2', '#22d3ee'];

export function ForgeActivityGrid({ data, scale = defaultScale, onPressCell, showLegend = true }: Props) {
  const cols = useMemo(() => {
    // group cells into columns of 7 (one week each)
    const out: Cell[][] = [];
    for (let i = 0; i < data.length; i += 7) {
      out.push(data.slice(i, i + 7));
    }
    return out;
  }, [data]);

  const todayKey = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {cols.map((col, ci) => (
            <View key={ci} style={styles.col}>
              {col.map((cell, ri) => {
                const v = Math.max(0, Math.min(4, cell.value | 0));
                const isToday = cell.date === todayKey;
                return (
                  <Pressable
                    key={ri}
                    onPress={() => onPressCell?.(cell)}
                    style={[
                      styles.cell,
                      { backgroundColor: scale[v] },
                      isToday && styles.todayCell,
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      {showLegend && (
        <View style={styles.legend}>
          <Text style={styles.legendText}>Less</Text>
          {scale.map((c, i) => (
            <View key={i} style={[styles.cell, { backgroundColor: c, marginHorizontal: 2 }]} />
          ))}
          <Text style={styles.legendText}>More</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  grid: { flexDirection: 'row', gap: 3, paddingHorizontal: 6 },
  col: { gap: 3 },
  cell: { width: 12, height: 12, borderRadius: 2 },
  todayCell: { borderWidth: 1.5, borderColor: '#fff' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end', paddingRight: 6 },
  legendText: { fontSize: 10, color: palette.textMuted, fontWeight: '600' },
});
