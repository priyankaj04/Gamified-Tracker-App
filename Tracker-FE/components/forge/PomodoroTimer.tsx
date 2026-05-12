import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  totalSeconds: number;
  remainingSeconds: number;
  state: 'work' | 'break' | 'long-break' | 'idle';
  completedPomodoros: number;
}

const stateColor = {
  work: '#22d3ee',
  break: '#4ade80',
  'long-break': '#a78bfa',
  idle: '#475569',
} as const;

export function PomodoroTimer({ totalSeconds, remainingSeconds, state, completedPomodoros }: Props) {
  const size = 240;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = useSharedValue(remainingSeconds / Math.max(1, totalSeconds));

  useEffect(() => {
    ratio.value = withTiming(remainingSeconds / Math.max(1, totalSeconds), { duration: 800 });
  }, [remainingSeconds, totalSeconds, ratio]);

  const animProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - ratio.value),
  }));

  const mm = Math.floor(remainingSeconds / 60);
  const ss = remainingSeconds % 60;
  const color = stateColor[state];

  const tomatoesInSet = 4;
  const filled = completedPomodoros % tomatoesInSet;

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1f1f2c"
          strokeWidth={stroke}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
          animatedProps={animProps}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.label, { color }]}>{state === 'idle' ? 'READY' : state.toUpperCase()}</Text>
        <Text style={styles.time}>
          {mm.toString().padStart(2, '0')}:{ss.toString().padStart(2, '0')}
        </Text>
        <View style={styles.tomatoes}>
          {Array.from({ length: tomatoesInSet }).map((_, i) => (
            <Text key={i} style={styles.tomato}>
              {i < filled ? '🍅' : '⚪'}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center', gap: 6 },
  label: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  time: { color: '#f5f5fa', fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  tomatoes: { flexDirection: 'row', gap: 4 },
  tomato: { fontSize: 16 },
});
