import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '@/lib/themes';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  color?: string;
  bgColor?: string;
  label?: string;
  centerValue?: string;
}

export function ProgressRing({
  size = 140,
  strokeWidth = 12,
  progress,
  color = '#4ade80',
  bgColor,
  label,
  centerValue,
}: Props) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = useSharedValue(c);

  useEffect(() => {
    offset.value = withTiming(c * (1 - Math.max(0, Math.min(1, progress))), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, c, offset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={bgColor ?? palette.cardAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        {centerValue && <Text style={[styles.value, { color }]}>{centerValue}</Text>}
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  label: { fontSize: 11, color: palette.textMuted, marginTop: 2, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
});
