import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { palette } from '@/lib/themes';

interface Props {
  label: string;
  color?: string;
  onPress?: () => void;
  onRemove?: () => void;
  small?: boolean;
}

export function TechTag({ label, color = '#22d3ee', onPress, onRemove, small }: Props) {
  const inner = (
    <View
      style={[
        styles.chip,
        small && styles.small,
        { borderColor: color + '66', backgroundColor: color + '14' },
      ]}>
      <Text style={[styles.text, small && styles.textSm, { color }]}>{label}</Text>
      {onRemove && (
        <Text onPress={onRemove} style={[styles.x, { color }]}>
          ×
        </Text>
      )}
    </View>
  );
  if (onPress)
    return (
      <Pressable onPress={onPress} hitSlop={4}>
        {inner}
      </Pressable>
    );
  return inner;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  small: { paddingHorizontal: 7, paddingVertical: 2 },
  text: { fontSize: 12, fontWeight: '700' },
  textSm: { fontSize: 10 },
  x: { fontWeight: '900', fontSize: 14, marginLeft: 2 },
});

export const techTagPalette = palette;
