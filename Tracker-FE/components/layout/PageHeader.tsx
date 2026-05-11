import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '@/lib/themes';

interface Props {
  title: string;
  subtitle?: string;
  accent: string;
  accent2?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function PageHeader({ title, subtitle, accent, accent2, right, style }: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <LinearGradient
        colors={[accent + '40', accent2 ? accent2 + '20' : 'transparent', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {subtitle && (
            <Text style={[styles.subtitle, { color: accent }]}>{subtitle}</Text>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: { fontSize: 30, fontWeight: '900', color: palette.text, letterSpacing: -0.5 },
});
