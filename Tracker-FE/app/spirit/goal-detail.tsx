import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { TrendLine } from '@/components/charts/TrendLine';
import { useArchiveGoal, useGoalLogs, useGoals, useLogGoalProgress } from '@/hooks/useGoals';

export default function GoalDetailScreen() {
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = String(params.id ?? '');

  const goals = useGoals();
  const logs = useGoalLogs(id);
  const logProgress = useLogGoalProgress();
  const archive = useArchiveGoal();

  const goal = goals.data?.find((g) => g.id === id);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  const winW = Dimensions.get('window').width;
  const series = useMemo(() => (logs.data ?? []).map((l) => l.value), [logs.data]);

  const refreshing = goals.isFetching || logs.isFetching;
  const onRefresh = () => {
    goals.refetch();
    logs.refetch();
  };

  if (!goal) {
    return (
      <ThemedScene scene="spirit">
        <View style={{ padding: 24 }}>
          <Text style={{ color: spiritText.secondary }}>Goal not found.</Text>
        </View>
      </ThemedScene>
    );
  }

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <SpiritHeader
          title={goal.title}
          subtitle={goal.type.toUpperCase()}
          accent={accent}
          accent2={accent2}
          back
          compact
        />
        <View style={{ paddingHorizontal: 20, paddingTop: 4 }}>
          <View style={styles.progressBg}>
            <View
              style={[styles.progressBar, { width: `${Math.round(goal.progressPct * 100)}%`, backgroundColor: accent }]}
            />
          </View>
          <Text style={styles.pct}>{Math.round(goal.progressPct * 100)}%</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Stat label="Start" v={goal.startValue} unit={goal.unit} />
            <Stat label="Current" v={goal.currentValue} unit={goal.unit} accent={accent} />
            <Stat label="Target" v={goal.targetValue} unit={goal.unit} accent={accent2} />
          </View>
          {goal.deadline && (
            <Text style={styles.deadline}>Deadline: {new Date(goal.deadline).toLocaleDateString()}</Text>
          )}
        </View>

        {series.length >= 2 && (
          <>
            <SectionTitle title="Progress Chart" accent={accent} />
            <View style={{ paddingHorizontal: 16 }}>
              <TrendLine values={series} color={accent} width={winW - 32} height={160} />
            </View>
          </>
        )}

        <SectionTitle title="History" accent={accent} />
        {logs.data && logs.data.length > 0 ? (
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {[...logs.data].reverse().map((l) => (
              <View key={l.id} style={styles.row}>
                <Text style={styles.date}>{new Date(l.date).toLocaleDateString()}</Text>
                <Text style={styles.val}>{l.value}{goal.unit ?? ''}</Text>
                {l.notes && <Text style={styles.notes}>{l.notes}</Text>}
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ color: spiritText.tertiary, paddingHorizontal: 20 }}>No progress logged yet</Text>
        )}

        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginTop: 20 }}>
          <GlowButton
            title="Archive"
            color={accent}
            variant="ghost"
            onPress={async () => {
              await archive.mutateAsync(id);
              router.back();
            }}
          />
        </View>
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

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Log Progress">
        <Text style={styles.fieldLabel}>Current value{goal.unit ? ` (${goal.unit})` : ''}</Text>
        <TextInput value={value} onChangeText={setValue} keyboardType="decimal-pad" style={styles.input} />
        <View style={{ height: 8 }} />
        <Text style={styles.fieldLabel}>Notes</Text>
        <TextInput value={notes} onChangeText={setNotes} style={styles.input} placeholderTextColor={spiritText.tertiary} />
        <View style={{ height: 14 }} />
        <GlowButton
          title="Save"
          color={accent}
          loading={logProgress.isPending}
          onPress={async () => {
            const v = parseFloat(value);
            if (isNaN(v)) return;
            await logProgress.mutateAsync({ id, body: { value: v, notes: notes || undefined } });
            setOpen(false);
            setValue('');
            setNotes('');
          }}
        />
      </BottomSheet>
    </ThemedScene>
  );
}

function Stat({ label, v, unit, accent }: { label: string; v: number | null; unit: string | null; accent?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: palette.card, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: palette.border }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statVal, { color: accent ?? palette.text }]}>
        {v != null ? `${v}${unit ?? ''}` : '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  type: { color: spiritText.secondary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { color: palette.text, fontSize: 24, fontWeight: '900', marginTop: 6, marginBottom: 12 },
  progressBg: { height: 10, borderRadius: 6, backgroundColor: palette.cardAlt, marginTop: 4 },
  progressBar: { height: 10, borderRadius: 6 },
  pct: { color: palette.text, fontWeight: '900', fontSize: 22, marginTop: 6 },
  deadline: { color: spiritText.secondary, fontSize: 12, marginTop: 8, fontWeight: '700' },
  statLabel: { color: spiritText.secondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  statVal: { fontWeight: '900', fontSize: 16, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  date: { color: spiritText.secondary, fontSize: 12, fontWeight: '800', width: 90 },
  val: { color: palette.text, fontSize: 14, fontWeight: '900' },
  notes: { color: spiritText.secondary, fontSize: 12, flex: 1 },
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
