import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';

interface Rank {
  key: string;
  title: string;
  min: number;
  color: string;
}

interface Props {
  ladder: Rank[];
  score: number;
  currentKey: string | undefined;
  unitLabel: string;
}

export function RankLadder({ ladder, score, currentKey, unitLabel }: Props) {
  return (
    <View style={{ paddingHorizontal: 20, gap: 6 }}>
      {ladder.map((r) => {
        const unlocked = score >= r.min;
        const isCurrent = currentKey === r.key;
        return (
          <View
            key={r.key}
            style={[
              styles.row,
              { borderColor: unlocked ? r.color + '88' : palette.border },
              isCurrent && { backgroundColor: r.color + '11', borderColor: r.color },
            ]}>
            <Ionicons
              name={unlocked ? 'checkmark-circle' : 'lock-closed'}
              size={20}
              color={unlocked ? r.color : palette.textDim}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: unlocked ? r.color : palette.textMuted }]}>
                {r.title}
              </Text>
              <Text style={styles.sub}>
                {r.min} {unitLabel} required
              </Text>
            </View>
            {isCurrent && (
              <Text style={[styles.currentTag, { color: r.color }]}>YOU ARE HERE</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: palette.card,
  },
  title: { fontSize: 14, fontWeight: '800' },
  sub: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  currentTag: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
});
