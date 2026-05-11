import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';

interface Props {
  label: string;
  value: string | number;
  trend?: { value: string; up?: boolean };
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: string;
}

export function StatCard({ label, value, trend, icon, accent = '#a78bfa' }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.label}>{label}</Text>
        {icon && <Ionicons name={icon} size={14} color={accent} />}
      </View>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      {trend && (
        <View style={styles.trend}>
          <Ionicons
            name={trend.up ? 'trending-up' : 'trending-down'}
            size={12}
            color={trend.up ? palette.success : palette.danger}
          />
          <Text style={[styles.trendText, { color: trend.up ? palette.success : palette.danger }]}>
            {trend.value}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: palette.card,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 6,
    minWidth: 100,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    fontSize: 11,
    color: palette.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: { fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 11, fontWeight: '700' },
});
