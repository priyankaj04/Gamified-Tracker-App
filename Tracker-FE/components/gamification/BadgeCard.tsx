import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { Badge } from '@/types';
import { palette, rarityColor } from '@/lib/themes';

interface Props {
  badge: Badge;
  onPress?: () => void;
}

export function BadgeCard({ badge, onPress }: Props) {
  const color = rarityColor[badge.rarity];
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (badge.unlocked && badge.rarity === 'Legendary') {
      shimmer.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    }
  }, [badge.unlocked, badge.rarity, shimmer]);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: badge.unlocked
      ? badge.rarity === 'Legendary'
        ? `rgba(251, 191, 36, ${0.5 + shimmer.value * 0.5})`
        : color
      : palette.border,
  }));

  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Animated.View
        style={[
          styles.card,
          borderStyle,
          !badge.unlocked && styles.locked,
          { shadowColor: badge.unlocked ? color : 'transparent' },
        ]}>
        <View style={[styles.iconWrap, { backgroundColor: badge.unlocked ? color + '22' : palette.cardAlt }]}>
          <Ionicons
            name={badge.unlocked ? 'shield' : 'lock-closed'}
            size={28}
            color={badge.unlocked ? color : palette.textDim}
          />
        </View>
        <Text style={[styles.rarity, { color: badge.unlocked ? color : palette.textDim }]}>
          {badge.rarity}
        </Text>
        <Text style={[styles.name, !badge.unlocked && { color: palette.textMuted }]} numberOfLines={1}>
          {badge.name}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {badge.description}
        </Text>
        <Text style={[styles.xp, { color: badge.unlocked ? color : palette.textDim }]}>
          +{badge.xpReward} XP
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    gap: 6,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  locked: { opacity: 0.6 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  rarity: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  name: { fontSize: 15, fontWeight: '700', color: palette.text },
  desc: { fontSize: 11, color: palette.textMuted, lineHeight: 14 },
  xp: { fontSize: 12, fontWeight: '700', marginTop: 4 },
});
