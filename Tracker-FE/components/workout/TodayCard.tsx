import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { palette, screenTheme } from '@/lib/themes';
import { useTodayWorkout } from '@/hooks/useRoutines';

export function TodayCard() {
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const { data } = useTodayWorkout();
  const today = data?.today;
  const routine = data?.routine;
  if (!routine) return null;

  if (today?.isRestDay) {
    return (
      <View style={[styles.card, { borderColor: palette.border }]}>
        <View style={styles.head}>
          <Text style={[styles.routine, { color: palette.textMuted }]}>{routine.name}</Text>
          <Text style={[styles.day, { color: palette.textMuted }]}>{today.dayLabel}</Text>
        </View>
        <Text style={styles.title}>🛌 Rest Day</Text>
        <Text style={styles.subtitle}>Counts positively toward your streak.</Text>
        <Pressable
          style={[styles.cta, { borderColor: accent, backgroundColor: accent + '22' }]}
          onPress={() => router.push('/dojo' as any)}>
          <Text style={[styles.ctaText, { color: accent }]}>Log Rest →</Text>
        </Pressable>
      </View>
    );
  }

  if (!today || !today.templateId) {
    return (
      <View style={[styles.card, { borderColor: palette.border }]}>
        <View style={styles.head}>
          <Text style={[styles.routine, { color: palette.textMuted }]}>{routine.name}</Text>
        </View>
        <Text style={styles.title}>Free day</Text>
        <Text style={styles.subtitle}>Nothing scheduled — train if you want to.</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/dojo/new-workout', params: { templateId: today.templateId } } as any)
      }
      style={({ pressed }) => [
        styles.card,
        { borderColor: accent + '88', shadowColor: accent },
        pressed && { opacity: 0.85 },
      ]}>
      <View style={styles.head}>
        <Text style={[styles.routine, { color: accent }]}>{routine.name}</Text>
        <Text style={styles.day}>{today.dayLabel}</Text>
      </View>
      <Text style={styles.title}>{today.templateName}</Text>
      <View style={styles.cta}>
        <Ionicons name="play-circle" size={16} color={accent} />
        <Text style={[styles.ctaText, { color: accent }]}>Start →</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 6,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  head: { flexDirection: 'row', justifyContent: 'space-between' },
  routine: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' },
  day: { fontSize: 10, fontWeight: '700', color: palette.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { color: palette.text, fontWeight: '900', fontSize: 22, letterSpacing: -0.4 },
  subtitle: { color: palette.textMuted, fontSize: 13 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 0,
    marginTop: 4,
  },
  ctaText: { fontSize: 13, fontWeight: '800' },
});
