import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { palette } from '@/lib/themes';
import type { Proficiency, TechSkill } from '@/types';

const profColor: Record<Proficiency, string> = {
  Beginner: '#475569',
  Intermediate: '#0891b2',
  Advanced: '#7c3aed',
  Expert: '#fbbf24',
};

interface Props {
  skills: TechSkill[];
  onPressSkill?: (skill: TechSkill) => void;
}

export function SkillMapGrid({ skills, onPressSkill }: Props) {
  if (skills.length === 0) {
    return <Text style={styles.empty}>No skills yet — start logging sessions or learning items.</Text>;
  }
  return (
    <View style={styles.wrap}>
      {skills.map((s) => (
        <Pressable
          key={s.id}
          onPress={() => onPressSkill?.(s)}
          style={({ pressed }) => [
            styles.pill,
            { borderColor: profColor[s.proficiency] + 'AA', backgroundColor: profColor[s.proficiency] + '22' },
            pressed && { opacity: 0.7 },
          ]}>
          <Text style={[styles.name, { color: profColor[s.proficiency] }]}>{s.name}</Text>
          <Text style={styles.meta}>{s.totalHours.toFixed(1)}h</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, gap: 1 },
  name: { fontSize: 12, fontWeight: '800' },
  meta: { color: palette.textMuted, fontSize: 10, fontWeight: '700' },
  empty: { color: palette.textDim, fontSize: 13, paddingVertical: 20, textAlign: 'center' },
});
