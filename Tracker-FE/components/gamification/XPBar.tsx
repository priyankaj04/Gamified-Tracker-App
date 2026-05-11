import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '@/lib/themes';
import { getXPProgress } from '@/lib/levels';

interface Props {
  xp: number;
  showLabel?: boolean;
}

export function XPBar({ xp, showLabel = true }: Props) {
  const { pct, current, next, xpInLevel, xpForLevel } = getXPProgress(xp);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(1, pct)), {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [pct, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
    backgroundColor: current.color,
  }));

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.row}>
          <Text style={[styles.title, { color: current.color }]}>
            Lv.{current.level} {current.title}
          </Text>
          <Text style={styles.xpText}>
            {next ? `${xpInLevel} / ${xpForLevel} XP` : 'MAX'}
          </Text>
        </View>
      )}
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: { fontSize: 14, fontWeight: '700' },
  xpText: { fontSize: 12, color: palette.textMuted, fontWeight: '600' },
  track: {
    height: 10,
    backgroundColor: palette.card,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  fill: { height: '100%', borderRadius: 8 },
});
