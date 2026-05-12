import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { glass, palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlowButton } from '@/components/ui/GlowButton';
import { LiveTimer } from '@/components/forge/LiveTimer';
import { useProjects } from '@/hooks/useProjects';
import { useActiveTimer, useCreateSession, useStartTimer, useStopTimer } from '@/hooks/useSessions';

export default function ActiveSession() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const accent = screenTheme.forge.accent;
  const accent2 = screenTheme.forge.accent2;

  const timer = useActiveTimer();
  const projects = useProjects({});
  const start = useStartTimer();
  const stop = useStopTimer();
  const create = useCreateSession();

  const [projectId, setProjectId] = useState<string | null>(params.projectId ?? null);
  const [paused, setPaused] = useState(false);
  const [notes, setNotes] = useState('');

  const t = timer.data?.timer;
  const isPomodoro = !!t?.isPomodoro;
  const liveColor = isPomodoro ? '#fbbf24' : accent;

  // ── Pulsing halo behind the timer ────────────────────────────
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.35,
    transform: [{ scale: 0.92 + pulse.value * 0.16 }],
  }));

  // ── Handlers ────────────────────────────────────────────────
  const onStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await start.mutateAsync({ projectId });
  };

  const onStop = async () => {
    const startedAt = t?.startedAt;
    const wasPomodoro = !!t?.isPomodoro;
    const { elapsedSec: e, projectId: pid } = await stop.mutateAsync();
    const min = Math.max(1, Math.round(e / 60));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await create.mutateAsync({
      projectId: pid ?? projectId,
      durationMinutes: min,
      startTime: startedAt,
      endTime: new Date().toISOString(),
      notes: notes || null,
      pomodoroCount: wasPomodoro ? Math.max(1, Math.round(min / 25)) : 0,
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

  // ─────────────────────────────────────────────────────────────
  // Ready-to-Code state
  // ─────────────────────────────────────────────────────────────

  if (!t) {
    return (
      <ThemedScene scene="forge" dim={0.7}>
        <PageHeader
          title="Start Session"
          subtitle="Forge"
          accent={accent}
          accent2={accent2}
          right={
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="close" size={24} color={accent} />
            </Pressable>
          }
        />
        <View style={styles.readyWrap}>
          <View style={styles.heroIconWrap}>
            <Animated.View
              style={[
                styles.halo,
                { backgroundColor: accent + '33' },
                haloStyle,
              ]}
            />
            <View style={[styles.heroIcon, { borderColor: accent, backgroundColor: glass.black }]}>
              <Ionicons name="code-slash" size={56} color={accent} />
            </View>
          </View>
          <Text style={styles.heroTitle}>Ready to Code</Text>
          <Text style={styles.heroSubtitle}>Pick a project, then start the clock.</Text>
        </View>

        <View style={styles.pickerWrap}>
          <Text style={styles.label}>Project</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.projScroll}
            contentContainerStyle={styles.projScrollContent}>
            <Pressable
              onPress={() => setProjectId(null)}
              style={[
                styles.projChip,
                projectId === null && {
                  borderColor: accent,
                  backgroundColor: accent + '22',
                },
              ]}>
              <Text style={[styles.projText, projectId === null && { color: accent }]}>None</Text>
            </Pressable>
            {(projects.data?.projects ?? []).map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setProjectId(p.id)}
                style={[
                  styles.projChip,
                  projectId === p.id && {
                    borderColor: accent,
                    backgroundColor: accent + '22',
                  },
                ]}>
                <Text style={[styles.projText, projectId === p.id && { color: accent }]}>
                  {p.coverEmoji} {p.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.ctaWrap}>
          <GlowButton
            title="▶ Start Timer"
            color={accent}
            loading={start.isPending}
            onPress={onStart}
          />
        </View>
      </ThemedScene>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Live session state
  // ─────────────────────────────────────────────────────────────

  return (
    <ThemedScene scene="forge" dim={0.78}>
      <PageHeader
        title="Live Session"
        subtitle="Forge"
        accent={liveColor}
        accent2={accent2}
        right={
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-down" size={24} color={liveColor} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Hero timer */}
        <View style={styles.heroTimer}>
          <Animated.View
            style={[styles.halo, { backgroundColor: liveColor + '44' }, haloStyle]}
          />
          <LinearGradient
            colors={[liveColor + '55', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.haloGradient}
          />
          <View style={[styles.timerRing, { borderColor: liveColor }]}>
            <View style={styles.liveRow}>
              <View style={[styles.pulseDot, { backgroundColor: liveColor }]} />
              <Text style={[styles.liveLabel, { color: liveColor }]}>
                {paused ? 'PAUSED' : 'LIVE'}
              </Text>
              {isPomodoro && (
                <View style={[styles.pomoPill, { borderColor: '#fbbf24' }]}>
                  <Text style={styles.pomoPillText}>🍅 POMO</Text>
                </View>
              )}
            </View>
            <LiveTimer
              startedAt={t.startedAt}
              running={!paused}
              style={[styles.timer, { color: '#ffffff' }]}
            />
            <Text style={styles.projectLabel} numberOfLines={1}>
              {t.projectName ?? 'Untitled session'}
            </Text>
          </View>
        </View>

        {/* Notes card */}
        <View style={styles.notesCard}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Capture thoughts as you code…"
            placeholderTextColor={palette.textDim}
            style={styles.notes}
          />
        </View>

        {/* Secondary actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => setPaused((p) => !p)}
            style={[styles.actionBtn, { borderColor: liveColor + 'aa' }]}>
            <Ionicons name={paused ? 'play' : 'pause'} size={20} color={liveColor} />
            <Text style={[styles.actionText, { color: liveColor }]}>
              {paused ? 'Resume' : 'Pause'}
            </Text>
          </Pressable>
          <Pressable onPress={onCancel} style={[styles.actionBtn, { borderColor: '#ef4444' }]}>
            <Ionicons name="close" size={20} color="#ef4444" />
            <Text style={[styles.actionText, { color: '#ef4444' }]}>Discard</Text>
          </Pressable>
        </View>

        {/* Primary CTA */}
        <View style={styles.ctaWrap}>
          <GlowButton
            title="⏹ Stop & Save"
            color={liveColor}
            loading={stop.isPending || create.isPending}
            onPress={onStop}
          />
        </View>
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  scrollBody: { paddingBottom: 60, gap: 18 },

  // Ready state
  readyWrap: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 30, gap: 12 },
  heroIconWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  heroIcon: {
    width: 110,
    height: 110,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: '#ffffff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  heroSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },

  // Live state hero
  heroTimer: { alignItems: 'center', justifyContent: 'center', paddingTop: 20, paddingHorizontal: 20 },
  halo: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  haloGradient: {
    position: 'absolute',
    width: 320,
    height: 200,
    top: 0,
    borderRadius: 24,
    opacity: 0.4,
  },
  timerRing: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1.5,
    backgroundColor: glass.black,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 9, height: 9, borderRadius: 5 },
  liveLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 2.5 },
  pomoPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, backgroundColor: '#fbbf2422' },
  pomoPillText: { color: '#fbbf24', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  timer: {
    fontSize: 76,
    fontWeight: '900',
    letterSpacing: -2.5,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  projectLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },

  // Notes
  notesCard: {
    marginHorizontal: 20,
    backgroundColor: glass.black,
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  notes: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: glass.border,
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    height: 110,
    textAlignVertical: 'top',
  },

  // Action row
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: glass.black,
  },
  actionText: { fontWeight: '900', fontSize: 13, letterSpacing: 0.4 },
  ctaWrap: { paddingHorizontal: 20 },

  // Project picker (ready state)
  pickerWrap: { paddingHorizontal: 20, gap: 8, marginTop: 18, marginBottom: 18 },
  projScroll: { flexGrow: 0, alignSelf: 'stretch' },
  projScrollContent: { gap: 8, paddingRight: 20, alignItems: 'center' },
  projChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.black,
  },
  projText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 12 },
});
