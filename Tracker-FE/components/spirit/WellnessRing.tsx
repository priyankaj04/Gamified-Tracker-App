import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '@/lib/themes';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  score: number; // 0..100
  size?: number;
  label?: string;
}

const colorForScore = (n: number) => {
  if (n < 40) return palette.danger;
  if (n < 60) return '#fbbf24';
  if (n < 80) return '#16a34a';
  return '#10b981';
};

const labelForScore = (n: number) => {
  if (n < 40) return 'Rough';
  if (n < 60) return 'Solid';
  if (n < 80) return 'Strong';
  return 'Optimal';
};

export function WellnessRing({ score, size = 180, label }: Props) {
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = useSharedValue(c);
  const color = colorForScore(score);

  useEffect(() => {
    offset.value = withTiming(c * (1 - Math.max(0, Math.min(1, score / 100))), {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [score, c, offset]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="1" />
            <Stop offset="100%" stopColor={color} stopOpacity="0.5" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={palette.cardAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        <Text style={[styles.value, { color: '#ffffff', textShadowColor: color + 'cc' }]}>
          {Math.round(score)}
        </Text>
        <Text style={[styles.label, { color, textShadowColor: 'rgba(0,0,0,0.65)' }]}>
          {label ?? labelForScore(score)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -1.5,
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 2 },
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
});
