import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette, screenTheme } from '@/lib/themes';
import { useAppStore } from '@/store/useAppStore';

interface Props {
  visible: boolean;
}

export function PerfectDayBanner({ visible }: Props) {
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;
  const triggerConfetti = useAppStore((s) => s.triggerConfetti);
  const shimmer = useSharedValue(0);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      firedRef.current = false;
      return;
    }
    shimmer.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    if (!firedRef.current) {
      firedRef.current = true;
      triggerConfetti();
    }
  }, [visible, shimmer, triggerConfetti]);

  const shineStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + shimmer.value * 0.55,
  }));

  if (!visible) return null;

  return (
    <View style={[styles.wrap, { borderColor: accent2 }]}>
      <LinearGradient
        colors={[accent2, accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, shineStyle]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>
      <Ionicons name="trophy" size={26} color="#0b0b14" />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Perfect Day!</Text>
        <Text style={styles.sub}>Every checklist item cleared. Chakra at full flow ⚡</Text>
      </View>
      <Ionicons name="sparkles" size={20} color="#0b0b14" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  title: {
    color: '#0b0b14',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sub: { color: 'rgba(11, 11, 20, 0.85)', fontSize: 11, fontWeight: '800', marginTop: 2 },
});
