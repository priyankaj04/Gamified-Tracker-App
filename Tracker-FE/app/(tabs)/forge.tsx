import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { DatePicker, todayISO } from '@/components/ui/DatePicker';
import { StarRating } from '@/components/gamification/StarRating';
import { useProjects, useCodingSessions, useLogSession } from '@/hooks/useProjects';
import { useGameState } from '@/hooks/useGame';
import type { Project, ProjectStatus } from '@/types';

const STATUSES: ProjectStatus[] = ['Backlog', 'In Progress', 'Shipped'];

export default function ForgeScreen() {
  const router = useRouter();
  const accent = screenTheme.forge.accent;
  const accent2 = screenTheme.forge.accent2;
  const projects = useProjects();
  const sessions = useCodingSessions();
  const game = useGameState();

  const [addOpen, setAddOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState<string>('30');
  const [sessionDate, setSessionDate] = useState(todayISO());
  const [sessionNotes, setSessionNotes] = useState('');
  const [sessionStars, setSessionStars] = useState<number | null>(null);
  const logSession = useLogSession();

  const grouped = useMemo(() => {
    const out: Record<ProjectStatus, Project[]> = {
      Backlog: [],
      'In Progress': [],
      Shipped: [],
    };
    (projects.data?.projects ?? []).forEach((p) => {
      out[p.status].push(p);
    });
    return out;
  }, [projects.data]);

  const totalHours = (projects.data?.projects ?? []).reduce((s, p) => s + p.totalHours, 0);
  const shipped = grouped['Shipped'].length;
  const streak = game.data?.streaks?.forge?.count ?? 0;
  const startWeek = new Date();
  startWeek.setHours(0, 0, 0, 0);
  startWeek.setDate(startWeek.getDate() - startWeek.getDay());
  const weekHours = (sessions.data?.sessions ?? [])
    .filter((s) => new Date(s.date) >= startWeek)
    .reduce((sum, s) => sum + s.durationMinutes / 60, 0);

  return (
    <ThemedScene scene="forge">
      <ScrollView
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={projects.isFetching}
            onRefresh={() => {
              projects.refetch();
              sessions.refetch();
            }}
          />
        }>
        <PageHeader
          title="Forge"
          subtitle="Build Loop"
          accent={accent}
          accent2={accent2}
          right={<Ionicons name="code-slash" size={26} color={accent} />}
        />

        <View style={styles.stats}>
          <StatCard label="Hours" value={totalHours.toFixed(1)} icon="time" accent={accent} />
          <StatCard label="Shipped" value={shipped} icon="rocket" accent="#a78bfa" />
          <StatCard label="Streak" value={streak} icon="flame" accent="#f97316" />
          <StatCard label="Week Hrs" value={weekHours.toFixed(1)} icon="calendar" accent={accent} />
        </View>

        <SectionTitle title="Kanban" accent={accent} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kanban}>
          {STATUSES.map((status) => (
            <View key={status} style={styles.column}>
              <View style={[styles.colHead, { borderColor: accent + '55' }]}>
                <Text style={[styles.colTitle, { color: accent }]}>{status}</Text>
                <Text style={styles.colCount}>{grouped[status].length}</Text>
              </View>
              <View style={{ gap: 8 }}>
                {grouped[status].map((p) => {
                  const done = (p.milestones ?? []).filter((m) => m.completed).length;
                  const totalMs = (p.milestones ?? []).length;
                  const pct = totalMs ? done / totalMs : 0;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => router.push(`/forge/${p.id}` as any)}
                      style={({ pressed }) => [styles.pCard, pressed && { opacity: 0.7 }]}>
                      <Text style={styles.pName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <View style={styles.chipsRow}>
                        {p.techStack.slice(0, 3).map((t) => (
                          <View key={t} style={[styles.chip, { borderColor: accent + '55' }]}>
                            <Text style={[styles.chipText, { color: accent }]} numberOfLines={1}>
                              {t}
                            </Text>
                          </View>
                        ))}
                      </View>
                      <View style={styles.msTrack}>
                        <View style={[styles.msFill, { width: `${pct * 100}%`, backgroundColor: accent }]} />
                      </View>
                      <View style={styles.pFoot}>
                        <Text style={styles.pHours}>{p.totalHours.toFixed(1)}h</Text>
                        <StarRating value={p.stars} readOnly size={11} />
                      </View>
                    </Pressable>
                  );
                })}
                {grouped[status].length === 0 && (
                  <Text style={styles.empty}>Empty</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>

        <SectionTitle title="Recent Sessions" accent={accent} />
        {(sessions.data?.sessions ?? []).slice(0, 8).map((s) => (
          <View key={s.id} style={styles.sessionRow}>
            <View style={[styles.sDot, { backgroundColor: accent }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sTitle} numberOfLines={1}>
                {s.projectName ?? 'Untitled Session'}
              </Text>
              <Text style={styles.sMeta}>
                {new Date(s.date).toLocaleDateString()} · {s.durationMinutes} min
              </Text>
            </View>
            <Text style={[styles.xp, { color: accent }]}>+{s.xpEarned}</Text>
          </View>
        ))}
        {(sessions.data?.sessions ?? []).length === 0 && (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="terminal"
              title="No sessions logged"
              message="Use the + button to log time spent coding."
              accent={accent}
            />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Pressable
        onPress={() => setAddOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: accent, shadowColor: accent },
          pressed && { opacity: 0.85 },
        ]}>
        <Ionicons name="add" size={28} color="#0b0b14" />
      </Pressable>

      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)} title="Add">
        <GlowButton
          title="New Project"
          color={accent}
          onPress={() => {
            setAddOpen(false);
            router.push('/forge/new-project' as any);
          }}
          style={{ marginBottom: 10 }}
        />
        <GlowButton
          title="Log Session"
          variant="ghost"
          color={accent}
          onPress={() => {
            setAddOpen(false);
            setSessionOpen(true);
          }}
        />
      </BottomSheet>

      <BottomSheet visible={sessionOpen} onClose={() => setSessionOpen(false)} title="Log Session">
        <Text style={styles.label}>Date</Text>
        <DatePicker value={sessionDate} onChange={setSessionDate} accent={accent} />
        <Text style={styles.label}>Duration (min)</Text>
        <TextInputBox value={sessionMinutes} onChangeText={setSessionMinutes} keyboardType="numeric" />
        <Text style={styles.label}>Notes</Text>
        <TextInputBox value={sessionNotes} onChangeText={setSessionNotes} multiline />
        <Text style={styles.label}>Quality</Text>
        <StarRating value={sessionStars} onChange={setSessionStars} />
        <View style={{ height: 14 }} />
        <GlowButton
          title="Save"
          color={accent}
          loading={logSession.isPending}
          onPress={async () => {
            const minutes = parseInt(sessionMinutes, 10);
            if (!minutes) return;
            await logSession.mutateAsync({
              durationMinutes: minutes,
              date: sessionDate,
              notes: sessionNotes,
              stars: sessionStars,
            });
            setSessionOpen(false);
            setSessionMinutes('30');
            setSessionDate(todayISO());
            setSessionNotes('');
            setSessionStars(null);
          }}
        />
      </BottomSheet>
    </ThemedScene>
  );
}

// Inline simple text input — saved here to avoid a separate file
import { TextInput } from 'react-native';
function TextInputBox(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={palette.textDim}
      style={styles.input}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  kanban: { paddingHorizontal: 16, gap: 10, paddingBottom: 8 },
  column: { width: 220, gap: 8 },
  colHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: palette.cardAlt,
  },
  colTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  colCount: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
  pCard: {
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 6,
  },
  pName: { color: palette.text, fontWeight: '700', fontSize: 14 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  chipText: { fontSize: 10, fontWeight: '700' },
  msTrack: { height: 4, backgroundColor: palette.cardAlt, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  msFill: { height: '100%', borderRadius: 2 },
  pFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pHours: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  empty: { color: palette.textDim, fontSize: 12, paddingHorizontal: 6 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 8,
  },
  sDot: { width: 8, height: 8, borderRadius: 4 },
  sTitle: { color: palette.text, fontWeight: '700', fontSize: 14 },
  sMeta: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
  xp: { fontWeight: '800', fontSize: 13 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  label: { color: palette.textMuted, fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6, letterSpacing: 0.6, textTransform: 'uppercase' },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
});
