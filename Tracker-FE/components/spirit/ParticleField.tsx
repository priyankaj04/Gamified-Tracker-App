import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface Props {
  color?: string;
  count?: number;
  height?: number;
}

function Particle({ idx, color, height }: { idx: number; color: string; height: number }) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(0);

  const seed = useMemo(() => {
    const w = Dimensions.get('window').width;
    return {
      x: Math.random() * w,
      size: 2 + Math.random() * 3,
      duration: 2400 + Math.random() * 2200,
      delay: Math.floor(Math.random() * 2400),
      driftY: 12 + Math.random() * 18,
    };
  }, []);

  useEffect(() => {
    opacity.value = withDelay(
      seed.delay,
      withRepeat(
        withTiming(0.7, { duration: seed.duration, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      ),
    );
    ty.value = withDelay(
      seed.delay,
      withRepeat(
        withTiming(-seed.driftY, { duration: seed.duration, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      ),
    );
  }, [opacity, ty, seed]);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: seed.x,
          top: height * 0.4 + (idx % 5) * 12,
          width: seed.size,
          height: seed.size,
          borderRadius: seed.size,
          backgroundColor: color,
          shadowColor: color,
        },
        aStyle,
      ]}
    />
  );
}

export function ParticleField({ color = '#4ade80', count = 22, height = 220 }: Props) {
  const indices = useMemo(() => Array.from({ length: count }), [count]);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { height }]}>
      {indices.map((_, i) => (
        <Particle key={i} idx={i} color={color} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
