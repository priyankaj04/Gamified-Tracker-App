import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Easing, Dimensions } from 'react-native';
import { create } from 'zustand';
import { priorityColor } from '@/lib/themes';
import type { Priority } from '@/types';

interface Stamp {
  text: string;
  color: string;
  id: number;
}

interface StampState {
  current: Stamp | null;
  show: (s: Omit<Stamp, 'id'>) => void;
  clear: () => void;
}

const useStampStore = create<StampState>((set) => ({
  current: null,
  show: (s) => set({ current: { ...s, id: Date.now() } }),
  clear: () => set({ current: null }),
}));

export const showQuestStamp = (priority: Priority, isBoss?: boolean, comboCount?: number) => {
  let text = 'CLEARED!';
  let color: string = priorityColor[priority] ?? '#a78bfa';
  if (isBoss) {
    text = 'BOSS DOWN!';
    color = '#ef4444';
  } else if (priority === 'S') {
    text = 'S-RANK!';
  } else if (comboCount && comboCount >= 3) {
    text = `COMBO ×${comboCount}!`;
    color = '#facc15';
  }
  useStampStore.getState().show({ text, color });
};

export function QuestStampHost() {
  const stamp = useStampStore((s) => s.current);
  const clear = useStampStore((s) => s.clear);
  const scale = useRef(new Animated.Value(2)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!stamp) return;
    scale.setValue(2);
    opacity.setValue(0);
    rotate.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
      Animated.delay(800),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => clear());
  }, [stamp, scale, opacity, rotate, clear]);

  if (!stamp) return null;

  const rotateDeg = rotate.interpolate({ inputRange: [0, 1], outputRange: ['-20deg', '-8deg'] });

  return (
    <View pointerEvents="none" style={styles.host}>
      <Animated.View
        style={[
          styles.stamp,
          { borderColor: stamp.color, opacity, transform: [{ scale }, { rotate: rotateDeg }] },
        ]}>
        <Text style={[styles.text, { color: stamp.color, textShadowColor: stamp.color + '88' }]}>
          {stamp.text}
        </Text>
      </Animated.View>
    </View>
  );
}

const { width: SCREEN_W } = Dimensions.get('window');

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  stamp: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderWidth: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(11, 11, 20, 0.55)',
    minWidth: SCREEN_W * 0.5,
    alignItems: 'center',
  },
  text: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 0 },
  },
});
