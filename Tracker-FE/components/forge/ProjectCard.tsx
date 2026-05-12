import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
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

export function ProjectCard({ project: p, onPress, onLongPress, index = 0, accent = '#22d3ee' }: Props) {
  const totalMs = p.milestones?.length ?? 0;
  const doneMs = (p.milestones ?? []).filter((m) => m.completed).length;
  const pct = p.milestoneCompletionPct ?? (totalMs ? Math.round((doneMs / totalMs) * 100) : 0);
  const open = p.openIssueCount ?? 0;
  const stack = p.techStack ?? [];

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(14)}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.card,
          { borderColor: (p.coverColor ?? accent) + '55' },
          pressed && { opacity: 0.8 },
        ]}>
        <View style={[styles.strip, { backgroundColor: p.coverColor ?? accent }]} />
        <View style={styles.head}>
          <Text style={styles.emoji}>{p.coverEmoji ?? '💻'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {p.name}
            </Text>
            <View style={styles.metaRow}>
              <View style={[styles.priority, { borderColor: priorityColor[p.priority] }]}>
                <Text style={[styles.priorityText, { color: priorityColor[p.priority] }]}>{p.priority}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: (statusColor[p.status] ?? accent) + '22' }]}>
                <Text style={[styles.statusText, { color: statusColor[p.status] ?? accent }]}>{p.status}</Text>
              </View>
              {p.isPinned && <Ionicons name="pin" size={12} color={accent} />}
            </View>
          </View>
          {open > 0 && (
            <View style={styles.bugBadge}>
              <Text style={styles.bugText}>{open}</Text>
            </View>
          )}
        </View>

        {stack.length > 0 && (
          <View style={styles.chips}>
            {stack.slice(0, 3).map((t) => (
              <TechTag key={t} label={t} color={accent} small />
            ))}
            {stack.length > 3 && <Text style={styles.more}>+{stack.length - 3}</Text>}
          </View>
        )}

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: accent }]} />
        </View>

        <View style={styles.foot}>
          <Text style={styles.hours}>{p.totalHours.toFixed(1)}h</Text>
          <Text style={styles.foot2}>
            {doneMs}/{totalMs} milestones
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  strip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 6 },
  emoji: { fontSize: 26 },
  name: { color: palette.text, fontWeight: '800', fontSize: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  priority: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 },
  priorityText: { fontWeight: '900', fontSize: 10 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  statusText: { fontWeight: '700', fontSize: 10, letterSpacing: 0.4 },
  bugBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bugText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingLeft: 6 },
  more: { color: palette.textDim, fontSize: 11, fontWeight: '700', alignSelf: 'center', marginLeft: 3 },
  track: { marginLeft: 6, height: 5, borderRadius: 3, backgroundColor: palette.cardAlt, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 6 },
  hours: { color: palette.text, fontWeight: '800', fontSize: 12 },
  foot2: { color: palette.textMuted, fontSize: 11, fontWeight: '600' },
});
