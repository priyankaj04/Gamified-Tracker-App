import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, priorityColor, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { StarRating } from '@/components/gamification/StarRating';
import { TechTag } from '@/components/forge/TechTag';
import { MilestoneRow } from '@/components/forge/MilestoneRow';
import { SessionCard } from '@/components/forge/SessionCard';
import { DeploymentRow } from '@/components/forge/DeploymentRow';
import { IssueRow } from '@/components/forge/IssueRow';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { CalendarPicker } from '@/components/ui/CalendarPicker';
import { todayISO } from '@/components/ui/DatePicker';
import { useProject, useShipProject, useTogglePin, useUpdateProject } from '@/hooks/useProjects';
import {
  useCompleteMilestone,
  useCreateMilestone,
  useCreateSubtask,
  useMilestones,
  useToggleSubtask,
} from '@/hooks/useMilestones';
import { useIssues, useFixIssue, useCreateIssue } from '@/hooks/useIssues';
import { useDeployments, useCreateDeployment } from '@/hooks/useDeployments';
import { useSyncProjectGithub } from '@/hooks/useGithub';
import type { IssueSeverity, DeployEnvironment } from '@/types';

const statusColor: Record<string, string> = {
  Idea: '#94a3b8',
  Backlog: '#60a5fa',
  'In Progress': '#22d3ee',
  Review: '#fbbf24',
  Shipped: '#4ade80',
  Archived: '#64748b',
};

