import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { palette, priorityColor } from '@/lib/themes';
import type { Priority } from '@/types';

interface Props {
  label: string;
  color?: string;
  variant?: 'priority' | 'tag';
  style?: StyleProp<ViewStyle>;
}

export function AnimeTag({ label, color, variant = 'tag', style }: Props) {
  const isPriority = variant === 'priority';
  const c = color ?? (isPriority ? priorityColor[label as Priority] ?? '#a78bfa' : '#a78bfa');
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: c + '22', borderColor: c + '88' },
        isPriority && styles.priority,
        style,
      ]}>
      <Text style={[styles.text, { color: c }, isPriority && { fontSize: 10, fontWeight: '900' }]}>
        {isPriority ? label : `#${label}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  priority: {
    width: 24,
    height: 24,
    paddingHorizontal: 0,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
});

export const palettePreview = palette; // keep type imports neat
