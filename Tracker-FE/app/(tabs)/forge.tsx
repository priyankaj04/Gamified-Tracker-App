import React, { useState } from 'react';
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
import { ProjectCard } from '@/components/forge/ProjectCard';
import { ForgeActivityGrid } from '@/components/forge/ForgeActivityGrid';
import { LiveTimer } from '@/components/forge/LiveTimer';
import { BuildNowCta } from '@/components/forge/BuildNowCta';
import { useProjects } from '@/hooks/useProjects';
import { useActiveTimer, useSessionGrid, useSessions, useTodaySessions } from '@/hooks/useSessions';
import { useDailyGoal, useForgeSummary } from '@/hooks/useForgeStats';
import { useDsaStats } from '@/hooks/useDSA';
import { useLearning } from '@/hooks/useLearning';
import { useGameState } from '@/hooks/useGame';

export default function ForgeScreen() {
  const router = useRouter();
  const accent = screenTheme.forge.accent;
  const accent2 = screenTheme.forge.accent2;

  const projects = useProjects({});
  const pinned = (projects.data?.projects ?? []).filter((p) => p.isPinned);
  // "In Progress" carousel — also includes Backlog projects that already have
  // logged hours, so existing in-flight projects show up even if their status
  // was never moved off Backlog.
  const inProgress = (projects.data?.projects ?? [])
    .filter(
      (p) =>
        !p.isPinned &&
        !p.isArchived &&
        (p.status === 'In Progress' || (p.status === 'Backlog' && p.totalHours > 0)),
    )
    .slice(0, 3);

  const today = useTodaySessions();
  const goal = useDailyGoal();
  const summary = useForgeSummary();
  const dsa = useDsaStats();
  const learning = useLearning({ status: 'In Progress' });
  const grid = useSessionGrid(90);
  const timer = useActiveTimer();
  const recentSessions = useSessions({ limit: 40 });
  const game = useGameState();
  const pomodoroSessions = (recentSessions.data?.sessions ?? []).filter((s) => s.pomodoroCount > 0).slice(0, 5);

  const [addOpen, setAddOpen] = useState(false);

  const forgeStreak = game.data?.streaks?.forge?.count ?? 0;
  const dsaStreak = game.data?.streaks?.dsa?.count ?? dsa.data?.currentStreak ?? 0;
  const learningStreak = game.data?.streaks?.learning?.count ?? 0;

  const goalPct = goal.data?.pct ?? 0;
  const goalHit = goalPct >= 100;
  const todayMin = goal.data?.todayMinutes ?? today.data?.totalMinutes ?? 0;
  const goalMin = goal.data?.goalMinutes ?? 120;

  const refreshing =
    projects.isFetching || today.isFetching || goal.isFetching || summary.isFetching;

  return (
    <ThemedScene scene="forge">
      <ScrollView
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={refreshing}
            onRefresh={() => {
              projects.refetch();
              today.refetch();
              goal.refetch();
              summary.refetch();
              dsa.refetch();
              learning.refetch();
              grid.refetch();
              timer.refetch();
            }}
          />
        }>
        <PageHeader
          title="Code Forge"
          subtitle="Build Loop"
          accent={accent}
          accent2={accent2}
          right={
            <Pressable onPress={() => router.push('/forge/forge-settings' as any)} hitSlop={8}>
              <Ionicons name="settings-outline" size={22} color={accent} />
            </Pressable>
          }
        />

        {/* Big "Build Now" CTA — only when no live session is running */}
        {!timer.data?.timer && (
          <BuildNowCta
            accent={accent}
            title={todayMin === 0 ? 'Start Today' : 'Stack Another Session'}
            subtitle={
              todayMin === 0
                ? 'Open the editor. 25 min and earn XP.'
                : `${Math.floor(todayMin / 60)}h ${todayMin % 60}m so far — go again.`
            }
            onPress={() => router.push('/forge/active-session' as any)}
          />
        )}

        {/* Active session banner — same card bg as the rest, yellow highlight */}
        {timer.data?.timer && (() => {
          const liveTimer = timer.data.timer;
          const pomo = liveTimer.isPomodoro;
          const highlight = '#fbbf24';
          return (
            <Pressable
              onPress={() =>
                router.push((pomo ? '/forge/focus' : '/forge/active-session') as any)
              }
              style={[styles.banner, { borderColor: highlight, shadowColor: highlight }]}>
              <View style={[styles.bannerDot, { backgroundColor: highlight }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.bannerHead}>
                  <Text style={[styles.bannerLabel, { color: highlight }]}>
                    {pomo ? '🍅 POMODORO' : '● LIVE SESSION'}
                  </Text>
                  <LiveTimer
                    startedAt={liveTimer.startedAt}
                    style={[styles.bannerTimer, { color: highlight }]}
                  />
                </View>
                <Text style={styles.bannerSub} numberOfLines={1}>
                  {liveTimer.projectName ?? 'Untitled session'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={highlight} />
            </Pressable>
          );
        })()}

        {/* Daily goal bar */}
        <Pressable
          onPress={() => router.push('/forge/forge-settings' as any)}
          style={styles.goalCard}>
          <View style={styles.goalHead}>
            <Text style={styles.goalLabel}>Daily Coding Goal</Text>
            <Text style={[styles.goalText, { color: goalHit ? accent : palette.textMuted }]}>
              {Math.floor(todayMin / 60)}h {todayMin % 60}m / {Math.floor(goalMin / 60)}h{' '}
              {goalMin % 60}m {goalHit ? '✓' : ''}
            </Text>
          </View>
          <View style={styles.goalTrack}>
            <View
              style={[
                styles.goalFill,
                { width: `${Math.min(100, goalPct)}%`, backgroundColor: goalHit ? accent : accent2 },
              ]}
            />
          </View>
          <View style={styles.streakRow}>
            <Text style={styles.streak}>🔥 {goal.data?.goalStreak ?? 0} day goal streak</Text>
            <Text style={styles.streakLong}>Best · {goal.data?.longestGoalStreak ?? 0}</Text>
          </View>
        </Pressable>

        {/* Streaks row */}
        <View style={styles.streakChips}>
          <View style={[styles.streakChip, { borderColor: accent }]}>
            <Text style={styles.streakChipLabel}>Forge</Text>
            <Text style={[styles.streakChipValue, { color: accent }]}>🔥 {forgeStreak}</Text>
          </View>
          <View style={[styles.streakChip, { borderColor: '#a78bfa' }]}>
            <Text style={styles.streakChipLabel}>DSA</Text>
            <Text style={[styles.streakChipValue, { color: '#a78bfa' }]}>🔥 {dsaStreak}</Text>
          </View>
          <View style={[styles.streakChip, { borderColor: '#fbbf24' }]}>
            <Text style={styles.streakChipLabel}>Learning</Text>
            <Text style={[styles.streakChipValue, { color: '#fbbf24' }]}>🔥 {learningStreak}</Text>
          </View>
        </View>

        {/* Today's stats */}
        <View style={styles.stats}>
          <StatCard
            label="Sessions"
            value={today.data?.sessions.length ?? 0}
            icon="terminal"
            accent={accent}
          />
          <StatCard
            label="Hours"
            value={((todayMin / 60) || 0).toFixed(1)}
            icon="time"
            accent={accent}
          />
          <StatCard
            label="DSA Today"
            value={dsa.data?.weeklyGoalProgress.current ?? 0}
            icon="code-slash"
            accent="#a78bfa"
          />
          <StatCard label="Shipped" value={summary.data?.totalSessions ?? 0} icon="rocket" accent="#fbbf24" />
        </View>

        {/* Quick action row */}
        <View style={styles.quickRow}>
          <QuickBtn icon="play" label="Session" onPress={() => router.push('/forge/active-session' as any)} accent={accent} />
          <QuickBtn icon="add" label="Project" onPress={() => router.push('/forge/project-new' as any)} accent={accent} />
          <QuickBtn icon="code-slash" label="DSA" onPress={() => router.push('/forge/dsa-new' as any)} accent="#a78bfa" />
          <QuickBtn icon="book" label="Learn" onPress={() => router.push('/forge/learning' as any)} accent="#fbbf24" />
        </View>

        {/* Pinned */}
        {pinned.length > 0 && (
          <>
            <SectionTitle title="📌 Pinned" accent={accent} />
            <View style={{ paddingHorizontal: 20 }}>
              {pinned.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  index={i}
                  accent={accent}
                  onPress={() => router.push(`/forge/${p.id}` as any)}
                />
              ))}
            </View>
          </>
        )}

        {/* In progress */}
        <SectionTitle
          title="In Progress"
          accent={accent}
          right={
            <Pressable onPress={() => router.push('/forge/projects' as any)} hitSlop={6}>
              <Text style={[styles.seeAll, { color: accent }]}>See all</Text>
            </Pressable>
          }
        />
        <View style={{ paddingHorizontal: 20 }}>
          {inProgress.length === 0 ? (
            <EmptyState
              icon="rocket-outline"
              title="No projects yet, Coder."
              message="What are you building? Start a new project."
              accent={accent}
            />
          ) : (
            inProgress.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                index={i}
                accent={accent}
                onPress={() => router.push(`/forge/${p.id}` as any)}
              />
            ))
          )}
        </View>

        {/* Upcoming milestones */}
        <SectionTitle title="Upcoming Milestones" accent={accent} />
        <UpcomingMilestones accent={accent} />

        {/* DSA snapshot */}
        <SectionTitle title="DSA This Week" accent="#a78bfa" right={<Pressable onPress={() => router.push('/forge/dsa' as any)}><Text style={[styles.seeAll, { color: '#a78bfa' }]}>Open</Text></Pressable>} />
        <View style={styles.dsaCard}>
          <View style={styles.dsaCounts}>
            <Stat label="Solved" value={dsa.data?.totalSolved ?? 0} color="#4ade80" />
            <Stat label="Easy" value={dsa.data?.easy ?? 0} color="#4ade80" />
            <Stat label="Medium" value={dsa.data?.medium ?? 0} color="#fbbf24" />
            <Stat label="Hard" value={dsa.data?.hard ?? 0} color="#ef4444" />
          </View>
          <View style={styles.weekProgress}>
            <Text style={styles.weekLabel}>
              {dsa.data?.weeklyGoalProgress.current ?? 0}/{dsa.data?.weeklyGoalProgress.goal ?? 5} this week
            </Text>
            <View style={styles.weekTrack}>
              <View
                style={[
                  styles.weekFill,
                  {
                    width: `${Math.min(100, ((dsa.data?.weeklyGoalProgress.current ?? 0) / Math.max(1, dsa.data?.weeklyGoalProgress.goal ?? 5)) * 100)}%`,
                    backgroundColor: '#a78bfa',
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Learning — always render so the "All" link is reachable even when
            no items are In Progress (e.g. fresh adds default to Not Started). */}
        <SectionTitle
          title="Learning"
          accent="#fbbf24"
          right={
            <Pressable onPress={() => router.push('/forge/learning' as any)} hitSlop={6}>
              <Text style={[styles.seeAll, { color: '#fbbf24' }]}>Open</Text>
            </Pressable>
          }
        />
        {(learning.data?.items.length ?? 0) > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.learnScroll}>
            {(learning.data?.items ?? []).slice(0, 6).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push('/forge/learning' as any)}
                style={styles.learnCard}>
                <Text style={styles.learnType}>
                  {item.type === 'Course' ? '🎓' : item.type === 'Book' ? '📚' : '🎬'} {item.type}
                </Text>
                <Text style={styles.learnTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.learnTrack}>
                  <View style={[styles.learnFill, { width: `${item.progressPct}%`, backgroundColor: '#fbbf24' }]} />
                </View>
                <Text style={styles.learnPct}>{item.progressPct}%</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <Pressable
            onPress={() => router.push('/forge/learning' as any)}
            style={styles.learnEmpty}>
            <Ionicons name="book-outline" size={20} color="#fbbf24" />
            <View style={{ flex: 1 }}>
              <Text style={styles.learnEmptyTitle}>Nothing in progress</Text>
              <Text style={styles.learnEmptyMsg}>Tap to view your library — start anything you've added.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#fbbf24" />
          </Pressable>
        )}

        {/* Activity grid */}
        {/* Pomodoros — recent focused sessions */}
        {pomodoroSessions.length > 0 && (
          <>
            <SectionTitle
              title="🍅 Pomodoros"
              accent="#fbbf24"
              right={
                <Pressable onPress={() => router.push('/forge/focus' as any)} hitSlop={6}>
                  <Text style={[styles.seeAll, { color: '#fbbf24' }]}>Focus</Text>
                </Pressable>
              }
            />
            <View style={{ paddingHorizontal: 20 }}>
              {pomodoroSessions.map((s) => (
                <View key={s.id} style={styles.pomoCard}>
                  <View style={[styles.pomoBadge, { borderColor: '#fbbf24', backgroundColor: '#fbbf2422' }]}>
                    <Text style={styles.pomoCount}>{s.pomodoroCount}</Text>
                    <Text style={styles.pomoCountLabel}>🍅</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pomoTitle} numberOfLines={1}>
                      {s.projectName ?? 'Untitled session'}
                    </Text>
                    <Text style={styles.pomoMeta}>
                      {new Date(s.date).toLocaleDateString()} · {s.durationMinutes}m
                    </Text>
                  </View>
                  <Text style={styles.pomoXp}>+{s.xpEarned}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <SectionTitle title="Activity (90d)" accent={accent} />
        <View style={{ paddingHorizontal: 20 }}>
          <ForgeActivityGrid data={grid.data?.grid ?? []} />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setAddOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: accent, shadowColor: accent },
          pressed && { opacity: 0.85 },
        ]}>
        <Ionicons name="add" size={28} color="#0b0b14" />
      </Pressable>

      <BottomSheet visible={addOpen} onClose={() => setAddOpen(false)} title="Quick Action">
        <GlowButton title="▶ Start Session" color={accent} onPress={() => { setAddOpen(false); router.push('/forge/active-session' as any); }} style={{ marginBottom: 10 }} />
        <GlowButton title="+ Log Session" variant="ghost" color={accent} onPress={() => { setAddOpen(false); router.push('/forge/session-new' as any); }} style={{ marginBottom: 10 }} />
        <GlowButton title="+ New Project" variant="ghost" color={accent} onPress={() => { setAddOpen(false); router.push('/forge/project-new' as any); }} style={{ marginBottom: 10 }} />
        <GlowButton title="+ Log DSA" variant="ghost" color="#a78bfa" onPress={() => { setAddOpen(false); router.push('/forge/dsa-new' as any); }} style={{ marginBottom: 10 }} />
        <GlowButton title="+ Log Learning" variant="ghost" color="#fbbf24" onPress={() => { setAddOpen(false); router.push('/forge/learning-new' as any); }} style={{ marginBottom: 10 }} />
        <GlowButton title="✍ Write Standup" variant="ghost" color={accent} onPress={() => { setAddOpen(false); router.push('/forge/standup' as any); }} />
      </BottomSheet>
    </ThemedScene>
  );
}

