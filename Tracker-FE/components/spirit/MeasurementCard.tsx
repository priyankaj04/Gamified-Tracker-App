import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette , spiritText } from '@/lib/themes';

interface Props {
  label: string;
  value: number | null;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  accent?: string;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function MeasurementCard({
  label,
  value,
  unit = 'cm',
  trend,
  accent = '#4ade80',
  onPress,
  icon,
}: Props) {
  const trendColor =
    trend === 'down' ? palette.success : trend === 'up' ? palette.warning : spiritText.secondary;
  const trendIcon = trend === 'down' ? 'trending-down' : trend === 'up' ? 'trending-up' : 'remove';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.head}>
        <Text style={styles.label}>{label}</Text>
        {icon && <Ionicons name={icon} size={14} color={accent} />}
      </View>
      <Text style={[styles.value, { color: value != null ? palette.text : spiritText.tertiary }]}>
        {value != null ? value : '—'}
        {value != null && <Text style={styles.unit}>{` ${unit}`}</Text>}
      </Text>
      {trend && value != null && (
        <View style={styles.trend}>
          <Ionicons name={trendIcon} size={11} color={trendColor} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 4,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: {
    fontSize: 10,
    color: spiritText.secondary,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  value: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  unit: { fontSize: 11, color: spiritText.secondary, fontWeight: '700' },
  trend: { position: 'absolute', top: 8, right: 8 },
});
