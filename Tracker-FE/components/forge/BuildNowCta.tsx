import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  /** Heading text — defaults to a session-style prompt. */
  title?: string;
  /** Sub-line shown beneath the title. */
  subtitle?: string;
  /** Tap handler. */
  onPress?: () => void;
  /** Primary accent color. */
  accent?: string;
}

/**
 * Big, pulsing "Build Now" hero CTA — designed to make sitting down and
 * coding feel like the natural next action when the Forge tab opens.
 */
export function BuildNowCta({
  title = 'Build Now',
  subtitle = 'Spin up a session — even 25 minutes counts.',
  onPress,
  accent = '#22d3ee',
}: Props) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + pulse.value * 0.45,
    transform: [{ scale: 0.98 + pulse.value * 0.04 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && { transform: [{ scale: 0.98 }] }]}>
      <Animated.View style={[styles.glow, { backgroundColor: accent + '55' }, glowStyle]} />
      <LinearGradient
        colors={[accent, '#7c3aed']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="play" size={28} color="#0b0b14" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="rgba(11,11,20,0.9)" />
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 20, marginVertical: 8 },
  glow: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    bottom: -4,
    borderRadius: 22,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#22d3ee',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#0b0b14',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: 'rgba(11,11,20,0.78)',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
});
