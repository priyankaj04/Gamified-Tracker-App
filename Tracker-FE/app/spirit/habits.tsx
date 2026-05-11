import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { EmptyState } from '@/components/layout/EmptyState';
import {
  useTodayHabits,
  useCreateHabit,
  useCompleteHabit,
  useUncompleteHabit,
  useDeleteHabit,
  useReorderHabits,
  useHabits,
} from '@/hooks/useHabits';
import type { Habit, RoutineSlot, HabitFrequency } from '@/types';

export default function HabitsScreen() {
  const accent = screenTheme.spirit.accent;
  const router = useRouter();
  const todayHabits = useTodayHabits();
  const allHabits = useHabits();
  const create = useCreateHabit();
  const complete = useCompleteHabit();
  const uncomplete = useUncompleteHabit();
  const del = useDeleteHabit();
  const reorder = useReorderHabits();

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [slot, setSlot] = useState<RoutineSlot>('morning');
  const [freq, setFreq] = useState<HabitFrequency>('daily');
  const [xp, setXp] = useState('10');

  const habits = editMode ? allHabits : todayHabits;
  const grouped = (habits.data ?? []).reduce<Record<RoutineSlot, Habit[]>>((acc, h) => {
    if (!acc[h.routineSlot]) acc[h.routineSlot] = [];
    acc[h.routineSlot].push(h);
    return acc;
  }, {} as Record<RoutineSlot, Habit[]>);

  const moveHabit = (id: string, direction: -1 | 1) => {
    const items = [...(habits.data ?? [])];
    const idx = items.findIndex((h) => h.id === id);
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;
    [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
    reorder.mutate(items.map((h) => h.id));
  };

  const refreshing = habits.isFetching;
  const onRefresh = () => habits.refetch();

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <SpiritHeader title="Habits" subtitle="Daily routines" accent={accent} back compact />

        {habits.data && habits.data.length > 0 && (
          <View style={styles.toolbar}>
            <Pressable
              onPress={() => setEditMode((v) => !v)}
              style={({ pressed }) => [
                styles.toolBtn,
                editMode && { backgroundColor: accent + '22', borderColor: accent },
                pressed && { opacity: 0.85 },
              ]}>
              <Ionicons name={editMode ? 'checkmark' : 'reorder-three'} size={14} color={editMode ? accent : spiritText.secondary} />
              <Text style={[styles.toolLabel, editMode && { color: accent }]}>
                {editMode ? 'Done' : 'Reorder'}
              </Text>
            </Pressable>
          </View>
        )}

        {!habits.data || habits.data.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="checkmark-done"
              title="No habits yet"
              message="Start your first habit, Shinobi."
              accent={accent}
            />
          </View>
        ) : (
          <>
            {(['morning', 'evening', 'anytime'] as const).map((slot) => {
              const items = grouped[slot] ?? [];
              if (items.length === 0) return null;
              const label = slot[0].toUpperCase() + slot.slice(1);
              return (
                <View key={slot}>
                  <SectionTitle title={`${label} Routine`} accent={accent} />
                  <View style={{ paddingHorizontal: 20, gap: 8 }}>
                    {items.map((h) => (
                      <View key={h.id} style={[styles.row, !editMode && h.completedToday && { opacity: 0.55 }]}>
                        <View style={[styles.emojiWrap, { borderColor: accent + '55' }]}>
                          <Text style={{ fontSize: 20 }}>{h.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>{h.name}</Text>
                          <Text style={styles.sub}>
                            +{h.xpPerCompletion} XP · {h.frequency}
                          </Text>
                        </View>
                        {editMode ? (
                          <>
                            <Pressable onPress={() => moveHabit(h.id, -1)} hitSlop={8} style={styles.iconBtn}>
                              <Ionicons name="chevron-up" size={20} color={spiritText.secondary} />
                            </Pressable>
                            <Pressable onPress={() => moveHabit(h.id, 1)} hitSlop={8} style={styles.iconBtn}>
                              <Ionicons name="chevron-down" size={20} color={spiritText.secondary} />
                            </Pressable>
                            <Pressable
                              onPress={() =>
                                Alert.alert('Delete habit?', h.name, [
                                  { text: 'Cancel', style: 'cancel' },
                                  { text: 'Delete', style: 'destructive', onPress: () => del.mutate(h.id) },
                                ])
                              }
                              hitSlop={6}>
                              <Ionicons name="trash" size={18} color={palette.danger} />
                            </Pressable>
                          </>
                        ) : (
                          <>
                            <Pressable
                              onPress={() =>
                                router.push({
                                  pathname: '/spirit/habit-detail',
                                  params: { id: h.id, name: h.name },
                                })
                              }
                              hitSlop={6}
                              style={styles.iconBtn}>
                              <Ionicons name="stats-chart" size={16} color={spiritText.secondary} />
                            </Pressable>
                            <Pressable
                              onPress={() =>
                                h.completedToday ? uncomplete.mutate(h.id) : complete.mutate(h.id)
                              }
                              hitSlop={6}
                              style={[styles.checkOuter, h.completedToday && { backgroundColor: accent }]}>
                              <Ionicons
                                name={h.completedToday ? 'checkmark' : 'add'}
                                size={20}
                                color={h.completedToday ? '#0b0b14' : accent}
                              />
                            </Pressable>
                          </>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: accent, shadowColor: accent },
          pressed && { opacity: 0.85 },
        ]}>
        <Ionicons name="add" size={28} color="#0b0b14" />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="New Habit">
        <Field label="Name">
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor={spiritText.tertiary} />
        </Field>
        <Field label="Emoji">
          <TextInput value={emoji} onChangeText={setEmoji} style={[styles.input, { fontSize: 22 }]} maxLength={2} />
        </Field>
        <Field label="Routine">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['morning', 'evening', 'anytime'] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => setSlot(s)}
                style={[styles.chip, slot === s && { borderColor: accent, backgroundColor: accent + '22' }]}>
                <Text style={[styles.chipLabel, slot === s && { color: accent }]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </Field>
        <Field label="Frequency">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['daily', 'weekdays'] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => setFreq(s)}
                style={[styles.chip, freq === s && { borderColor: accent, backgroundColor: accent + '22' }]}>
                <Text style={[styles.chipLabel, freq === s && { color: accent }]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </Field>
        <Field label="XP per completion">
          <TextInput value={xp} onChangeText={setXp} keyboardType="number-pad" style={styles.input} />
        </Field>
        <View style={{ height: 12 }} />
        <GlowButton
          title="Save"
          color={accent}
          loading={create.isPending}
          onPress={async () => {
            if (!name) return;
            await create.mutateAsync({
              name,
              emoji,
              routineSlot: slot,
              frequency: freq,
              xpPerCompletion: parseInt(xp, 10) || 10,
            });
            setOpen(false);
            setName('');
            setEmoji('⭐');
          }}
        />
      </BottomSheet>
    </ThemedScene>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, marginBottom: 4 },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: palette.card,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  toolLabel: { color: spiritText.secondary, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  emojiWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: palette.cardAlt,
  },
  iconBtn: { padding: 4 },
  checkOuter: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cardAlt,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  name: { color: palette.text, fontSize: 14, fontWeight: '800' },
  sub: { color: spiritText.secondary, fontSize: 11, fontWeight: '700', marginTop: 2 },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
  fieldLabel: {
    color: spiritText.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.card,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  chipLabel: { color: spiritText.secondary, fontSize: 12, fontWeight: '800' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
