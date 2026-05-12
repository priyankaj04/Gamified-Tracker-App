import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, screenTheme, spiritText } from '@/lib/themes';
import { useSpiritStreaks } from '@/hooks/useSpiritQuests';

const STREAK_DEFS: { key: keyof NonNullable<ReturnType<typeof useSpiritStreaks>['data']>; label: string; icon: any }[] = [
  { key: 'weight', label: 'Weight', icon: 'scale' },
  { key: 'nutrition', label: 'Meals', icon: 'restaurant' },
  { key: 'habits', label: 'Habits', icon: 'checkmark-done' },
  { key: 'sleep', label: 'Sleep', icon: 'moon' },
  { key: 'fasting', label: 'Fast', icon: 'timer' },
];

export function StreaksRow() {
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;
  const { data } = useSpiritStreaks();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {STREAK_DEFS.map((def) => {
        const s = data?.[def.key];
        const count = s?.current ?? 0;
        const hot = count >= 7;
        return (
          <View
            key={def.key}
            style={[
              styles.chip,
              { borderColor: hot ? accent2 + 'aa' : accent + '55' },
              count === 0 && { opacity: 0.55 },
            ]}>
            <Ionicons name={hot ? 'flame' : def.icon} size={14} color={hot ? accent2 : accent} />
            <Text style={[styles.count, { color: hot ? accent2 : '#ffffff' }]}>{count}</Text>
            <Text style={styles.label}>{def.label}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.card,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  count: { fontWeight: '900', fontSize: 13 },
  label: { color: spiritText.secondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
});
