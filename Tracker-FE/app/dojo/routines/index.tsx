import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme } from '@/lib/themes';
import { EmptyState } from '@/components/layout/EmptyState';
import { GlowButton } from '@/components/ui/GlowButton';
import {
  useRoutines,
  useDeleteRoutine,
  useActivateRoutine,
} from '@/hooks/useRoutines';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Compact template name into 2-3 chars. "Push Day" → "PD", "Upper Body" → "UB",
// single-word names take first 3 chars.
const abbreviateTemplate = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
};

export default function RoutinesList() {
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const { data, isFetching, refetch } = useRoutines();
  const del = useDeleteRoutine();
  const activate = useActivateRoutine();

  const routines = data?.routines ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />}>
        {routines.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No routines yet"
            message="Create a weekly plan (PPL, Upper/Lower, Full Body 3×) and one becomes 'Today's Workout' on the dashboard."
            accent={accent}
          />
        ) : (
          <View style={{ gap: 10 }}>
            {routines.map((r) => {
              const dayMap = new Map(r.days.map((d) => [d.dayOfWeek, d]));
              return (
                <Pressable
                  key={r.id}
                  onPress={() => router.push(`/dojo/routines/${r.id}` as any)}
                  style={[styles.card, r.isActive && { borderColor: accent }]}>
                  <View style={styles.head}>
                    <Text style={styles.name}>{r.name}</Text>
                    {r.isActive && (
                      <View style={[styles.activeBadge, { borderColor: accent, backgroundColor: accent + '22' }]}>
                        <Text style={[styles.activeText, { color: accent }]}>● ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  {r.description && <Text style={styles.desc}>{r.description}</Text>}
                  <View style={styles.weekRow}>
                    {DAYS.map((d, i) => {
                      const cell = dayMap.get(i);
                      const isWorkout = !!cell?.templateId;
                      const isRest = !!cell?.isRestDay;
                      const initials = isWorkout
                        ? abbreviateTemplate(cell?.templateName ?? '?')
                        : null;
                      return (
                        <View
                          key={i}
                          style={[
                            styles.weekCell,
                            isWorkout && { backgroundColor: accent + '33', borderColor: accent },
                            isRest && { backgroundColor: palette.cardAlt, borderColor: palette.border },
                          ]}>
                          <Text style={[styles.weekDay, isWorkout && { color: accent }]}>{d}</Text>
                          {isWorkout && (
                            <Text style={[styles.cellInitials, { color: accent }]} numberOfLines={1}>
                              {initials}
                            </Text>
                          )}
                          {isRest && (
                            <Ionicons name="moon" size={11} color={palette.textMuted} style={{ marginTop: 2 }} />
                          )}
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.legend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: accent + '66', borderColor: accent }]} />
                      <Text style={styles.legendText}>Workout</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: palette.cardAlt, borderColor: palette.border }]} />
                      <Text style={styles.legendText}>Rest</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: 'transparent', borderColor: palette.border }]} />
                      <Text style={styles.legendText}>Free</Text>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    {!r.isActive && (
                      <Pressable
                        onPress={() => activate.mutate(r.id)}
                        hitSlop={6}
                        style={[styles.actionBtn, { backgroundColor: accent + '22', borderColor: accent }]}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={accent} />
                        <Text style={[styles.actionText, { color: accent }]}>Activate</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => router.push(`/dojo/routines/${r.id}` as any)}
                      hitSlop={6}
                      style={styles.actionBtn}>
                      <Ionicons name="pencil" size={14} color={palette.textMuted} />
                      <Text style={[styles.actionText, { color: palette.textMuted }]}>Edit</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        Alert.alert('Delete routine?', r.name, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => del.mutate(r.id) },
                        ])
                      }
                      hitSlop={6}
                      style={styles.iconBtn}>
                      <Ionicons name="trash-outline" size={18} color={palette.danger} />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: 16 }} />
        <GlowButton
          title="New Routine"
          color={accent}
          onPress={() => router.push('/dojo/routines/new' as any)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { color: palette.text, fontWeight: '800', fontSize: 16, flex: 1 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  activeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  desc: { color: palette.textMuted, fontSize: 12 },
  weekRow: { flexDirection: 'row', gap: 6 },
  weekCell: {
    flex: 1,
    height: 58,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  weekDay: { color: palette.textMuted, fontWeight: '800', fontSize: 11 },
  cellInitials: { fontSize: 11, fontWeight: '900', letterSpacing: 0.4, marginTop: 4 },
  legend: { flexDirection: 'row', gap: 12, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3, borderWidth: 1 },
  legendText: { color: palette.textMuted, fontSize: 10, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
  },
  actionText: { fontWeight: '800', fontSize: 11 },
  iconBtn: { padding: 6, marginLeft: 'auto' },
});
