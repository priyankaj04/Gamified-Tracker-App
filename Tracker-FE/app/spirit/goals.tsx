import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { GoalRing } from '@/components/spirit/GoalRing';
import { EmptyState } from '@/components/layout/EmptyState';
import { AnimatedCard } from '@/components/spirit/AnimatedCard';
import { SpiritDatePicker as DatePicker, todayISO } from '@/components/spirit/SpiritDatePicker';
import { useArchivedGoals, useCreateGoal, useGoals } from '@/hooks/useGoals';
import type { SpiritGoalType } from '@/types';

export default function GoalsScreen() {
  const accent = screenTheme.spirit.accent;
  const router = useRouter();

  const active = useGoals();
  const archived = useArchivedGoals();
  const create = useCreateGoal();

  const [open, setOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<SpiritGoalType>('numeric');
  const [unit, setUnit] = useState('');
  const [startVal, setStartVal] = useState('');
  const [targetVal, setTargetVal] = useState('');
  const [deadline, setDeadline] = useState('');

  const refreshing = active.isFetching || archived.isFetching;
  const onRefresh = () => {
    active.refetch();
    archived.refetch();
  };

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <SpiritHeader title="Goals" subtitle="What you're training toward" accent={accent} back compact />

        <SectionTitle title="Active" accent={accent} />
        {active.data && active.data.length > 0 ? (
          <View style={styles.grid}>
            {active.data.map((g, i) => (
              <AnimatedCard key={g.id} index={i} style={{ width: '48%' }}>
                <GoalRing
                  progress={g.progressPct}
                  title={g.title}
                  subtitle={g.targetValue ? `→ ${g.targetValue}${g.unit ?? ''}` : undefined}
                  color={accent}
                  completed={g.completed}
                  onPress={() =>
                    router.push({ pathname: '/spirit/goal-detail', params: { id: g.id } })
                  }
                />
              </AnimatedCard>
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="flag"
              title="No goals yet"
              message="Set your first goal, Shinobi. What are you training toward?"
              accent={accent}
            />
          </View>
        )}

        {archived.data && archived.data.length > 0 && (
          <Pressable
            onPress={() => setShowArchived((v) => !v)}
            style={{ paddingHorizontal: 20, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name={showArchived ? 'chevron-down' : 'chevron-forward'} size={16} color={spiritText.secondary} />
            <Text style={{ color: spiritText.secondary, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' }}>
              Completed / Archived ({archived.data.length})
            </Text>
          </Pressable>
        )}
        {showArchived && archived.data && (
          <View style={[styles.grid, { opacity: 0.7 }]}>
            {archived.data.map((g) => (
              <View key={g.id} style={{ width: '48%' }}>
                <GoalRing
                  progress={g.progressPct}
                  title={g.title}
                  subtitle={g.completedAt ? new Date(g.completedAt).toLocaleDateString() : undefined}
                  color={spiritText.secondary}
                  completed
                />
              </View>
            ))}
          </View>
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

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="New Goal">
        <ScrollView style={{ maxHeight: 480 }}>
          <Field label="Title">
            <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholderTextColor={spiritText.tertiary} />
          </Field>
          <Field label="Type">
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {(['numeric', 'reduction', 'habit', 'milestone'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[styles.chip, type === t && { borderColor: accent, backgroundColor: accent + '22' }]}>
                  <Text style={[styles.chipLabel, type === t && { color: accent }]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          </Field>
          <Field label="Unit (kg, cm, reps...)">
            <TextInput value={unit} onChangeText={setUnit} style={styles.input} placeholderTextColor={spiritText.tertiary} />
          </Field>
          {type !== 'milestone' && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Field label="Start">
                  <TextInput value={startVal} onChangeText={setStartVal} keyboardType="decimal-pad" style={styles.input} />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Target">
                  <TextInput value={targetVal} onChangeText={setTargetVal} keyboardType="decimal-pad" style={styles.input} />
                </Field>
              </View>
            </View>
          )}
          <Field label="Deadline">
            <DatePicker value={deadline || todayISO()} onChange={setDeadline} accent={accent} />
          </Field>
        </ScrollView>
        <View style={{ height: 12 }} />
        <GlowButton
          title="Save"
          color={accent}
          loading={create.isPending}
          onPress={async () => {
            if (!title) return;
            await create.mutateAsync({
              title,
              type,
              unit: unit || undefined,
              startValue: startVal ? parseFloat(startVal) : undefined,
              targetValue: targetVal ? parseFloat(targetVal) : undefined,
              currentValue: startVal ? parseFloat(startVal) : undefined,
              deadline: deadline || undefined,
            });
            setOpen(false);
            setTitle('');
            setUnit('');
            setStartVal('');
            setTargetVal('');
            setDeadline('');
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, justifyContent: 'space-between' },
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
