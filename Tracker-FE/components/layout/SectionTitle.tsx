import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '@/lib/themes';

interface Props {
  title: string;
  accent?: string;
  right?: React.ReactNode;
}

export function SectionTitle({ title, accent = '#a78bfa', right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.barWrap}>
        <LinearGradient
          colors={[accent, accent + '44']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bar}
        />
      </View>
      <Text style={[styles.title, { textShadowColor: accent + '55' }]}>{title}</Text>
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
  barWrap: { width: 4, height: 16, borderRadius: 2, overflow: 'hidden' },
  bar: { flex: 1, width: '100%' },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 1 },
  },
});
