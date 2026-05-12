import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { palette } from '@/lib/themes';
import type { Issue, IssueSeverity } from '@/types';

const sevColor: Record<IssueSeverity, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#fbbf24',
  Low: '#94a3b8',
};

interface Props {
  issue: Issue;
  onPress?: () => void;
  onFix?: () => void;
}

export function IssueRow({ issue: i, onPress, onFix }: Props) {
  const color = sevColor[i.severity];
  const fixed = i.status === 'Fixed';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderColor: i.severity === 'Critical' && !fixed ? color : palette.border },
        pressed && { opacity: 0.7 },
      ]}>
      <View style={[styles.sevDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, fixed && styles.strike]} numberOfLines={1}>
          {i.title}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.sev, { color }]}>{i.severity}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.status}>{i.status}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.date}>
            {fixed ? `Fixed in ${i.daysOpen}d` : `Open ${i.daysOpen}d`}
          </Text>
        </View>
      </View>
      {!fixed && onFix && (
        <Pressable onPress={onFix} hitSlop={8} style={styles.fixBtn}>
          <Text style={styles.fixText}>Fix</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  sevDot: { width: 10, height: 10, borderRadius: 5 },
  title: { color: palette.text, fontWeight: '700', fontSize: 13 },
  strike: { textDecorationLine: 'line-through', color: palette.textMuted },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  sev: { fontSize: 11, fontWeight: '800' },
  status: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  date: { color: palette.textDim, fontSize: 11, fontWeight: '600' },
  dot: { color: palette.textDim, fontSize: 11 },
  fixBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#4ade8022',
    borderWidth: 1,
    borderColor: '#4ade80',
  },
  fixText: { color: '#4ade80', fontWeight: '900', fontSize: 11 },
});
