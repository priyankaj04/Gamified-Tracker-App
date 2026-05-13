import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';
import { useQuestCombo } from '@/hooks/useQuests';
import { useGameState } from '@/hooks/useGame';

interface Props {
  accent: string;
  todayCount: number;
  overdueCount: number;
  onRankPress?: () => void;
}

export function HeroStatsBar({ accent, todayCount, overdueCount }: Props) {
  const comboQ = useQuestCombo();
  const game = useGameState();
  const streak = game.data?.streaks?.quests?.count ?? 0;
  const combo = comboQ.data;

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { borderColor: accent + '88' }]}>
        <Ionicons name="flame" size={16} color="#f97316" />
        <View>
          <Text style={styles.label}>Streak</Text>
          <Text style={[styles.value, { color: '#f97316' }]}>{streak}</Text>
        </View>
      </View>

      <View style={[styles.card, { borderColor: '#fbbf24' + '88' }]}>
        <Ionicons name="today" size={16} color="#fbbf24" />
        <View>
          <Text style={styles.label}>Today</Text>
          <Text style={[styles.value, { color: '#fbbf24' }]}>{todayCount}</Text>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { borderColor: overdueCount ? palette.danger : palette.border },
        ]}>
        <Ionicons
          name="alert-circle"
          size={16}
          color={overdueCount ? palette.danger : palette.textMuted}
        />
        <View>
          <Text style={styles.label}>Late</Text>
          <Text
            style={[
              styles.value,
              { color: overdueCount ? palette.danger : palette.textMuted },
            ]}>
            {overdueCount}
          </Text>
        </View>
      </View>

      {combo?.comboActive && (
        <View style={[styles.card, { borderColor: '#facc15', backgroundColor: '#facc1522' }]}>
          <Ionicons name="flash" size={16} color="#facc15" />
          <View>
            <Text style={styles.label}>Combo</Text>
            <Text style={[styles.value, { color: '#facc15' }]}>×{combo.count}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 10, flexWrap: 'wrap' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: palette.card,
    minWidth: 84,
  },
  label: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  value: { color: palette.text, fontWeight: '900', fontSize: 14 },
});
