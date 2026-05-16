import React, { useEffect } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useAppStore } from '@/store/useAppStore';
import { palette, rarityColor } from '@/lib/themes';

export function BadgeUnlockHost() {
  const queue = useAppStore((s) => s.badgeQueue);
  const head = queue[0] ?? null;
  return head ? <BadgeUnlockModal key={head.id} unlockId={head.id} /> : null;
}

function BadgeUnlockModal({ unlockId }: { unlockId: string }) {
  const queue = useAppStore((s) => s.badgeQueue);
  const dismiss = useAppStore((s) => s.dismissBadgeUnlock);
  const item = queue.find((b) => b.id === unlockId);

  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const shimmer = useSharedValue(0);

  const triggerConfetti = useAppStore((s) => s.triggerConfetti);

  useEffect(() => {
    if (!item) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    triggerConfetti();
    opacity.value = withTiming(1, { duration: 250 });
    scale.value = withSequence(
      withSpring(1.08, { damping: 14, stiffness: 180 }),
      withSpring(1, { damping: 12, stiffness: 180 }),
    );
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [opacity, scale, shimmer, triggerConfetti, item?.id]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + shimmer.value * 0.5,
  }));

  if (!item) return null;
  const color = rarityColor[item.badge.rarity];

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => dismiss(item.id)}>
      <Pressable style={styles.backdrop} onPress={() => dismiss(item.id)}>
        <Animated.View style={[styles.card, { borderColor: color, shadowColor: color }, cardStyle]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.glow, { backgroundColor: color + '22' }, glowStyle]}
          />
          <Text style={[styles.kicker, { color }]}>Badge Unlocked</Text>
          <View style={[styles.iconWrap, { backgroundColor: color + '33', borderColor: color }]}>
            <Ionicons name="shield-checkmark" size={56} color={color} />
          </View>
          <Text style={[styles.rarity, { color }]}>{item.badge.rarity}</Text>
          <Text style={styles.name}>{item.badge.name}</Text>
          <Text style={styles.desc}>{item.badge.description}</Text>
          <Text style={[styles.xp, { color }]}>+{item.badge.xpReward} XP</Text>
          <Pressable
            onPress={() => dismiss(item.id)}
            style={[styles.btn, { borderColor: color, backgroundColor: color + '22' }]}>
            <Text style={[styles.btnText, { color }]}>Continue</Text>
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
    maxWidth: 340,
    backgroundColor: palette.bgElevated,
    borderRadius: 24,
    borderWidth: 2,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
    overflow: 'hidden',
  },
  glow: { ...StyleSheet.absoluteFillObject, borderRadius: 24 },
  kicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  rarity: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  name: { color: palette.text, fontSize: 22, fontWeight: '900', marginTop: 6, textAlign: 'center' },
  desc: {
    color: palette.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  xp: { fontSize: 16, fontWeight: '900', marginTop: 16 },
  btn: {
    marginTop: 22,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  btnText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
});
