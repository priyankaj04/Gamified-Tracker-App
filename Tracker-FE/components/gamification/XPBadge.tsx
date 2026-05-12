import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  amount: number;
  /** Tint color — defaults to violet for global, can pass module accent. */
  color?: string;
  size?: 'sm' | 'md';
}

export function XPBadge({ amount, color = '#a78bfa', size = 'sm' }: Props) {
  if (!amount) return null;
  const small = size === 'sm';
  return (
    <View style={[styles.wrap, { borderColor: color + '88', backgroundColor: color + '22' }, small && styles.sm]}>
      <Text style={[styles.bolt, small && styles.boltSm]}>⚡</Text>
      <Text style={[styles.text, { color }, small && styles.textSm]}>+{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  sm: { paddingHorizontal: 6, paddingVertical: 2 },
  bolt: { fontSize: 12 },
  boltSm: { fontSize: 10 },
  text: { fontWeight: '900', fontSize: 12, letterSpacing: 0.3 },
  textSm: { fontSize: 11 },
});
