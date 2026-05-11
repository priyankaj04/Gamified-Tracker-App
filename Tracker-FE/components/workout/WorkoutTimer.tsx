import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';

interface Props {
  running: boolean;
  startedAt: number | null;
  onToggle: () => void;
  accent?: string;
}

const fmt = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};

export function WorkoutTimer({ running, startedAt, onToggle, accent = '#f97316' }: Props) {
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const elapsed = startedAt ? now - startedAt : 0;

  return (
    <Pressable onPress={onToggle} style={[styles.pill, { borderColor: accent }]}>
      <Ionicons name={running ? 'pause' : 'play'} size={14} color={accent} />
      <Text style={[styles.time, { color: accent }]}>{fmt(elapsed)}</Text>
    </Pressable>
  );
}

export const elapsedMinutes = (startedAt: number | null): number => {
  if (!startedAt) return 0;
  return Math.max(1, Math.round((Date.now() - startedAt) / 60000));
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  time: { fontSize: 13, fontWeight: '900', letterSpacing: -0.3 },
});
