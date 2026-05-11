import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { StarRating } from '@/components/gamification/StarRating';
import { useProject, useToggleMilestone } from '@/hooks/useProjects';

export default function ProjectDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = screenTheme.forge.accent;
  const { data, isLoading } = useProject(id);
  const toggle = useToggleMilestone(id ?? '');

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: palette.textMuted }}>Loading…</Text>
      </View>
    );
  }

  const ms = data.milestones ?? [];
  const done = ms.filter((m) => m.completed).length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 20, gap: 14 }}>
      <Text style={styles.title}>{data.name}</Text>
      <Text style={styles.subtitle}>
        {data.status} · {data.totalHours.toFixed(1)}h logged
      </Text>
      <StarRating value={data.stars} readOnly size={18} />

      {data.description && <Text style={styles.body}>{data.description}</Text>}

      <View style={styles.chips}>
        {data.techStack.map((t) => (
          <View key={t} style={[styles.chip, { borderColor: accent + '66' }]}>
            <Text style={[styles.chipText, { color: accent }]}>{t}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 8 }]}>
        Milestones · {done}/{ms.length}
      </Text>
      <View style={{ gap: 8 }}>
        {ms.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => toggle.mutate({ id: m.id, completed: !m.completed })}
            style={({ pressed }) => [styles.msRow, pressed && { opacity: 0.7 }]}>
            <Ionicons
              name={m.completed ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={m.completed ? accent : palette.textMuted}
            />
            <Text style={[styles.msText, m.completed && styles.strike]}>{m.title}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { marginTop: 8 }]}>Recent Sessions</Text>
      <View style={{ gap: 6 }}>
        {(data.recentSessions ?? []).slice(0, 6).map((s) => (
          <View key={s.id} style={styles.sRow}>
            <Text style={styles.sDate}>{new Date(s.date).toLocaleDateString()}</Text>
            <Text style={styles.sMin}>{s.durationMinutes} min</Text>
            <Text style={[styles.xp, { color: accent }]}>+{s.xpEarned}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' },
  title: { color: palette.text, fontSize: 26, fontWeight: '900' },
  subtitle: { color: palette.textMuted, fontSize: 13, fontWeight: '600' },
  body: { color: palette.text, fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontWeight: '800', fontSize: 12 },
  label: { color: palette.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  msRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  msText: { color: palette.text, fontSize: 14, flex: 1 },
  strike: { textDecorationLine: 'line-through', color: palette.textMuted },
  sRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sDate: { color: palette.textMuted, fontSize: 12, fontWeight: '700', flex: 1 },
  sMin: { color: palette.text, fontWeight: '800', fontSize: 13 },
  xp: { fontSize: 13, fontWeight: '900' },
});
