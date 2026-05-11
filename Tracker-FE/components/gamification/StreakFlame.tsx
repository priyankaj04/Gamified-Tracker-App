import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { palette } from '@/lib/themes';

interface Props {
  count: number;
  label?: string;
  color?: string;
  size?: 'sm' | 'md';
}

export function StreakFlame({ count, label, color = '#f97316', size = 'md' }: Props) {
  const scale = useSharedValue(1);
  const alive = count > 0;

  useEffect(() => {
    if (alive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 600, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = withTiming(1);
    }
  }, [alive, scale]);

  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const iconSize = size === 'sm' ? 18 : 24;
  const dim = alive ? color : palette.textDim;

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.row, aStyle]}>
        <Ionicons name="flame" size={iconSize} color={dim} />
        <Text style={[styles.count, { color: dim, fontSize: size === 'sm' ? 14 : 18 }]}>
          {count}
        </Text>
      </Animated.View>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { fontWeight: '800' },
  label: { fontSize: 10, color: palette.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 },
});
