import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { palette, screenTheme } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { useProjects } from '@/hooks/useProjects';
import { useActiveTimer, useCreateSession, useStartTimer, useStopTimer } from '@/hooks/useSessions';

export default function ActiveSession() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const accent = screenTheme.forge.accent;

  const timer = useActiveTimer();
  const projects = useProjects({});
  const start = useStartTimer();
  const stop = useStopTimer();
  const create = useCreateSession();

  const [projectId, setProjectId] = useState<string | null>(params.projectId ?? null);
  const [paused, setPaused] = useState(false);
  const [notes, setNotes] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const t = timer.data?.timer;
  const elapsedSec = t
    ? Math.floor((Date.now() - new Date(t.startedAt).getTime()) / 1000) - (paused ? 0 : 0)
    : 0;
  void tick; // re-render every second
  const hh = Math.floor(elapsedSec / 3600);
  const mm = Math.floor((elapsedSec % 3600) / 60);
  const ss = elapsedSec % 60;

  const onStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await start.mutateAsync({ projectId });
  };

  const onStop = async () => {
    const { elapsedSec: e, projectId: pid } = await stop.mutateAsync();
    const min = Math.max(1, Math.round(e / 60));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await create.mutateAsync({
      projectId: pid ?? projectId,
      durationMinutes: min,
      startTime: t?.startedAt,
      endTime: new Date().toISOString(),
      notes: notes || null,
    });
    setNotes('');
    router.back();
  };

  const onCancel = () => {
    Alert.alert('Discard session?', 'You will lose the timer.', [
      { text: 'Keep' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await stop.mutateAsync();
          router.back();
        },
      },
    ]);
  };

  if (!t) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg, padding: 20 }]}>
        <Ionicons name="play-circle" size={80} color={accent} />
        <Text style={styles.title}>Ready to Code</Text>
        <Text style={styles.subtitle}>Select a project, then start the timer.</Text>
        <View style={{ height: 20 }} />
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
        <View style={{ height: 30 }} />
        <GlowButton title="▶ Start Timer" color={accent} loading={start.isPending} onPress={onStart} style={{ width: 220 }} />
      </View>
    );
  }

  return (
    <View style={[styles.full, { backgroundColor: palette.bg }]}>
      <View style={styles.timerBlock}>
        <Text style={[styles.live, { color: accent }]}>● LIVE</Text>
        <Text style={styles.timer}>
          {hh.toString().padStart(2, '0')}:{mm.toString().padStart(2, '0')}:{ss.toString().padStart(2, '0')}
        </Text>
        <Text style={styles.project}>{t.projectName ?? 'Untitled session'}</Text>
      </View>

      <View style={styles.notesWrap}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="What are you working on?"
          placeholderTextColor={palette.textDim}
          style={styles.notes}
        />
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => setPaused((p) => !p)} style={[styles.actionBtn, { borderColor: palette.textMuted }]}>
          <Ionicons name={paused ? 'play' : 'pause'} size={20} color={palette.text} />
          <Text style={styles.actionText}>{paused ? 'Resume' : 'Pause'}</Text>
        </Pressable>
        <Pressable onPress={onCancel} style={[styles.actionBtn, { borderColor: '#ef4444' }]}>
          <Ionicons name="close" size={20} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Cancel</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        <GlowButton title="⏹ Stop & Save" color={accent} loading={stop.isPending || create.isPending} onPress={onStop} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  full: { flex: 1, gap: 20, paddingTop: 50, paddingBottom: 40 },
  title: { color: palette.text, fontSize: 26, fontWeight: '900' },
  subtitle: { color: palette.textMuted, fontSize: 13 },
  timerBlock: { alignItems: 'center', gap: 10 },
  live: { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  timer: { color: palette.text, fontSize: 64, fontWeight: '900', letterSpacing: -2 },
  project: { color: palette.textMuted, fontSize: 14, fontWeight: '700' },
  notesWrap: { paddingHorizontal: 20, gap: 6 },
  label: { color: palette.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  notes: { backgroundColor: palette.card, borderWidth: 1, borderColor: palette.border, borderRadius: 10, padding: 12, color: palette.text, fontSize: 14, height: 120, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  actionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4, flexDirection: 'row', justifyContent: 'center' },
  actionText: { color: palette.text, fontWeight: '800', fontSize: 13 },
  projChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
  projText: { color: palette.textMuted, fontWeight: '700', fontSize: 12 },
});
