import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette } from '@/lib/themes';

interface Props {
  title: string;
  accent?: string;
  right?: React.ReactNode;
}

export function SectionTitle({ title, accent = '#a78bfa', right }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.bar, { backgroundColor: accent }]} />
      <Text style={styles.title}>{title}</Text>
      <View style={{ flex: 1 }} />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  bar: { width: 4, height: 16, borderRadius: 2 },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: palette.text,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
