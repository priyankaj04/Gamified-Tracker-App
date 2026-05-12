import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { EmptyState } from '@/components/layout/EmptyState';
import { XPBadge } from '@/components/gamification/XPBadge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { SpiritDatePicker as DatePicker, todayISO } from '@/components/spirit/SpiritDatePicker';
import { StatCard } from '@/components/ui/StatCard';
import { WeightChart } from '@/components/spirit/WeightChart';

import { useWeight, useLogWeight, useUpdateWeight, useDeleteWeight } from '@/hooks/useWeight';
import { useWeightStats } from '@/hooks/useSpirit';
import { SwipeRow } from '@/components/spirit/SwipeRow';
import type { WeightEntry } from '@/types';

export default function WeightLogScreen() {
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;

  const { data, isFetching, refetch } = useWeight();
  const stats = useWeightStats();
  const logWeight = useLogWeight();
  const updateWeight = useUpdateWeight();
  const deleteWeight = useDeleteWeight();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<WeightEntry | null>(null);
  const [weight, setWeight] = useState('');
  const [bf, setBf] = useState('');
  const [notes, setNotes] = useState('');
  const [entryDate, setEntryDate] = useState(todayISO());
  const [range, setRange] = useState<'30D' | '90D' | '1Y'>('30D');

  const openSheet = (entry?: WeightEntry) => {
    if (entry) {
      setEditing(entry);
      setEntryDate(entry.date);
      setWeight(String(entry.weightKg));
      setBf(entry.bodyFatPct != null ? String(entry.bodyFatPct) : '');
      setNotes(entry.notes ?? '');
    } else {
      setEditing(null);
      setEntryDate(todayISO());
      setWeight('');
      setBf('');
      setNotes('');
    }
    setSheetOpen(true);
  };

  const entries = data?.entries ?? [];
  const goal = data?.goal;
  const progress = data?.progressPct ?? 0;

  const w = Dimensions.get('window').width;
  const series = useMemo(() => {
    const sorted = [...entries].reverse();
    const cutoffDays = range === '30D' ? 30 : range === '90D' ? 90 : 365;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - cutoffDays);
    return sorted.filter((e) => new Date(e.date) >= cutoff).map((e) => Number(e.weightKg));
  }, [entries, range]);

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <SpiritHeader title="Weight" subtitle="Body · Spirit" accent={accent} accent2={accent2} back compact />

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Current" value={stats.data?.currentWeight ? `${stats.data.currentWeight}kg` : '—'} accent={accent} />
          <StatCard label="Start" value={stats.data?.startWeight ? `${stats.data.startWeight}kg` : '—'} accent={accent2} />
          <StatCard label="Goal" value={goal ? `${goal.targetWeightKg}kg` : '—'} accent={accent} />
        </View>
        <View style={[styles.statsRow, { marginTop: 8 }]}>
          <StatCard
            label="Change"
            value={stats.data?.totalChange != null ? `${stats.data.totalChange > 0 ? '+' : ''}${stats.data.totalChange}kg` : '—'}
            accent={(stats.data?.totalChange ?? 0) <= 0 ? accent : palette.danger}
          />
          <StatCard
            label="BMI"
            value={stats.data?.bmi ? `${stats.data.bmi}` : '—'}
            trend={
              stats.data?.bmiCategory
                ? { value: stats.data.bmiCategory, up: stats.data.bmiCategory !== 'Normal' }
                : undefined
            }
            accent={accent2}
          />
        </View>

        {/* Trend chart */}
        <SectionTitle title="Trend" accent={accent} />
        <View style={styles.rangeRow}>
          {(['30D', '90D', '1Y'] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              style={[styles.rangeBtn, range === r && { backgroundColor: accent + '22', borderColor: accent }]}>
              <Text style={[styles.rangeLabel, range === r && { color: accent }]}>{r}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <WeightChart
            values={series}
            color={accent}
            width={w - 32}
            height={200}
            idealMin={stats.data?.idealRange?.minKg}
            idealMax={stats.data?.idealRange?.maxKg}
          />
        </View>

        {/* Goal progress */}
        {goal && (
          <>
            <SectionTitle title="Goal Progress" accent={accent} />
            <View style={styles.goalCard}>
              <View style={styles.progressBg}>
                <View style={[styles.progressBar, { width: `${Math.round(progress * 100)}%`, backgroundColor: accent }]} />
              </View>
              <Text style={styles.progressLabel}>
                {Math.round(progress * 100)}% toward {goal.targetWeightKg}kg
              </Text>
              {stats.data?.projectedCompletionDate && (
                <Text style={styles.eta}>
                  On track for {new Date(stats.data.projectedCompletionDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </>
        )}

        {/* Entries */}
        <SectionTitle title="Log" accent={accent} />
        {entries.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="scale" title="No weight entries yet" message="Tap + to log your first weigh-in." accent={accent} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {entries.slice(0, 60).map((e, i) => {
              const prev = entries[i + 1];
              const delta = prev ? Number(e.weightKg) - Number(prev.weightKg) : 0;
              const down = delta < 0;
              return (
                <SwipeRow
                  key={e.id}
                  onTap={() => openSheet(e)}
                  onDelete={() => deleteWeight.mutate(e.id)}>
                  <View style={styles.entryRow}>
                    <Text style={styles.entryDate}>{new Date(e.date).toLocaleDateString()}</Text>
                    <Text style={styles.entryWeight}>{e.weightKg} kg</Text>
                    {e.bmi != null && <Text style={styles.entryBmi}>BMI {e.bmi}</Text>}
                    {prev && (
                      <View
                        style={[
                          styles.deltaPill,
                          { backgroundColor: (down ? accent : palette.danger) + '22' },
                        ]}>
                        <Ionicons
                          name={down ? 'arrow-down' : 'arrow-up'}
                          size={11}
                          color={down ? accent : palette.danger}
                        />
                        <Text style={{ color: down ? accent : palette.danger, fontSize: 11, fontWeight: '800' }}>
                          {Math.abs(delta).toFixed(1)}
                        </Text>
                      </View>
                    )}
                    <XPBadge amount={e.xpEarned} color={accent} />
                    <Ionicons name="chevron-forward" size={14} color={spiritText.tertiary} />
                  </View>
                </SwipeRow>
              );
            })}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <Pressable
        onPress={() => openSheet()}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: accent, shadowColor: accent },
          pressed && { opacity: 0.85 },
        ]}>
        <Ionicons name="add" size={28} color="#0b0b14" />
      </Pressable>

      <BottomSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? 'Edit Weight' : 'Log Weight'}>
        <Field label="Date">
          <DatePicker value={entryDate} onChange={setEntryDate} accent={accent} />
        </Field>
        <Field label="Weight (kg)">
          <TextInput
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholderTextColor={spiritText.tertiary}
          />
        </Field>
        <Field label="Body Fat %">
          <TextInput
            value={bf}
            onChangeText={setBf}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholderTextColor={spiritText.tertiary}
          />
        </Field>
        <Field label="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={styles.input}
            placeholderTextColor={spiritText.tertiary}
          />
        </Field>
        <View style={{ height: 14 }} />
        <GlowButton
          title={editing ? 'Update' : 'Save'}
          color={accent}
          loading={logWeight.isPending || updateWeight.isPending}
          onPress={async () => {
            const v = parseFloat(weight);
            if (!v) return;
            if (editing) {
              await updateWeight.mutateAsync({
                id: editing.id,
                body: {
                  weightKg: v,
                  bodyFatPct: bf ? parseFloat(bf) : undefined,
                  notes: notes || undefined,
                },
              });
            } else {
              await logWeight.mutateAsync({
                weightKg: v,
                date: entryDate,
                bodyFatPct: bf ? parseFloat(bf) : undefined,
                notes: notes || undefined,
              });
            }
            setSheetOpen(false);
            setEditing(null);
            setEntryDate(todayISO());
            setWeight('');
            setBf('');
            setNotes('');
          }}
        />
        {editing && (
          <Pressable
            onPress={async () => {
              await deleteWeight.mutateAsync(editing.id);
              setSheetOpen(false);
              setEditing(null);
            }}
            style={styles.deleteLink}>
            <Ionicons name="trash" size={14} color={palette.danger} />
            <Text style={styles.deleteLinkLabel}>Delete entry</Text>
          </Pressable>
        )}
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
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  rangeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  rangeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  rangeLabel: { color: spiritText.secondary, fontSize: 12, fontWeight: '800' },
  goalCard: {
    marginHorizontal: 20,
    backgroundColor: palette.card,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 8,
  },
  progressBg: { height: 8, borderRadius: 6, backgroundColor: palette.cardAlt },
  progressBar: { height: 8, borderRadius: 6 },
  progressLabel: { color: palette.text, fontSize: 13, fontWeight: '800' },
  eta: { color: spiritText.secondary, fontSize: 12 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.bgElevated,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  entryDate: { color: spiritText.secondary, fontSize: 12, fontWeight: '700', flex: 1 },
  entryWeight: { color: palette.text, fontWeight: '800', fontSize: 15 },
  entryBmi: { color: spiritText.secondary, fontSize: 11, fontWeight: '700' },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
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
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  deleteLinkLabel: { color: palette.danger, fontSize: 12, fontWeight: '800' },
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
