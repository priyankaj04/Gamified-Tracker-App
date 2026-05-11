import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette , spiritText } from '@/lib/themes';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  progress: number; // 0..1
  title: string;
  size?: number;
  color?: string;
  subtitle?: string;
  onPress?: () => void;
  completed?: boolean;
}

export function GoalRing({
  progress,
  title,
  size = 124,
  color = '#4ade80',
  subtitle,
  onPress,
  completed,
}: Props) {
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = useSharedValue(c);

  useEffect(() => {
    offset.value = withTiming(c * (1 - Math.max(0, Math.min(1, progress))), {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, c, offset]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  const pct = Math.round(progress * 100);

  const ringColor = completed ? '#fbbf24' : color;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        completed && { borderColor: ringColor + '88' },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}>
      <LinearGradient
        colors={[ringColor + '10', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
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
            stroke={completed ? '#fbbf24' : color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={c}
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFillObject, styles.center]}>
          <Text style={[styles.value, { color: completed ? '#fbbf24' : color }]}>{pct}%</Text>
        </View>
      </View>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      {subtitle && (
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  title: { fontSize: 12, fontWeight: '800', color: palette.text, marginTop: 6 },
  subtitle: { fontSize: 10, color: spiritText.secondary, fontWeight: '700' },
});