const daysAgo = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
};

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accent = screenTheme.forge.accent;
  const accent2 = screenTheme.forge.accent2;

  const { data: p, isLoading } = useProject(id);
  const milestones = useMilestones(id);
  const issues = useIssues({ projectId: id });
  const deps = useDeployments(id);

  const completeMs = useCompleteMilestone(id ?? '');
  const toggleSub = useToggleSubtask(id ?? '');
  const createMs = useCreateMilestone();
  const createSub = useCreateSubtask(id ?? '');
  const createIssue = useCreateIssue();
  const fixIssue = useFixIssue();
  const createDep = useCreateDeployment();
  const ship = useShipProject();
  const togglePin = useTogglePin();
  const updateProj = useUpdateProject(id ?? '');
  const sync = useSyncProjectGithub();

  const [msOpen, setMsOpen] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msTargetDate, setMsTargetDate] = useState('');
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<IssueSeverity>('Medium');
  const [issueDate, setIssueDate] = useState(todayISO());
  const [depOpen, setDepOpen] = useState(false);
  const [depVersion, setDepVersion] = useState('');
  const [depEnv, setDepEnv] = useState<DeployEnvironment>('production');
  const [depNotes, setDepNotes] = useState('');
  const [depDate, setDepDate] = useState(todayISO());
  const [shipOpen, setShipOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [subtaskFor, setSubtaskFor] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [issueTab, setIssueTab] = useState<'open' | 'fixed'>('open');

  if (isLoading || !p) {
    return (
      <View style={styles.center}>
        <Text style={{ color: palette.textMuted }}>Loading…</Text>
      </View>
    );
  }

  const msList = milestones.data?.milestones ?? p.milestones ?? [];
  const doneMs = msList.filter((m) => m.completed).length;
  const msPct = msList.length ? Math.round((doneMs / msList.length) * 100) : 0;
  const issueList = issues.data?.issues ?? [];
  const openIssues = issueList.filter((i) => i.status !== 'Fixed');
  const fixedIssues = issueList.filter((i) => i.status === 'Fixed');
  const depList = deps.data?.deployments ?? p.deployments ?? [];
  const gh = p.githubData as any;
  const cardAccent = p.coverColor || accent;
  const stat = statusColor[p.status] ?? accent;

  const targetCountdown = (() => {
    if (p.status === 'Shipped' && p.shippedDate) {
      const d = daysAgo(p.shippedDate);
      return { label: d === 0 ? 'shipped today' : `shipped ${d}d ago`, color: '#4ade80' };
    }
    if (!p.targetShipDate) return null;
    const diff = Math.floor(
      (new Date(p.targetShipDate).getTime() - Date.now()) / 86400000,
    );
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: '#ef4444' };
    if (diff === 0) return { label: 'due today', color: '#fbbf24' };
    if (diff <= 7) return { label: `${diff}d left`, color: '#fbbf24' };
    return { label: `${diff}d left`, color: accent };
  })();

  return (
    <ThemedScene scene="forge" dim={0.78}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={22} color={accent} />
          </Pressable>
          <View style={styles.subRow}>
            <Pressable onPress={() => togglePin.mutate(p.id)} hitSlop={6} style={styles.iconBtn}>
              <Ionicons name={p.isPinned ? 'pin' : 'pin-outline'} size={18} color={accent} />
            </Pressable>
          </View>
        </View>

        {/* Hero card */}
        <View style={[styles.hero, { borderColor: cardAccent + '66' }]}>
          <LinearGradient
            colors={[cardAccent + '33', cardAccent + '0a', 'transparent']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroRow}>
            <View style={[styles.coverBox, { backgroundColor: cardAccent + '22', borderColor: cardAccent + '88' }]}>
              <Text style={styles.coverEmoji}>{p.coverEmoji}</Text>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.title} numberOfLines={2}>
                {p.name}
              </Text>
              <View style={styles.metaRow}>
                <Pressable
                  onPress={() => setStatusOpen(true)}
                  style={[styles.statusPill, { backgroundColor: stat + '22', borderColor: stat + '55' }]}>
                  <Text style={[styles.statusText, { color: stat }]}>{p.status}</Text>
                  <Ionicons name="chevron-down" size={10} color={stat} />
                </Pressable>
                <View style={[styles.priority, { borderColor: priorityColor[p.priority] }]}>
                  <Text style={[styles.priorityText, { color: priorityColor[p.priority] }]}>
                    {p.priority}
                  </Text>
                </View>
                <Text style={styles.type}>{p.type}</Text>
              </View>
              <StarRating value={p.stars} readOnly size={14} />
            </View>
          </View>

          {p.description && (
            <Text style={styles.desc} numberOfLines={3}>
              {p.description}
            </Text>
          )}

          {/* Milestone progress */}
          {msList.length > 0 && (
            <View style={styles.progressBlock}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>
                  Milestone Progress · {doneMs}/{msList.length}
                </Text>
                <Text style={[styles.progressPct, { color: cardAccent }]}>{msPct}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${msPct}%`, backgroundColor: cardAccent }]} />
              </View>
            </View>
          )}

          {/* Quick stats */}
          <View style={styles.statsRow}>
            <HeroStat icon="time" value={p.totalHours.toFixed(1) + 'h'} label="Logged" color={cardAccent} />
            <View style={styles.statsDivider} />
            <HeroStat icon="flag" value={`${doneMs}/${msList.length || '—'}`} label="Milestones" color="#a78bfa" />
            <View style={styles.statsDivider} />
            <HeroStat icon="bug" value={openIssues.length} label="Open" color={openIssues.length ? '#ef4444' : palette.textMuted} />
            <View style={styles.statsDivider} />
            <HeroStat icon="rocket" value={depList.length} label="Deploys" color="#4ade80" />
          </View>

          {targetCountdown && (
            <View style={styles.countdown}>
              <Ionicons name="flag-outline" size={12} color={targetCountdown.color} />
              <Text style={[styles.countdownText, { color: targetCountdown.color }]}>
                {targetCountdown.label}
              </Text>
            </View>
          )}
        </View>

        {/* Primary actions */}
        <View style={styles.actions}>
          {p.status !== 'Shipped' && (
            <GlowButton
              title="🚀 Ship It"
              color={accent}
              onPress={() => setShipOpen(true)}
              style={{ flex: 1 }}
            />
          )}
          <GlowButton
            title="▶ Start Session"
            variant="ghost"
            color={accent}
            onPress={() => router.push(`/forge/active-session?projectId=${p.id}` as any)}
            style={{ flex: 1 }}
          />
        </View>

        {/* Links */}
        {(p.githubUrl || p.demoUrl || p.figmaUrl || p.docsUrl) && (
          <View style={styles.linksRow}>
            {p.githubUrl && (
              <LinkPill icon="logo-github" label="GitHub" url={p.githubUrl} accent={accent} />
            )}
            {p.demoUrl && <LinkPill icon="open" label="Demo" url={p.demoUrl} accent={accent} />}
            {p.figmaUrl && <LinkPill icon="brush-outline" label="Figma" url={p.figmaUrl} accent={accent} />}
            {p.docsUrl && <LinkPill icon="document-text-outline" label="Docs" url={p.docsUrl} accent={accent} />}
          </View>
        )}

        {/* Tech stack */}
        {p.techStack.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TECH STACK</Text>
            <View style={styles.techWrap}>
              {p.techStack.map((t) => (
                <TechTag key={t} label={t} color={cardAccent} />
              ))}
            </View>
          </View>
        )}

        {/* GitHub */}
        {p.githubUrl && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionLabel}>GITHUB</Text>
              <Pressable onPress={() => sync.mutate(p.id)} hitSlop={8} style={styles.sectionAction}>
                <Ionicons name="refresh" size={14} color={accent} />
                <Text style={[styles.sectionActionText, { color: accent }]}>Sync</Text>
              </Pressable>
            </View>
            {gh ? (
              <>
                <View style={styles.ghStatsRow}>
                  <GhStat icon="star" value={gh.stars ?? 0} color="#fbbf24" label="stars" />
                  <GhStat icon="git-network" value={gh.forks ?? 0} color={accent} label="forks" />
                  <GhStat icon="bug" value={gh.openIssues ?? 0} color="#ef4444" label="issues" />
                  {gh.language && (
                    <View style={[styles.langPill, { borderColor: accent + '55' }]}>
                      <Text style={[styles.langText, { color: accent }]}>{gh.language}</Text>
                    </View>
                  )}
                </View>
                {gh.pushedAt && (() => {
                  const d = Math.floor((Date.now() - new Date(gh.pushedAt).getTime()) / 86400000);
                  const c = d < 7 ? '#4ade80' : d < 30 ? '#fbbf24' : '#ef4444';
                  return (
                    <View style={[styles.pushPill, { borderColor: c, backgroundColor: c + '22' }]}>
                      <Ionicons name="git-commit" size={11} color={c} />
                      <Text style={[styles.pushText, { color: c }]}>
                        Last pushed {d === 0 ? 'today' : `${d}d ago`}
                      </Text>
                    </View>
                  );
                })()}
              </>
            ) : (
              <Text style={styles.muted}>Tap Sync to load repo stats.</Text>
            )}
          </View>
        )}

        {/* Milestones */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>
              MILESTONES · {doneMs}/{msList.length}
            </Text>
            <Pressable onPress={() => setMsOpen(true)} hitSlop={8} style={styles.sectionAction}>
              <Ionicons name="add" size={14} color={accent} />
              <Text style={[styles.sectionActionText, { color: accent }]}>Add</Text>
            </Pressable>
          </View>
          {msList.length === 0 ? (
            <Text style={styles.muted}>No milestones yet. Break the project into checkpoints.</Text>
          ) : (
            <View style={{ gap: 6 }}>
              {msList.map((m) => (
                <MilestoneRow
                  key={m.id}
                  milestone={m}
                  accent={accent}
                  onToggle={() => completeMs.mutate({ id: m.id, completed: !m.completed })}
                  onToggleSubtask={(s) => toggleSub.mutate({ milestoneId: m.id, subtaskId: s.id })}
                  onAddSubtask={() => setSubtaskFor(m.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Issues */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>BUGS · {openIssues.length} OPEN</Text>
            <Pressable onPress={() => setIssueOpen(true)} hitSlop={8} style={styles.sectionAction}>
              <Ionicons name="add" size={14} color={accent} />
              <Text style={[styles.sectionActionText, { color: accent }]}>Log</Text>
            </Pressable>
          </View>
          {issueList.length === 0 ? (
            <Text style={styles.muted}>No bugs logged. Keep it that way 😏</Text>
          ) : (
            <>
              <View style={styles.tabRow}>
                <Pressable
                  onPress={() => setIssueTab('open')}
                  style={[styles.subTab, issueTab === 'open' && { borderColor: accent, backgroundColor: accent + '22' }]}>
                  <Text style={[styles.subTabText, issueTab === 'open' && { color: accent }]}>
                    Open · {openIssues.length}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setIssueTab('fixed')}
                  style={[styles.subTab, issueTab === 'fixed' && { borderColor: accent, backgroundColor: accent + '22' }]}>
                  <Text style={[styles.subTabText, issueTab === 'fixed' && { color: accent }]}>
                    Fixed · {fixedIssues.length}
                  </Text>
                </Pressable>
              </View>
              <View>
                {(issueTab === 'open' ? openIssues : fixedIssues).map((i) => (
                  <IssueRow key={i.id} issue={i} onFix={() => fixIssue.mutate(i.id)} />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Deployments */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>DEPLOYMENTS · {depList.length}</Text>
            <Pressable onPress={() => setDepOpen(true)} hitSlop={8} style={styles.sectionAction}>
              <Ionicons name="add" size={14} color={accent} />
              <Text style={[styles.sectionActionText, { color: accent }]}>Log</Text>
            </Pressable>
          </View>
          {depList.length === 0 ? (
            <Text style={styles.muted}>No deploys logged yet.</Text>
          ) : (
            <View>
              {depList.map((d) => (
                <DeploymentRow key={d.id} deployment={d} />
              ))}
            </View>
          )}
        </View>

        {/* Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>RECENT SESSIONS</Text>
          {(p.recentSessions ?? []).length === 0 ? (
            <Text style={styles.muted}>No sessions logged on this project yet.</Text>
          ) : (
            <View>
              {(p.recentSessions ?? []).map((s) => (
                <SessionCard key={s.id} session={s as any} accent={cardAccent} />
              ))}
            </View>
          )}
        </View>

        {/* Portfolio toggle */}
        <Pressable
          onPress={() => updateProj.mutate({ isPortfolio: !p.isPortfolio })}
          style={[styles.portRow, { borderColor: p.isPortfolio ? '#fbbf24' : palette.border }]}>
          <Ionicons name={p.isPortfolio ? 'ribbon' : 'ribbon-outline'} size={18} color={p.isPortfolio ? '#fbbf24' : palette.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={styles.portLabel}>Show in Portfolio</Text>
            <Text style={styles.portSub}>Surface this project on the public-style portfolio view.</Text>
          </View>
          <View style={[styles.toggle, p.isPortfolio && { backgroundColor: '#fbbf2455' }]}>
            <View
              style={[
                styles.toggleDot,
                {
                  backgroundColor: p.isPortfolio ? '#fbbf24' : palette.textMuted,
                  alignSelf: p.isPortfolio ? 'flex-end' : 'flex-start',
                },
              ]}
            />
          </View>
        </Pressable>
      </ScrollView>

      {/* ── Milestone sheet ─────────────────────────────────────── */}
      <BottomSheet visible={msOpen} onClose={() => setMsOpen(false)} title="New Milestone">
        <Text style={styles.sheetLabel}>Title</Text>
        <TextInput
          value={msTitle}
          onChangeText={setMsTitle}
          placeholder="Ship the MVP…"
          placeholderTextColor={palette.textDim}
          style={styles.input}
        />
        <Text style={styles.sheetLabel}>Target Date</Text>
        <CalendarPicker
          value={msTargetDate}
          onChange={setMsTargetDate}
          accent={accent}
          placeholder="Pick a target date"
          minimumDate={new Date()}
        />
        <GlowButton
          title="Add Milestone"
          color={accent}
          onPress={async () => {
            if (!msTitle.trim() || !id) return;
            await createMs.mutateAsync({
              projectId: id,
              title: msTitle.trim(),
              targetDate: msTargetDate || null,
            });
            setMsTitle('');
            setMsTargetDate('');
            setMsOpen(false);
          }}
          style={{ marginTop: 14 }}
        />
      </BottomSheet>

      {/* ── Sub-task sheet ──────────────────────────────────────── */}
      <BottomSheet
        visible={!!subtaskFor}
        onClose={() => {
          setSubtaskFor(null);
          setSubtaskTitle('');
        }}
        title="New Sub-task">
        <Text style={styles.sheetLabel}>Title</Text>
        <TextInput
          value={subtaskTitle}
          onChangeText={setSubtaskTitle}
          placeholder="e.g. Wire up the form"
          placeholderTextColor={palette.textDim}
          style={styles.input}
        />
        <GlowButton
          title="Add Sub-task"
          color={accent}
          onPress={async () => {
            if (!subtaskFor || !subtaskTitle.trim()) return;
            await createSub.mutateAsync({
              milestoneId: subtaskFor,
              body: { title: subtaskTitle.trim() },
            });
            setSubtaskFor(null);
            setSubtaskTitle('');
          }}
          style={{ marginTop: 14 }}
        />
      </BottomSheet>

      {/* ── Issue sheet ─────────────────────────────────────────── */}
      <BottomSheet visible={issueOpen} onClose={() => setIssueOpen(false)} title="Log Issue">
        <Text style={styles.sheetLabel}>Title</Text>
        <TextInput
          value={issueTitle}
          onChangeText={setIssueTitle}
          placeholder="What's broken?"
          placeholderTextColor={palette.textDim}
          style={styles.input}
        />
        <Text style={styles.sheetLabel}>Description</Text>
        <TextInput
          value={issueDesc}
          onChangeText={setIssueDesc}
          placeholder="Steps to reproduce, expected vs actual…"
          placeholderTextColor={palette.textDim}
          multiline
          style={[styles.input, { height: 70 }]}
        />
        <Text style={styles.sheetLabel}>Severity</Text>
        <View style={styles.chipsRow}>
          {(['Critical', 'High', 'Medium', 'Low'] as IssueSeverity[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => setIssueSeverity(s)}
              style={[styles.sevBtn, issueSeverity === s && { borderColor: accent, backgroundColor: accent + '22' }]}>
              <Text style={[styles.sevText, issueSeverity === s && { color: accent }]}>{s}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sheetLabel}>Found Date</Text>
        <CalendarPicker value={issueDate} onChange={setIssueDate} accent={accent} maximumDate={new Date()} />
        <GlowButton
          title="Save Issue"
          color={accent}
          style={{ marginTop: 14 }}
          onPress={async () => {
            if (!issueTitle.trim() || !id) return;
            await createIssue.mutateAsync({
              projectId: id,
              title: issueTitle.trim(),
              description: issueDesc || null,
              severity: issueSeverity,
              foundDate: issueDate,
            });
            setIssueTitle('');
            setIssueDesc('');
            setIssueDate(todayISO());
            setIssueOpen(false);
          }}
        />
      </BottomSheet>

      {/* ── Deployment sheet ────────────────────────────────────── */}
      <BottomSheet visible={depOpen} onClose={() => setDepOpen(false)} title="Log Deployment">
        <Text style={styles.sheetLabel}>Version</Text>
        <TextInput
          value={depVersion}
          onChangeText={setDepVersion}
          placeholder="v1.0.0"
          placeholderTextColor={palette.textDim}
          style={styles.input}
        />
        <Text style={styles.sheetLabel}>Environment</Text>
        <View style={styles.chipsRow}>
          {(['development', 'staging', 'production'] as DeployEnvironment[]).map((e) => (
            <Pressable
              key={e}
              onPress={() => setDepEnv(e)}
              style={[styles.sevBtn, depEnv === e && { borderColor: accent, backgroundColor: accent + '22' }]}>
              <Text style={[styles.sevText, depEnv === e && { color: accent }]}>{e}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sheetLabel}>Deploy Date</Text>
        <CalendarPicker value={depDate} onChange={setDepDate} accent={accent} />
        <Text style={styles.sheetLabel}>Release notes</Text>
        <TextInput
          value={depNotes}
          onChangeText={setDepNotes}
          placeholder="What's in this release?"
          placeholderTextColor={palette.textDim}
          multiline
          style={[styles.input, { height: 80 }]}
        />
        <GlowButton
          title="Save Deployment"
          color={accent}
          style={{ marginTop: 14 }}
          onPress={async () => {
            if (!id) return;
            await createDep.mutateAsync({
              projectId: id,
              version: depVersion || null,
              environment: depEnv,
              releaseNotes: depNotes || null,
              deployedAt: new Date(depDate + 'T12:00:00').toISOString(),
            });
            setDepVersion('');
            setDepNotes('');
            setDepDate(todayISO());
            setDepOpen(false);
          }}
        />
      </BottomSheet>

      {/* ── Ship sheet ──────────────────────────────────────────── */}
      {/* ── Status picker ───────────────────────────────────────── */}
      <BottomSheet visible={statusOpen} onClose={() => setStatusOpen(false)} title="Set Status">
        <View style={{ gap: 8 }}>
          {(['Idea', 'Backlog', 'In Progress', 'Review', 'Shipped', 'Archived'] as const).map((s) => {
            const active = p.status === s;
            const c = statusColor[s] ?? accent;
            return (
              <Pressable
                key={s}
                onPress={async () => {
                  if (s === 'Shipped' && p.status !== 'Shipped') {
                    setStatusOpen(false);
                    await ship.mutateAsync(p.id);
                    return;
                  }
                  await updateProj.mutateAsync({ status: s });
                  setStatusOpen(false);
                }}
                style={[
                  styles.statusRow,
                  active && { borderColor: c, backgroundColor: c + '22' },
                ]}>
                <View style={[styles.statusDot, { backgroundColor: c }]} />
                <Text style={[styles.statusRowText, active && { color: c }]}>{s}</Text>
                {active && <Ionicons name="checkmark" size={18} color={c} />}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>

      {/* ── Ship sheet ──────────────────────────────────────────── */}
      <BottomSheet visible={shipOpen} onClose={() => setShipOpen(false)} title="🚀 Ship It">
        <Text style={styles.shipBody}>
          Marking <Text style={{ color: '#fff', fontWeight: '900' }}>{p.name}</Text> as Shipped will
          stamp today's date and award XP. You can unship by changing the status later.
        </Text>
        <GlowButton
          title="🚀 Confirm Ship"
          color={accent}
          onPress={async () => {
            await ship.mutateAsync(p.id);
            setShipOpen(false);
          }}
        />
      </BottomSheet>
    </ThemedScene>
  );
}

// ───────────────────────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────────────────────

function HeroStat({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.heroStat}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.heroStatValue, { color }]}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function GhStat({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.ghStat}>
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.ghStatVal, { color }]}>{value}</Text>
      <Text style={styles.ghStatLabel}>{label}</Text>
    </View>
  );
}

function LinkPill({
  icon,
  label,
  url,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  url: string;
  accent: string;
}) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      style={[styles.linkPill, { borderColor: accent + '55' }]}>
      <Ionicons name={icon} size={14} color={accent} />
      <Text style={[styles.linkText, { color: accent }]}>{label}</Text>
    </Pressable>
  );
}

// ───────────────────────────────────────────────────────────────
// Styles
// ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  subRow: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero
  hero: {
    marginHorizontal: 16,
    marginTop: 4,
    backgroundColor: palette.card,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  coverBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: { fontSize: 32 },
  title: { color: palette.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { fontWeight: '900', fontSize: 10, letterSpacing: 0.5 },
  priority: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  priorityText: { fontWeight: '900', fontSize: 10 },
  type: { color: palette.textDim, fontSize: 11, fontWeight: '700' },
  desc: { color: palette.textMuted, fontSize: 13, lineHeight: 19 },

  progressBlock: { gap: 6 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: palette.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },
  progressPct: { fontSize: 11, fontWeight: '900' },
  track: { height: 6, borderRadius: 3, backgroundColor: palette.cardAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.cardAlt,
    borderRadius: 12,
    paddingVertical: 10,
  },
  heroStat: { flex: 1, alignItems: 'center', gap: 2 },
  heroStatValue: { fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  heroStatLabel: { color: palette.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  statsDivider: { width: StyleSheet.hairlineWidth, height: 26, backgroundColor: palette.border },

  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.cardAlt,
  },
  countdownText: { fontSize: 11, fontWeight: '800' },

  // Actions
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 14 },

  // Links
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  linkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: palette.card,
  },
  linkText: { fontSize: 11, fontWeight: '800' },

  // Section card
  section: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 10,
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { color: palette.text, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: palette.cardAlt,
  },
  sectionActionText: { fontSize: 11, fontWeight: '900' },
  muted: { color: palette.textDim, fontSize: 12, fontStyle: 'italic' },
  techWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  // GitHub
  ghStatsRow: { flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' },
  ghStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ghStatVal: { fontSize: 14, fontWeight: '900' },
  ghStatLabel: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  langPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  langText: { fontSize: 10, fontWeight: '900' },
  pushPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  pushText: { fontSize: 11, fontWeight: '800' },

  // Issues tabs
  tabRow: { flexDirection: 'row', gap: 6 },
  subTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.cardAlt,
  },
  subTabText: { color: palette.textMuted, fontSize: 11, fontWeight: '800' },

  // Portfolio
  portRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: palette.card,
  },
  portLabel: { color: palette.text, fontWeight: '900', fontSize: 14 },
  portSub: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
  toggle: { width: 44, height: 26, borderRadius: 13, padding: 2, backgroundColor: palette.cardAlt },
  toggleDot: { width: 22, height: 22, borderRadius: 11 },

  // Sheet form
  sheetLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sevBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  sevText: { color: palette.textMuted, fontWeight: '800', fontSize: 11 },
  shipBody: { color: palette.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 14 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusRowText: { flex: 1, color: palette.text, fontWeight: '900', fontSize: 14 },
});
