import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '@/lib/themes';
import {
  cancelScheduledNotification,
  scheduleRestTimerNotification,
} from '@/lib/notifications';

interface Props {
  // when restSeconds changes (truthy), start the timer with that duration
  restSeconds: number | null;
  defaultSeconds: number;
  accent?: string;
  onDone?: () => void;
  onCancel?: () => void;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

export function RestTimer({ restSeconds, defaultSeconds, accent = '#f97316', onDone, onCancel }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [target, setTarget] = useState<number>(defaultSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notificationIdRef = useRef<string | null>(null);
  const progress = useSharedValue(1);

  // start when restSeconds value changes (non-null)
  useEffect(() => {
    if (restSeconds == null) return;
    const t = restSeconds || defaultSeconds;
    setTarget(t);
    setRemaining(t);
    progress.value = 1;
    progress.value = withTiming(0, { duration: t * 1000, easing: Easing.linear });
    scheduleRestTimerNotification(t).then((id) => {
      notificationIdRef.current = id;
    });
  }, [restSeconds, defaultSeconds, progress]);

  useEffect(() => {
    if (remaining == null) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r == null) return null;
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Foreground fired — cancel scheduled background notif to avoid duplicate.
          cancelScheduledNotification(notificationIdRef.current);
          notificationIdRef.current = null;
          onDone?.();
          return null;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [remaining != null, onDone]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  if (remaining == null) return null;

  const tweak = (delta: number) => {
    setRemaining((r) => Math.max(1, (r ?? 0) + delta));
    progress.value = withTiming(Math.max(0, ((remaining ?? 0) + delta) / target), { duration: 200 });
  };

  return (
    <View style={[styles.wrap, { borderColor: accent }]}>
      <View style={styles.row}>
        <View style={[styles.iconBubble, { backgroundColor: accent + '22' }]}>
          <Ionicons name="timer" size={18} color={accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Rest</Text>
          <Text style={[styles.time, { color: accent }]}>{fmt(remaining)}</Text>
        </View>
        <Pressable onPress={() => tweak(-15)} style={styles.tweak} hitSlop={6}>
          <Text style={[styles.tweakText, { color: accent }]}>−15s</Text>
        </Pressable>
        <Pressable onPress={() => tweak(15)} style={styles.tweak} hitSlop={6}>
          <Text style={[styles.tweakText, { color: accent }]}>+15s</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            cancelScheduledNotification(notificationIdRef.current);
            notificationIdRef.current = null;
            setRemaining(null);
            onCancel?.();
          }}
          style={{ paddingLeft: 6 }}
          hitSlop={8}>
          <Ionicons name="close" size={20} color={palette.textMuted} />
        </Pressable>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { backgroundColor: accent }, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 24,
    backgroundColor: palette.bgElevated,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBubble: {
    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  label: { color: palette.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  time: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  tweak: { paddingHorizontal: 8, paddingVertical: 4 },
  tweakText: { fontSize: 12, fontWeight: '800' },
  track: { height: 4, marginTop: 8, backgroundColor: palette.cardAlt, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});
