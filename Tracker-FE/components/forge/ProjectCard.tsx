import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, priorityColor } from '@/lib/themes';
import { TechTag } from './TechTag';
import type { Project } from '@/types';

interface Props {
  project: Project;
  onPress?: () => void;
  onLongPress?: () => void;
  index?: number;
  accent?: string;
}

const statusColor: Record<string, string> = {
  Idea: '#94a3b8',
  Backlog: '#60a5fa',
  'In Progress': '#22d3ee',
  Review: '#fbbf24',
  Shipped: '#4ade80',
  Archived: '#64748b',
};

const daysBetween = (a: Date, b: Date) =>
  Math.floor((b.getTime() - a.getTime()) / 86400000);

const formatRelative = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = daysBetween(new Date(iso), new Date());
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
};

const formatTargetCountdown = (
  iso: string | null | undefined,
): { label: string; color: string } | null => {
  if (!iso) return null;
  const d = daysBetween(new Date(), new Date(iso));
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, color: '#ef4444' };
  if (d === 0) return { label: 'due today', color: '#fbbf24' };
  if (d <= 7) return { label: `${d}d left`, color: '#fbbf24' };
  if (d <= 30) return { label: `${d}d left`, color: '#22d3ee' };
  return { label: `${Math.floor(d / 30)}mo left`, color: palette.textMuted };
};

export function ProjectCard({
  project: p,
  onPress,
  onLongPress,
  index = 0,
  accent = '#22d3ee',
}: Props) {
  const cardAccent = p.coverColor || accent;
  const totalMs = p.milestones?.length ?? 0;
  const doneMs = (p.milestones ?? []).filter((m) => m.completed).length;
  const pct = p.milestoneCompletionPct ?? (totalMs ? Math.round((doneMs / totalMs) * 100) : 0);
  const openIssues = p.openIssueCount ?? 0;
  const stack = p.techStack ?? [];

  const lastActive = formatRelative(p.lastSessionDate ?? p.updatedAt);
  const target = p.status === 'Shipped'
    ? p.shippedDate
      ? { label: `shipped ${formatRelative(p.shippedDate)}`, color: '#4ade80' }
      : null
    : formatTargetCountdown(p.targetShipDate);

  const sessionCount = p.recentSessions?.length ?? 0;
  const status = statusColor[p.status] ?? accent;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(14)}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.card,
          { borderColor: cardAccent + '55' },
          pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        ]}>
        {/* Accent gradient corner */}
        <LinearGradient
          colors={[cardAccent + '33', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />

        {/* Header */}
        <View style={styles.head}>
          <View style={[styles.emojiBox, { backgroundColor: cardAccent + '22', borderColor: cardAccent + '66' }]}>
            <Text style={styles.emoji}>{p.coverEmoji ?? '💻'}</Text>
          </View>

          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {p.name}
              </Text>
              {p.isPinned && <Ionicons name="pin" size={14} color={cardAccent} />}
              {p.isPortfolio && <Ionicons name="ribbon" size={14} color="#fbbf24" />}
            </View>
            <View style={styles.metaRow}>
              <View style={[styles.priority, { borderColor: priorityColor[p.priority] }]}>
                <Text style={[styles.priorityText, { color: priorityColor[p.priority] }]}>
                  {p.priority}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: status + '22', borderColor: status + '55' }]}>
                <Text style={[styles.statusText, { color: status }]}>{p.status}</Text>
              </View>
              <Text style={styles.type}>· {p.type}</Text>
            </View>
          </View>

          {openIssues > 0 && (
            <View style={styles.bugBadge}>
              <Ionicons name="bug" size={10} color="#fff" />
              <Text style={styles.bugText}>{openIssues}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {p.description && (
          <Text style={styles.desc} numberOfLines={2}>
            {p.description}
          </Text>
        )}

        {/* Tech stack */}
        {stack.length > 0 && (
          <View style={styles.chips}>
            {stack.slice(0, 4).map((t) => (
              <TechTag key={t} label={t} color={cardAccent} small />
            ))}
            {stack.length > 4 && <Text style={styles.more}>+{stack.length - 4}</Text>}
          </View>
        )}

        {/* Milestone progress */}
        {totalMs > 0 && (
          <View style={styles.progressBlock}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                Milestones · {doneMs}/{totalMs}
              </Text>
              <Text style={[styles.progressPct, { color: cardAccent }]}>{pct}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%`, backgroundColor: cardAccent }]} />
            </View>
          </View>
        )}

        {/* Stats row */}
        <View style={styles.stats}>
          <Stat icon="time-outline" label={`${p.totalHours.toFixed(1)}h`} color={cardAccent} />
          {sessionCount > 0 && (
            <Stat icon="terminal-outline" label={`${sessionCount} sess`} color={palette.textMuted} />
          )}
          {p.estimatedHours && (
            <Stat
              icon="speedometer-outline"
              label={`${Math.round((p.totalHours / p.estimatedHours) * 100)}% est`}
              color={palette.textMuted}
            />
          )}
          {p.githubData && typeof (p.githubData as any).stars === 'number' && (
            <Stat icon="star-outline" label={`${(p.githubData as any).stars}`} color="#fbbf24" />
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {lastActive && (
            <View style={styles.footMeta}>
              <Ionicons name="pulse-outline" size={11} color={palette.textDim} />
              <Text style={styles.footText}>Active {lastActive}</Text>
            </View>
          )}
          {target && (
            <View style={styles.footMeta}>
              <Ionicons name="flag-outline" size={11} color={target.color} />
              <Text style={[styles.footText, { color: target.color }]}>{target.label}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function Stat({ icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={11} color={color} />
      <Text style={[styles.statText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    opacity: 0.7,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: palette.text, fontWeight: '900', fontSize: 16, letterSpacing: -0.2, flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  priority: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  priorityText: { fontWeight: '900', fontSize: 10 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  statusText: { fontWeight: '800', fontSize: 10, letterSpacing: 0.4 },
  type: { color: palette.textDim, fontSize: 11, fontWeight: '700' },
  bugBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    minWidth: 26,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
  },
  bugText: { color: '#fff', fontWeight: '900', fontSize: 11 },
  desc: { color: palette.textMuted, fontSize: 12, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  more: { color: palette.textDim, fontSize: 11, fontWeight: '700', alignSelf: 'center' },
  progressBlock: { gap: 5 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { color: palette.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  progressPct: { fontSize: 11, fontWeight: '900' },
  track: { height: 5, borderRadius: 3, backgroundColor: palette.cardAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: palette.cardAlt,
  },
  statText: { fontSize: 11, fontWeight: '800' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  footMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footText: { color: palette.textDim, fontSize: 11, fontWeight: '700' },
});
