import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, Linking, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { StarRating } from '@/components/gamification/StarRating';
import { TechTag } from '@/components/forge/TechTag';
import { MilestoneRow } from '@/components/forge/MilestoneRow';
import { SessionCard } from '@/components/forge/SessionCard';
import { DeploymentRow } from '@/components/forge/DeploymentRow';
import { IssueRow } from '@/components/forge/IssueRow';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
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

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accent = screenTheme.forge.accent;

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
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueSeverity, setIssueSeverity] = useState<IssueSeverity>('Medium');
  const [depOpen, setDepOpen] = useState(false);
  const [depVersion, setDepVersion] = useState('');
  const [depEnv, setDepEnv] = useState<DeployEnvironment>('production');
  const [depNotes, setDepNotes] = useState('');
  const [shipOpen, setShipOpen] = useState(false);
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
  const issueList = issues.data?.issues ?? [];
  const openIssues = issueList.filter((i) => i.status !== 'Fixed');
  const fixedIssues = issueList.filter((i) => i.status === 'Fixed');
  const depList = deps.data?.deployments ?? p.deployments ?? [];
  const gh = p.githubData as any;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 20, gap: 14 }}>
      {/* Header */}
      <View style={[styles.header, { borderColor: p.coverColor + '66', backgroundColor: p.coverColor + '11' }]}>
        <Text style={styles.cover}>{p.coverEmoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{p.name}</Text>
          <Text style={styles.subtitle}>
            {p.status} · {p.totalHours.toFixed(1)}h · {p.type}
          </Text>
          <StarRating value={p.stars} readOnly size={14} />
        </View>
        <Pressable onPress={() => togglePin.mutate(p.id)} hitSlop={8}>
          <Ionicons name={p.isPinned ? 'pin' : 'pin-outline'} size={20} color={accent} />
        </Pressable>
      </View>

      {p.description && <Text style={styles.body}>{p.description}</Text>}

      <View style={styles.actions}>
        {p.status !== 'Shipped' && (
          <GlowButton title="🚀 Ship It" color={accent} onPress={() => setShipOpen(true)} style={{ flex: 1 }} />
        )}
        <GlowButton
          title="▶ Start Session"
          variant="ghost"
          color={accent}
          onPress={() => router.push(`/forge/active-session?projectId=${p.id}` as any)}
          style={{ flex: 1 }}
        />
      </View>

      {(p.githubUrl || p.demoUrl || p.figmaUrl || p.docsUrl) && (
        <View style={styles.linksRow}>
          {p.githubUrl && (
            <Pressable onPress={() => Linking.openURL(p.githubUrl!)} style={[styles.linkPill, { borderColor: accent + '55' }]}>
              <Ionicons name="logo-github" size={14} color={accent} />
              <Text style={[styles.linkText, { color: accent }]}>GitHub</Text>
            </Pressable>
          )}
          {p.demoUrl && (
            <Pressable onPress={() => Linking.openURL(p.demoUrl!)} style={[styles.linkPill, { borderColor: accent + '55' }]}>
              <Ionicons name="open" size={14} color={accent} />
              <Text style={[styles.linkText, { color: accent }]}>Demo</Text>
            </Pressable>
          )}
          {p.figmaUrl && (
            <Pressable onPress={() => Linking.openURL(p.figmaUrl!)} style={[styles.linkPill, { borderColor: accent + '55' }]}>
              <Ionicons name="brush-outline" size={14} color={accent} />
              <Text style={[styles.linkText, { color: accent }]}>Figma</Text>
            </Pressable>
          )}
          {p.docsUrl && (
            <Pressable onPress={() => Linking.openURL(p.docsUrl!)} style={[styles.linkPill, { borderColor: accent + '55' }]}>
              <Ionicons name="document-text-outline" size={14} color={accent} />
              <Text style={[styles.linkText, { color: accent }]}>Docs</Text>
            </Pressable>
          )}
        </View>
      )}

      {p.techStack.length > 0 && (
        <View style={styles.techWrap}>
          {p.techStack.map((t) => <TechTag key={t} label={t} color={accent} small />)}
        </View>
      )}

      {/* GitHub section */}
      {p.githubUrl && (
        <View style={[styles.section, { borderColor: accent + '33' }]}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>GITHUB</Text>
            <Pressable onPress={() => sync.mutate(p.id)} hitSlop={8}>
              <Ionicons name="refresh" size={16} color={accent} />
            </Pressable>
          </View>
          {gh ? (
            <View style={styles.ghRow}>
              <Stat icon="star" value={gh.stars ?? 0} color="#fbbf24" />
              <Stat icon="git-network" value={gh.forks ?? 0} color={accent} />
              <Stat icon="bug" value={gh.openIssues ?? 0} color="#ef4444" />
              <Text style={styles.ghLang}>{gh.language ?? '—'}</Text>
            </View>
          ) : (
            <Text style={styles.ghHint}>Tap refresh to sync repo stats.</Text>
          )}
          {gh?.pushedAt && (
            <Text style={styles.ghPushed}>
              Last pushed {Math.floor((Date.now() - new Date(gh.pushedAt).getTime()) / 86400000)}d ago
            </Text>
          )}
        </View>
      )}

      {/* Milestones */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>
          MILESTONES · {doneMs}/{msList.length}
        </Text>
        <Pressable onPress={() => setMsOpen(true)} hitSlop={8}>
          <Ionicons name="add" size={18} color={accent} />
        </Pressable>
      </View>
      <View style={{ gap: 6 }}>
        {msList.map((m) => (
          <MilestoneRow
            key={m.id}
            milestone={m}
            accent={accent}
            onToggle={() => completeMs.mutate({ id: m.id, completed: !m.completed })}
            onToggleSubtask={(s) => toggleSub.mutate({ milestoneId: m.id, subtaskId: s.id })}
            onAddSubtask={() => {
              Alert.prompt?.('New sub-task', undefined, (txt) => {
                if (txt) createSub.mutate({ milestoneId: m.id, body: { title: txt } });
              });
            }}
          />
        ))}
      </View>

      {/* Issues */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>BUGS · {openIssues.length} OPEN</Text>
        <Pressable onPress={() => setIssueOpen(true)} hitSlop={8}>
          <Ionicons name="add" size={18} color={accent} />
        </Pressable>
      </View>
      <View style={styles.tabRow}>
        <Pressable onPress={() => setIssueTab('open')} style={[styles.subTab, issueTab === 'open' && { borderColor: accent }]}>
          <Text style={[styles.subTabText, issueTab === 'open' && { color: accent }]}>Open ({openIssues.length})</Text>
        </Pressable>
        <Pressable onPress={() => setIssueTab('fixed')} style={[styles.subTab, issueTab === 'fixed' && { borderColor: accent }]}>
          <Text style={[styles.subTabText, issueTab === 'fixed' && { color: accent }]}>Fixed ({fixedIssues.length})</Text>
        </Pressable>
      </View>
      <View>
        {(issueTab === 'open' ? openIssues : fixedIssues).map((i) => (
          <IssueRow key={i.id} issue={i} onFix={() => fixIssue.mutate(i.id)} />
        ))}
      </View>

      {/* Deployments */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>DEPLOYMENTS · {depList.length}</Text>
        <Pressable onPress={() => setDepOpen(true)} hitSlop={8}>
          <Ionicons name="add" size={18} color={accent} />
        </Pressable>
      </View>
      <View>
        {depList.map((d) => (
          <DeploymentRow key={d.id} deployment={d} />
        ))}
      </View>

      {/* Sessions */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>RECENT SESSIONS</Text>
      </View>
      <View>
        {(p.recentSessions ?? []).map((s) => (
          <SessionCard key={s.id} session={s as any} accent={accent} />
        ))}
      </View>

      {/* Portfolio toggle */}
      <View style={[styles.portRow, { borderColor: accent + '33' }]}>
        <Text style={styles.portLabel}>In Portfolio</Text>
        <Pressable
          onPress={() => updateProj.mutate({ isPortfolio: !p.isPortfolio })}
          style={[styles.toggle, p.isPortfolio && { backgroundColor: accent + '33' }]}>
          <View style={[styles.toggleDot, { backgroundColor: p.isPortfolio ? accent : palette.textMuted, alignSelf: p.isPortfolio ? 'flex-end' : 'flex-start' }]} />
        </Pressable>
      </View>

      <View style={{ height: 80 }} />

      {/* Bottom sheets */}
      <BottomSheet visible={msOpen} onClose={() => setMsOpen(false)} title="New Milestone">
        <TextInput
          value={msTitle}
          onChangeText={setMsTitle}
          placeholder="Title"
          placeholderTextColor={palette.textDim}
          style={styles.input}
        />
        <GlowButton
          title="Add Milestone"
          color={accent}
          onPress={async () => {
            if (!msTitle.trim() || !id) return;
            await createMs.mutateAsync({ projectId: id, title: msTitle.trim() });
            setMsTitle('');
            setMsOpen(false);
          }}
          style={{ marginTop: 12 }}
        />
      </BottomSheet>

      <BottomSheet visible={issueOpen} onClose={() => setIssueOpen(false)} title="Log Issue">
        <TextInput
          value={issueTitle}
          onChangeText={setIssueTitle}
          placeholder="What's broken?"
          placeholderTextColor={palette.textDim}
          style={styles.input}
        />
        <Text style={styles.sectionTitle}>Severity</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          {(['Critical', 'High', 'Medium', 'Low'] as IssueSeverity[]).map((s) => (
            <Pressable key={s} onPress={() => setIssueSeverity(s)} style={[styles.sevBtn, issueSeverity === s && { borderColor: accent }]}>
              <Text style={[styles.sevText, issueSeverity === s && { color: accent }]}>{s}</Text>
            </Pressable>
          ))}
        </View>
        <GlowButton
          title="Save Issue"
          color={accent}
          style={{ marginTop: 12 }}
          onPress={async () => {
            if (!issueTitle.trim() || !id) return;
            await createIssue.mutateAsync({ projectId: id, title: issueTitle.trim(), severity: issueSeverity });
            setIssueTitle('');
            setIssueOpen(false);
          }}
        />
      </BottomSheet>

      <BottomSheet visible={depOpen} onClose={() => setDepOpen(false)} title="Log Deployment">
        <TextInput
          value={depVersion}
          onChangeText={setDepVersion}
          placeholder="v1.0.0"
          placeholderTextColor={palette.textDim}
          style={styles.input}
        />
        <Text style={styles.sectionTitle}>Environment</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          {(['development', 'staging', 'production'] as DeployEnvironment[]).map((e) => (
            <Pressable key={e} onPress={() => setDepEnv(e)} style={[styles.sevBtn, depEnv === e && { borderColor: accent }]}>
              <Text style={[styles.sevText, depEnv === e && { color: accent }]}>{e}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={depNotes}
          onChangeText={setDepNotes}
          placeholder="Release notes…"
          placeholderTextColor={palette.textDim}
          multiline
          style={[styles.input, { height: 80, marginTop: 10 }]}
        />
        <GlowButton
          title="Save Deployment"
          color={accent}
          style={{ marginTop: 12 }}
          onPress={async () => {
            if (!id) return;
            await createDep.mutateAsync({ projectId: id, version: depVersion || null, environment: depEnv, releaseNotes: depNotes || null });
            setDepVersion('');
            setDepNotes('');
            setDepOpen(false);
          }}
        />
      </BottomSheet>

      <BottomSheet visible={shipOpen} onClose={() => setShipOpen(false)} title="Ship It">
        <Text style={{ color: palette.textMuted, marginBottom: 14 }}>
          Mark this project as Shipped and claim your XP?
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
    </ScrollView>
  );
}

function Stat({ icon, value, color }: { icon: any; value: number; color: string }) {
  return (
    <View style={styles.ghStat}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[styles.ghStatVal, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  cover: { fontSize: 40 },
  title: { color: palette.text, fontSize: 22, fontWeight: '900' },
  subtitle: { color: palette.textMuted, fontSize: 12, fontWeight: '700', marginVertical: 2 },
  body: { color: palette.text, fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10 },
  linksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  linkPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  linkText: { fontSize: 11, fontWeight: '800' },
  techWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  section: { backgroundColor: palette.card, borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sectionTitle: { color: palette.textMuted, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  ghRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  ghStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ghStatVal: { fontSize: 13, fontWeight: '900' },
  ghLang: { color: palette.textMuted, fontSize: 11, fontWeight: '700', marginLeft: 'auto' },
  ghPushed: { color: palette.textMuted, fontSize: 11 },
  ghHint: { color: palette.textDim, fontSize: 12 },
  tabRow: { flexDirection: 'row', gap: 6 },
  subTab: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: palette.border },
  subTabText: { color: palette.textMuted, fontSize: 11, fontWeight: '800' },
  portRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: palette.card,
  },
  portLabel: { color: palette.text, fontWeight: '700', fontSize: 13 },
  toggle: { width: 44, height: 26, borderRadius: 13, padding: 2, backgroundColor: palette.cardAlt },
  toggleDot: { width: 22, height: 22, borderRadius: 11 },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
  sevBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
  sevText: { color: palette.textMuted, fontWeight: '800', fontSize: 11 },
});
