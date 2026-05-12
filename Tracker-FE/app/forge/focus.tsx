import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { PomodoroTimer } from '@/components/forge/PomodoroTimer';
import { GlowButton } from '@/components/ui/GlowButton';
import { useForgeSettings } from '@/hooks/useForgeStats';
import { useProjects } from '@/hooks/useProjects';
import { useCreateSession } from '@/hooks/useSessions';

type State = 'idle' | 'work' | 'break' | 'long-break';

export default function Focus() {
  const router = useRouter();
  const accent = screenTheme.forge.accent;
  const settings = useForgeSettings();
  const projects = useProjects({});
  const create = useCreateSession();

  const workMin = settings.data?.pomodoroWorkMin ?? 25;
  const breakMin = settings.data?.pomodoroBreakMin ?? 5;
  const longBreakMin = 15;

  const [state, setState] = useState<State>('idle');
  const [seconds, setSeconds] = useState(workMin * 60);
  const [completed, setCompleted] = useState(0);
  const [running, setRunning] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state === 'idle') setSeconds(workMin * 60);
  }, [workMin, state]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          // finished interval
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          let next: State;
          let nextSeconds: number;
          let newCompleted = completed;
          if (state === 'work') {
            newCompleted = completed + 1;
            const isLong = newCompleted % 4 === 0;
            next = isLong ? 'long-break' : 'break';
            nextSeconds = (isLong ? longBreakMin : breakMin) * 60;
          } else {
            next = 'work';
            nextSeconds = workMin * 60;
          }
          setCompleted(newCompleted);
          setState(next);
          return nextSeconds;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, state, workMin, breakMin, longBreakMin, completed]);

  const total = state === 'work' ? workMin * 60 : state === 'long-break' ? longBreakMin * 60 : breakMin * 60;

  const onStart = () => {
    if (state === 'idle') setState('work');
    setRunning(true);
  };
  const onPause = () => setRunning(false);
  const onReset = () => {
    setRunning(false);
    setState('idle');
    setSeconds(workMin * 60);
    setCompleted(0);
  };
  const onSkip = () => {
    setSeconds(1);
  };

  const onSaveAsSession = async () => {
    const minutes = completed * workMin;
    if (minutes === 0) return Alert.alert('No work completed', 'Finish a pomodoro first.');
    await create.mutateAsync({
      projectId,
      durationMinutes: minutes,
      pomodoroCount: completed,
      notes: `${completed} pomodoros`,
    });
    Alert.alert('Saved!', `${minutes} min logged as a coding session.`);
    onReset();
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, padding: 20, gap: 20 }}>
      <View style={{ alignItems: 'center', marginTop: 30 }}>
        <Text style={styles.title}>Focus Mode</Text>
        <Text style={styles.subtitle}>Pomodoro · {workMin}/{breakMin}/{longBreakMin}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Pressable onPress={() => setProjectId(null)} style={[styles.projChip, projectId === null && { borderColor: accent }]}>
          <Text style={[styles.projText, projectId === null && { color: accent }]}>None</Text>
        </Pressable>
        {(projects.data?.projects ?? []).map((p) => (
          <Pressable key={p.id} onPress={() => setProjectId(p.id)} style={[styles.projChip, projectId === p.id && { borderColor: accent }]}>
            <Text style={[styles.projText, projectId === p.id && { color: accent }]}>{p.coverEmoji} {p.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ alignItems: 'center' }}>
        <PomodoroTimer totalSeconds={total} remainingSeconds={seconds} state={state} completedPomodoros={completed} />
      </View>

      <View style={styles.controls}>
        <Pressable onPress={onReset} style={[styles.control, { borderColor: palette.textMuted }]}>
          <Ionicons name="refresh" size={20} color={palette.text} />
        </Pressable>
        {running ? (
          <Pressable onPress={onPause} style={[styles.controlMain, { backgroundColor: accent }]}>
            <Ionicons name="pause" size={26} color="#0b0b14" />
          </Pressable>
        ) : (
          <Pressable onPress={onStart} style={[styles.controlMain, { backgroundColor: accent }]}>
            <Ionicons name="play" size={26} color="#0b0b14" />
          </Pressable>
        )}
        <Pressable onPress={onSkip} style={[styles.control, { borderColor: palette.textMuted }]}>
          <Ionicons name="play-skip-forward" size={20} color={palette.text} />
        </Pressable>
      </View>

      <GlowButton title={`Save as Session (${completed * workMin}m)`} color={accent} onPress={onSaveAsSession} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: { color: palette.text, fontSize: 22, fontWeight: '900' },
  subtitle: { color: palette.textMuted, fontWeight: '700', fontSize: 12, marginTop: 4 },
  projChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
  projText: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22 },
  control: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  controlMain: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
});
