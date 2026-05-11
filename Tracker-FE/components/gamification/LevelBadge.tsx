import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getLevelFromXP } from '@/lib/levels';

export function LevelBadge({ xp }: { xp: number }) {
  const level = getLevelFromXP(xp);
  return (
    <View style={[styles.pill, { borderColor: level.color, backgroundColor: level.color + '22' }]}>
      <Text style={[styles.text, { color: level.color }]}>{level.title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
});
