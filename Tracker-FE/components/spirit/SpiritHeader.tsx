import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { palette } from '@/lib/themes';
import { ParticleField } from './ParticleField';

interface Props {
  title: string;
  subtitle?: string;
  accent: string;
  accent2?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  particles?: boolean;
  back?: boolean;
  particleCount?: number;
  compact?: boolean;
}

export function SpiritHeader({
  title,
  subtitle,
  accent,
  accent2,
  right,
  style,
  particles = true,
  back = false,
  particleCount = 26,
  compact = false,
}: Props) {
  const router = useRouter();
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
      {particles && <ParticleField color={accent} count={particleCount} height={compact ? 160 : 220} />}
      <View style={styles.row}>
        {back && (
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={accent} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          {subtitle && (
            <Text style={[styles.subtitle, { color: accent, textShadowColor: accent + '99' }]}>
              {subtitle}
            </Text>
          )}
          <Text style={[styles.title, compact && styles.titleCompact, { textShadowColor: 'rgba(0,0,0,0.65)' }]}>
            {title}
          </Text>
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  wrapCompact: {
    paddingTop: 56,
    paddingBottom: 18,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 4,
  },
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
    fontSize: 32,
    fontWeight: '900',
    color: palette.text,
    letterSpacing: -0.5,
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 2 },
  },
  titleCompact: { fontSize: 26 },
});