function QuickBtn({ icon, label, onPress, accent }: { icon: any; label: string; onPress: () => void; accent: string }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickBtn, { borderColor: accent + '66' }, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={18} color={accent} />
      <Text style={[styles.quickLabel, { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statSm}>
      <Text style={[styles.statSmValue, { color }]}>{value}</Text>
      <Text style={styles.statSmLabel}>{label}</Text>
    </View>
  );
}

function UpcomingMilestones({ accent }: { accent: string }) {
  // Built into projects detail; for now show an inline empty state — the home
  // dashboard intentionally keeps this concise. Detail screens own this view.
  return (
    <View style={{ paddingHorizontal: 20 }}>
      <View style={[styles.upcomingCard, { borderColor: accent + '33' }]}>
        <Text style={styles.upcomingText}>Open a project to view milestone deadlines.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 8,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bannerDot: { width: 10, height: 10, borderRadius: 5 },
  bannerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2 },
  bannerTimer: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  bannerSub: { color: palette.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  goalCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    marginHorizontal: 20,
    padding: 14,
    gap: 8,
    marginBottom: 10,
  },
  goalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalLabel: { color: palette.textMuted, fontWeight: '700', fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' },
  goalText: { fontWeight: '900', fontSize: 13 },
  goalTrack: { height: 8, backgroundColor: palette.cardAlt, borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 4 },
  streakRow: { flexDirection: 'row', justifyContent: 'space-between' },
  streak: { color: palette.text, fontWeight: '700', fontSize: 12 },
  streakLong: { color: palette.textMuted, fontWeight: '700', fontSize: 11 },
  streakChips: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  streakChip: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  streakChipLabel: { color: palette.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  streakChipValue: { fontSize: 14, fontWeight: '900' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  quickRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 14, marginBottom: 4 },
  quickBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 12, alignItems: 'center', gap: 4, backgroundColor: palette.card },
  quickLabel: { fontWeight: '800', fontSize: 11, letterSpacing: 0.4 },
  seeAll: { fontSize: 12, fontWeight: '800' },
  dsaCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    marginHorizontal: 20,
    padding: 14,
    gap: 12,
  },
  dsaCounts: { flexDirection: 'row', justifyContent: 'space-between' },
  statSm: { alignItems: 'center', gap: 2 },
  statSmValue: { fontSize: 22, fontWeight: '900' },
  statSmLabel: { color: palette.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  weekProgress: { gap: 4 },
  weekLabel: { color: palette.text, fontSize: 12, fontWeight: '700' },
  weekTrack: { height: 6, backgroundColor: palette.cardAlt, borderRadius: 3, overflow: 'hidden' },
  weekFill: { height: '100%', borderRadius: 3 },
  learnScroll: { paddingHorizontal: 20, gap: 10 },
  learnCard: {
    width: 200,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 6,
    marginRight: 10,
  },
  learnType: { color: '#fbbf24', fontSize: 11, fontWeight: '800' },
  learnTitle: { color: palette.text, fontWeight: '700', fontSize: 13 },
  learnTrack: { height: 5, borderRadius: 3, backgroundColor: palette.cardAlt, overflow: 'hidden' },
  learnFill: { height: '100%', borderRadius: 3 },
  learnPct: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  learnEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf2455',
    backgroundColor: palette.card,
  },
  learnEmptyTitle: { color: palette.text, fontWeight: '800', fontSize: 13 },
  learnEmptyMsg: { color: palette.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  pomoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf2433',
    padding: 12,
    marginBottom: 8,
  },
  pomoBadge: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  pomoCount: { color: '#fbbf24', fontWeight: '900', fontSize: 16 },
  pomoCountLabel: { fontSize: 12, marginTop: -2 },
  pomoTitle: { color: palette.text, fontWeight: '800', fontSize: 14 },
  pomoMeta: { color: palette.textMuted, fontWeight: '600', fontSize: 11, marginTop: 2 },
  pomoXp: { color: '#fbbf24', fontWeight: '900', fontSize: 12 },
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
  upcomingCard: {
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  upcomingText: { color: palette.textMuted, fontSize: 13, fontWeight: '600' },
});
