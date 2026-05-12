import React from 'react';
import { View, Text, StyleSheet, Pressable, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';

// ─────────────────────────────────────────────────────────────
// Vault palette — restricted to yellow / lime / green / orange / red.
// ─────────────────────────────────────────────────────────────
export const VAULT_COLORS = {
  yellow: '#fbbf24',
  lime: '#a3e635',
  green: '#4ade80',
  orange: '#fb923c',
  warmOrange: '#f59e0b',
  red: '#ef4444',
  softRed: '#f87171',
  neutral: '#94a3b8',
} as const;

// ─────────────────────────────────────────────────────────────
// GradientCard — spirit-style: palette.card base + light accent
// gradient + accent border. Single restrained layer.
// ─────────────────────────────────────────────────────────────
interface GradientCardProps {
  accent: string;
  accent2?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  rounded?: number;
  glow?: boolean;
  /** Tint strength 0..1 — slightly brightens the accent overlay. */
  intensity?: number;
}

export function GradientCard({
  accent,
  accent2,
  children,
  style,
  rounded = 16,
  glow = false,
  intensity = 0.13,
}: GradientCardProps) {
  // Map intensity to two hex alphas: a stronger primary and a softer trailing.
  const a1 = Math.round(Math.min(1, Math.max(0, intensity)) * 255)
    .toString(16)
    .padStart(2, '0');
  const a2 = Math.round(Math.min(1, Math.max(0, intensity * 0.45)) * 255)
    .toString(16)
    .padStart(2, '0');
  return (
    <View
      style={[
        styles.gcWrap,
        {
          borderRadius: rounded,
          borderColor: accent + '55',
          shadowColor: glow ? accent : '#000',
        },
        style,
      ]}>
      <LinearGradient
        colors={[accent + a1, (accent2 ?? accent) + a2, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: rounded }]}
      />
      <View style={{ padding: 14 }}>{children}</View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// HeroMetric — big headline value (no glow shadow, cleaner).
// ─────────────────────────────────────────────────────────────
interface HeroMetricProps {
  label?: string;
  value: string;
  caption?: string;
  accent: string;
  textStyle?: StyleProp<TextStyle>;
  align?: 'left' | 'center';
}

export function HeroMetric({ label, value, caption, accent, textStyle, align = 'left' }: HeroMetricProps) {
  return (
    <View style={{ alignItems: align === 'center' ? 'center' : 'flex-start' }}>
      {label && <Text style={styles.heroLabel}>{label}</Text>}
      <Text style={[styles.heroValue, { color: accent }, textStyle]}>{value}</Text>
      {caption && <Text style={styles.heroCaption}>{caption}</Text>}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// GradientProgress — clean progress bar.
// ─────────────────────────────────────────────────────────────
interface GradientProgressProps {
  value: number;
  accent: string;
  accent2?: string;
  height?: number;
  trackColor?: string;
  /** Accepted for compat; the new design is always flat. */
  showGlow?: boolean;
}

export function GradientProgress({
  value,
  accent,
  accent2,
  height = 8,
  trackColor,
}: GradientProgressProps) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      style={{
        height,
        borderRadius: height / 2,
        overflow: 'hidden',
        backgroundColor: trackColor ?? 'rgba(255,255,255,0.10)',
      }}>
      {pct > 0 && (
        <LinearGradient
          colors={[accent, accent2 ?? accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${pct * 100}%`, height: '100%', borderRadius: height / 2 }}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// IconTile — rounded-square accent disc (spirit-style, not circular).
// ─────────────────────────────────────────────────────────────
interface IconTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  size?: number;
  iconSize?: number;
}

export function IconTile({ icon, accent, size = 38, iconSize = 18 }: IconTileProps) {
  return (
    <View
      style={[
        styles.iconTile,
        {
          width: size,
          height: size,
          borderRadius: 12,
          backgroundColor: accent + '33',
          borderColor: accent + '66',
        },
      ]}>
      <Ionicons name={icon} size={iconSize} color="#ffffff" />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// ColoredPill — small chip.
// ─────────────────────────────────────────────────────────────
interface ColoredPillProps {
  label: string;
  color: string;
  icon?: keyof typeof Ionicons.glyphMap;
  small?: boolean;
}

export function ColoredPill({ label, color, icon, small }: ColoredPillProps) {
  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: color + '22',
          borderColor: color + '66',
          paddingVertical: small ? 3 : 5,
          paddingHorizontal: small ? 8 : 10,
        },
      ]}>
      {icon && <Ionicons name={icon} size={small ? 10 : 12} color={color} />}
      <Text style={[styles.pillText, { color, fontSize: small ? 10 : 11 }]}>{label}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// EntityRow — list row (kept).
// ─────────────────────────────────────────────────────────────
interface EntityRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  rightTopText?: string;
  rightTopColor?: string;
  rightSubText?: string;
  onPress?: () => void;
  accent?: string;
  emoji?: string;
  leftStripe?: string;
}

export function EntityRow({
  icon,
  iconColor,
  title,
  subtitle,
  right,
  rightTopText,
  rightTopColor,
  rightSubText,
  onPress,
  accent,
  emoji,
  leftStripe,
}: EntityRowProps) {
  const Container: any = onPress ? Pressable : View;
  return (
    <Container onPress={onPress} style={styles.row}>
      {leftStripe && <View style={[styles.stripe, { backgroundColor: leftStripe }]} />}
      {emoji ? (
        <Text style={{ fontSize: 22, marginRight: 4 }}>{emoji}</Text>
      ) : icon ? (
        <IconTile icon={icon} accent={iconColor ?? accent ?? VAULT_COLORS.yellow} size={36} iconSize={16} />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        {rightTopText && (
          <Text style={[styles.rowRightTop, { color: rightTopColor ?? palette.text }]}>{rightTopText}</Text>
        )}
        {rightSubText && <Text style={styles.rowRightSub}>{rightSubText}</Text>}
      </View>
      {right}
    </Container>
  );
}

const styles = StyleSheet.create({
  gcWrap: {
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: palette.card,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  heroCaption: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  iconTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
  },
  pillText: { fontWeight: '800', letterSpacing: 0.3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    gap: 10,
  },
  stripe: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: 2,
  },
  rowTitle: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  rowSubtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 2, fontWeight: '600' },
  rowRightTop: { fontWeight: '900', fontSize: 14 },
  rowRightSub: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700' },
});
