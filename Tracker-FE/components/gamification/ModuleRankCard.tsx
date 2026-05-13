import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';

interface Rank {
  key: string;
  title: string;
  min: number;
  color: string;
}

interface Props {
  kicker: string;
  rank: Rank | undefined;
  nextRank: Rank | null | undefined;
  progressPct: number;
  toNext: number;
  unitLabel: string;
  subtitle?: string;
  accent: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function ModuleRankCard({
  kicker,
  rank,
  nextRank,
  progressPct,
  toNext,
  unitLabel,
  subtitle,
  accent,
  onPress,
  icon = 'trophy',
}: Props) {
  const color = rank?.color ?? accent;
  return (
    <Pressable onPress={onPress} style={[styles.card, { borderColor: color }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={[styles.title, { color }]} numberOfLines={1}>
          {rank?.title ?? '—'}
        </Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        {nextRank ? (
          <>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.max(0, Math.min(100, progressPct))}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.barTxt}>
              {toNext} {unitLabel} to{' '}
              <Text style={{ color: nextRank.color }}>{nextRank.title}</Text>
            </Text>
          </>
        ) : (
          <Text style={[styles.barTxt, { color }]}>Maxed out — apex rank.</Text>
        )}
      </View>
      <Ionicons name={icon} size={40} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  kicker: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: '900' },
  sub: { color: palette.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2, marginBottom: 8 },
  barBg: { height: 6, backgroundColor: palette.border, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  barFill: { height: '100%', borderRadius: 3 },
  barTxt: { color: palette.textMuted, fontSize: 11, fontWeight: '800', marginTop: 6 },
});
