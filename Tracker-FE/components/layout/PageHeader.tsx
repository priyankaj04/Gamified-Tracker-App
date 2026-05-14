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
  // When the page has a ThemedScene background, reserve more headroom so the
  // MC silhouette sits visible behind the title.
  tall?: boolean;
}

export function PageHeader({ title, subtitle, accent, accent2, right, style, tall = true }: Props) {
  return (
    <View style={[styles.wrap, tall && styles.tall, style]}>
      
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {subtitle && (
            <Text style={[styles.subtitle, { color: accent, textShadowColor: accent + '99' }]}>
              {subtitle}
            </Text>
          )}
          <Text style={[styles.title, { textShadowColor: 'rgba(0,0,0,0.65)' }]}>{title}</Text>
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
  tall: {
    paddingTop: 70,
    paddingBottom: 22,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  subtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 4,
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: palette.text,
    letterSpacing: -0.5,
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
});
