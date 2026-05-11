import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { StarRating } from '@/components/gamification/StarRating';
import { useWorkout } from '@/hooks/useWorkouts';

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accent = screenTheme.dojo.accent;
  const { data, isLoading } = useWorkout(id);

  if (isLoading || !data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: palette.textMuted }}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={styles.title}>{data.name}</Text>
      <Text style={styles.subtitle}>
        {data.type} · {new Date(data.date).toLocaleDateString()} · {data.durationMinutes ?? '—'} min
      </Text>
      <StarRating value={data.stars} readOnly size={18} />
      <Text style={[styles.xp, { color: accent }]}>+{data.xpEarned} XP</Text>

      {data.notes && (
        <View style={styles.card}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.body}>{data.notes}</Text>
        </View>
      )}

      <Text style={[styles.label, { marginTop: 14 }]}>Exercises</Text>
      <View style={{ gap: 8 }}>
        {(data.exercises ?? []).map((ex) => (
          <View key={ex.id} style={styles.exCard}>
            <Text style={styles.exName}>{ex.name}</Text>
            {ex.sets.map((s, i) => (
              <View key={s.id ?? i} style={styles.setRow}>
                <Text style={styles.setIdx}>{i + 1}</Text>
                <Text style={styles.setMeta}>
                  {s.reps ? `${s.reps} reps` : ''}
                  {s.weightKg ? ` × ${s.weightKg}kg` : ''}
                  {s.durationSeconds ? ` · ${s.durationSeconds}s` : ''}
                </Text>
                {s.isPr && <Text style={[styles.prTag, { color: accent }]}>PR</Text>}
              </View>
            ))}
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
  xp: { fontSize: 14, fontWeight: '800' },
  card: { backgroundColor: palette.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: palette.border, gap: 4 },
  label: { color: palette.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  body: { color: palette.text, fontSize: 14, lineHeight: 20 },
  exCard: { backgroundColor: palette.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: palette.border, gap: 6 },
  exName: { color: palette.text, fontWeight: '800', fontSize: 15 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  setIdx: { color: palette.textMuted, width: 22, textAlign: 'center', fontWeight: '700' },
  setMeta: { color: palette.text, fontSize: 13, flex: 1 },
  prTag: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
});
