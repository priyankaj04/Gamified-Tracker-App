import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useAppStore, type LevelUpEvent } from '@/store/useAppStore';
import { palette } from '@/lib/themes';

export function LevelUpHost() {
  const queue = useAppStore((s) => s.levelUpQueue);
  const head = queue[0] ?? null;
  return head ? <LevelUpModal key={head.id} event={head} /> : null;
}

function LevelUpModal({ event }: { event: LevelUpEvent }) {
  const dismiss = useAppStore((s) => s.dismissLevelUp);

  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const rotate = useSharedValue(-12);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSequence(
      withSpring(1.15, { damping: 11, stiffness: 200 }),
      withSpring(1, { damping: 12, stiffness: 180 }),
    );
    rotate.value = withSequence(
      withTiming(8, { duration: 220 }),
      withTiming(-4, { duration: 220 }),
      withTiming(0, { duration: 200 }),
    );
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [event.id, opacity, rotate, scale, shimmer]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotateZ: `${rotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + shimmer.value * 0.5,
  }));

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => dismiss(event.id)}>
      <Pressable style={styles.backdrop} onPress={() => dismiss(event.id)}>
        <Animated.View
          style={[
            styles.card,
            { borderColor: event.newColor, shadowColor: event.newColor },
            cardStyle,
          ]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.glow, { backgroundColor: event.newColor + '22' }, glowStyle]}
          />
          <Text style={[styles.kicker, { color: event.newColor }]}>LEVEL UP</Text>
          <View style={styles.levels}>
            <Text style={styles.fromLevel}>L{event.previousLevel}</Text>
            <Ionicons name="arrow-forward" size={22} color={palette.textDim} />
            <View style={[styles.toLevelBadge, { backgroundColor: event.newColor + '33', borderColor: event.newColor }]}>
              <Text style={[styles.toLevel, { color: event.newColor }]}>L{event.newLevel}</Text>
            </View>
          </View>
          <Text style={styles.title}>{event.newTitle}</Text>
          <Text style={styles.flavour}>A new rank unlocked. Train harder.</Text>
          <Pressable
            onPress={() => dismiss(event.id)}
            style={[styles.btn, { borderColor: event.newColor, backgroundColor: event.newColor + '22' }]}>
            <Text style={[styles.btnText, { color: event.newColor }]}>Onward</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: palette.bgElevated,
    borderRadius: 24,
    borderWidth: 2,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
    overflow: 'hidden',
  },
  glow: { ...StyleSheet.absoluteFillObject, borderRadius: 24 },
  kicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 14,
  },
  levels: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  fromLevel: { color: palette.textMuted, fontSize: 20, fontWeight: '900' },
  toLevelBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  toLevel: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  title: { color: palette.text, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  flavour: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  btn: {
    marginTop: 22,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  btnText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
});
