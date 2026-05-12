import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { palette, priorityColor } from '@/lib/themes';
import type { Milestone, Subtask } from '@/types';

interface Props {
  milestone: Milestone;
  accent?: string;
  onToggle?: () => void;
  onAddSubtask?: () => void;
  onToggleSubtask?: (subtask: Subtask) => void;
  onEdit?: () => void;
}

export function MilestoneRow({ milestone: m, accent = '#22d3ee', onToggle, onAddSubtask, onToggleSubtask, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const overdue = !!m.isOverdue;
  const subs = m.subtasks ?? [];
  const doneSubs = subs.filter((s) => s.completed).length;

  return (
    <View
      style={[
        styles.wrap,
        { borderColor: overdue ? '#fbbf24' : palette.border },
      ]}>
      <View style={styles.row}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle?.();
          }}
          hitSlop={8}>
          <Ionicons
            name={m.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={m.completed ? accent : palette.textMuted}
          />
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => setExpanded((e) => !e)} onLongPress={onEdit}>
          <Text style={[styles.title, m.completed && styles.strike]}>{m.title}</Text>
          <View style={styles.metaRow}>
            {m.targetDate && (
              <Text style={[styles.date, overdue && { color: '#fbbf24' }]}>
                {overdue ? '⚠ ' : ''}
                {new Date(m.targetDate).toLocaleDateString()}
              </Text>
            )}
            {subs.length > 0 && (
              <Text style={styles.subCount}>
                {doneSubs}/{subs.length} tasks
              </Text>
            )}
          </View>
        </Pressable>
        {subs.length > 0 && (
          <Pressable onPress={() => setExpanded((e) => !e)} hitSlop={8}>
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={palette.textMuted} />
          </Pressable>
        )}
      </View>

      {expanded && (
        <View style={styles.subs}>
          {subs.map((s) => (
            <Pressable key={s.id} style={styles.subRow} onPress={() => onToggleSubtask?.(s)}>
              <Ionicons
                name={s.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={s.completed ? accent : palette.textMuted}
              />
              <View style={[styles.subPriority, { borderColor: priorityColor[s.priority] }]}>
                <Text style={[styles.subPriorityText, { color: priorityColor[s.priority] }]}>{s.priority}</Text>
              </View>
              <Text style={[styles.subTitle, s.completed && styles.strike]} numberOfLines={1}>
                {s.title}
              </Text>
            </Pressable>
          ))}
          {onAddSubtask && (
            <Pressable onPress={onAddSubtask} style={styles.addSub}>
              <Ionicons name="add" size={14} color={accent} />
              <Text style={[styles.addText, { color: accent }]}>Add sub-task</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: palette.text, fontSize: 14, fontWeight: '700' },
  strike: { textDecorationLine: 'line-through', color: palette.textMuted },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  date: { color: palette.textDim, fontSize: 11, fontWeight: '600' },
  subCount: { color: palette.textDim, fontSize: 11, fontWeight: '600' },
  subs: { paddingLeft: 26, gap: 6 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subPriority: { borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  subPriorityText: { fontSize: 9, fontWeight: '900' },
  subTitle: { flex: 1, color: palette.textMuted, fontSize: 12, fontWeight: '600' },
  addSub: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontSize: 12, fontWeight: '700' },
});
