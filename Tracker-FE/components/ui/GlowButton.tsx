import React from 'react';
import { Pressable, Text, StyleSheet, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/useAppStore';

interface Props {
  title: string;
  onPress?: () => void;
  color?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'solid' | 'ghost';
}

export function GlowButton({
  title,
  onPress,
  color = '#a78bfa',
  disabled,
  loading,
  style,
  variant = 'solid',
}: Props) {
  const hapticsEnabled = useAppStore((s) => s.hapticsEnabled);
  const handle = () => {
    if (disabled || loading) return;
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };
  const solid = variant === 'solid';
  return (
    <Pressable
      onPress={handle}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        solid
          ? { backgroundColor: color, shadowColor: color }
          : { backgroundColor: 'transparent', borderColor: color, borderWidth: 1.5, shadowColor: 'transparent' },
        (pressed || disabled) && { opacity: 0.7 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={solid ? '#0b0b14' : color} />
      ) : (
        <Text style={[styles.text, { color: solid ? '#0b0b14' : color }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  text: { fontSize: 15, fontWeight: '800', letterSpacing: 0.4 },
});
