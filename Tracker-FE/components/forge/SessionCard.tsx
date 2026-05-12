import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';
import { StarRating } from '@/components/gamification/StarRating';
import { XPBadge } from '@/components/gamification/XPBadge';
import type { CodingSession, SessionMood } from '@/types';

const moodMeta: Record<SessionMood, { color: string; emoji: string }> = {
  'Deep Focus': { color: '#22d3ee', emoji: '🧠' },
  Normal: { color: '#94a3b8', emoji: '🙂' },
  Distracted: { color: '#fbbf24', emoji: '😵' },
  Blocked: { color: '#ef4444', emoji: '🚫' },
  'Flow State': { color: '#a78bfa', emoji: '⚡' },
};

interface Props {
  session: CodingSession;
  accent?: string;
}

export function SessionCard({ session: s, accent = '#22d3ee' }: Props) {
  const mood = s.mood ? moodMeta[s.mood] : null;
  const borderColor = mood?.color ?? accent;
  return (
    <View style={[styles.card, { borderLeftColor: borderColor }]}>
      <View style={styles.head}>
        <Text style={styles.project} numberOfLines={1}>
          {s.projectName ?? 'Untitled'}
        </Text>
        <View style={styles.duration}>
          <Ionicons name="time-outline" size={12} color={palette.textMuted} />
          <Text style={styles.durationText}>{s.durationMinutes}m</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.date}>{new Date(s.date).toLocaleDateString()}</Text>
        {mood && (
          <Text style={[styles.moodChip, { color: mood.color }]}>
            {mood.emoji} {s.mood}
          </Text>
        )}
        {s.isBillable && <Text style={styles.billable}>$ Billable</Text>}
      </View>
      {(s.tags ?? []).length > 0 && (
        <View style={styles.chips}>
          {(s.tags ?? []).map((t) => (
            <Text key={t} style={[styles.tag, { color: accent, borderColor: accent + '44' }]}>
              #{t}
            </Text>
          ))}
        </View>
      )}
      {s.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {s.notes}
        </Text>
      )}
      <View style={styles.foot}>
        <StarRating value={s.stars} readOnly size={12} />
        <XPBadge amount={s.xpEarned} color={accent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    borderLeftWidth: 3,
    padding: 12,
    gap: 6,
    marginBottom: 8,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  project: { color: palette.text, fontWeight: '800', fontSize: 14, flex: 1 },
  duration: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  date: { color: palette.textMuted, fontSize: 11, fontWeight: '600' },
  moodChip: { fontSize: 11, fontWeight: '700' },
  billable: { color: '#fbbf24', fontSize: 11, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { fontSize: 10, fontWeight: '700', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  notes: { color: palette.textMuted, fontSize: 12, lineHeight: 17 },
  foot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xp: { fontSize: 12, fontWeight: '900' },
});
