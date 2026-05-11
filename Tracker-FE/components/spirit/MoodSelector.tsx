import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { palette } from '@/lib/themes';

const EMOJIS = ['😤', '😕', '😐', '🙂', '😄'];

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  accent?: string;
}

export function MoodSelector({ value, onChange, accent = '#4ade80' }: Props) {
  return (
    <View style={styles.row}>
      {EMOJIS.map((e, i) => {
        const v = i + 1;
        const selected = value === v;
        return (
          <Pressable
            key={v}
            onPress={() => onChange(v)}
            style={({ pressed }) => [
              styles.btn,
              selected && { borderColor: accent, transform: [{ scale: 1.1 }] },
              pressed && { opacity: 0.7 },
            ]}>
            <Text style={styles.emoji}>{e}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  btn: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 26 },
});
