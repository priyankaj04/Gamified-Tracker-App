import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { palette } from '@/lib/themes';

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  onTap?: () => void;
}

const ACTION_WIDTH = 80;

export function SwipeRow({ children, onDelete, onTap }: Props) {
  const tx = useSharedValue(0);
  const start = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onStart(() => {
      start.value = tx.value;
    })
    .onUpdate((e) => {
      const next = start.value + e.translationX;
      tx.value = Math.min(0, Math.max(-ACTION_WIDTH * 1.3, next));
    })
    .onEnd((e) => {
      if (tx.value < -ACTION_WIDTH * 0.55 || e.velocityX < -700) {
        tx.value = withSpring(-ACTION_WIDTH, { damping: 18, stiffness: 220 });
      } else {
        tx.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }],
  }));

  const close = () => {
    tx.value = withTiming(0);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.actions}>
        <Pressable
          onPress={() => {
            close();
            onDelete();
          }}
          style={styles.deleteBtn}>
          <Ionicons name="trash" size={18} color="#0b0b14" />
          <Text style={styles.deleteLabel}>Delete</Text>
        </Pressable>
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[aStyle, styles.content]}>
          <Pressable
            onPress={() => {
              if (Math.abs(tx.value) > 4) {
                runOnJS(close)();
              } else {
                onTap?.();
              }
            }}>
            {children}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  content: {
    backgroundColor: palette.bgElevated,
    borderRadius: 12,
  },
  actions: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    backgroundColor: palette.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteBtn: { alignItems: 'center', gap: 2 },
  deleteLabel: { color: '#0b0b14', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});
