import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { SpiritDatePicker as DatePicker, todayISO } from '@/components/spirit/SpiritDatePicker';
import { AnimatedCard } from '@/components/spirit/AnimatedCard';
import { EmptyState } from '@/components/layout/EmptyState';
import {
  useCycles,
  useCyclePrediction,
  useStartCycle,
  useUpdateCycle,
  useDeleteCycle,
} from '@/hooks/useCycle';
import type { CycleLog } from '@/types';

const ACCENT = '#f43f5e';

export default function CycleScreen() {
  const accent = ACCENT;
  const accent2 = screenTheme.spirit.accent;

  const list = useCycles();
  const prediction = useCyclePrediction();
  const start = useStartCycle();
  const update = useUpdateCycle();
  const del = useDeleteCycle();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CycleLog | null>(null);
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState<string | ''>('');

  useEffect(() => {
    if (editing) {
      setStartDate(editing.startDate);
      setEndDate(editing.endDate ?? '');
    } else {
      setStartDate(todayISO());
      setEndDate('');
    }
  }, [editing]);

  const refreshing = list.isFetching || prediction.isFetching;
  const onRefresh = () => {
    list.refetch();
    prediction.refetch();
  };

  const openSheet = (cycle?: CycleLog) => {
    setEditing(cycle ?? null);
    setOpen(true);
  };

  const closeSheet = () => {
    setOpen(false);
    setEditing(null);
  };

  const onSave = async () => {
    if (!startDate) return;
    try {
      if (editing) {
        await update.mutateAsync({
          id: editing.id,
          body: { startDate, endDate: endDate || undefined },
        });
      } else {
        await start.mutateAsync({
          startDate,
          endDate: endDate || undefined,
        });
      }
      closeSheet();
    } catch (e: any) {
      Alert.alert('Could not save', e?.message ?? 'Try again');
    }
  };

  const onDelete = (id: string) => {
    Alert.alert('Delete this period?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await del.mutateAsync(id);
          closeSheet();
        },
      },
    ]);
  };

  const pred = prediction.data;
  const formatDay = (iso: string) =>
    new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

  const periodLength = (c: CycleLog) => {
    if (!c.endDate) return null;
    const a = new Date(c.startDate + 'T00:00:00Z').getTime();
    const b = new Date(c.endDate + 'T00:00:00Z').getTime();
    return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
  };

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 120 }}>
        <SpiritHeader title="Cycle" subtitle="Period log · Prediction" accent={accent} back compact />

        {/* Prediction card */}
        <AnimatedCard index={0}>
          <View style={styles.predictionCard}>
            <LinearGradient
              colors={[accent + '33', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.predLabel}>Next Period</Text>
            {pred?.nextPeriodStart ? (
              <>
                <Text style={[styles.predDate, { color: '#ffffff', textShadowColor: accent }]}>
                  {formatDay(pred.nextPeriodStart)}
                </Text>
                <Text style={styles.predSub}>
                  {pred.daysUntil != null && pred.daysUntil > 0
                    ? `in ${pred.daysUntil} day${pred.daysUntil === 1 ? '' : 's'}`
                    : pred.daysUntil === 0
                    ? 'expected today'
                    : `${Math.abs(pred.daysUntil ?? 0)} day${
                        Math.abs(pred.daysUntil ?? 0) === 1 ? '' : 's'
                      } overdue`}
                </Text>
                <Text style={styles.predMeta}>
                  Avg cycle {pred.averageCycleLength}d · {pred.sampleSize} logged
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.predDate, { color: spiritText.secondary }]}>—</Text>
                <Text style={styles.predSub}>Log a period to start predicting</Text>
              </>
            )}
          </View>
        </AnimatedCard>

        <SectionTitle
          title="History"
          accent={accent}
          right={
            <Pressable onPress={() => openSheet()} hitSlop={8}>
              <Ionicons name="add-circle" size={22} color={accent} />
            </Pressable>
          }
        />

        {list.data && list.data.length > 0 ? (
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {list.data.map((c, i) => {
              const len = periodLength(c);
              return (
                <AnimatedCard key={c.id} index={1 + i}>
                  <Pressable onPress={() => openSheet(c)} style={styles.row}>
                    <View style={[styles.dot, { backgroundColor: accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowDate}>
                        {formatDay(c.startDate)}
                        {c.endDate ? ` → ${formatDay(c.endDate)}` : ' · ongoing'}
                      </Text>
                      <Text style={styles.rowSub}>
                        {len ? `${len} day${len === 1 ? '' : 's'}` : 'No end date'}
                        {c.cycleLength ? ` · cycle ${c.cycleLength}d` : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={spiritText.tertiary} />
                  </Pressable>
                </AnimatedCard>
              );
            })}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="ellipse"
              title="No periods logged yet"
              message="Tap + to log when your last period started and ended."
              accent={accent}
            />
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => openSheet()}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: accent, shadowColor: accent },
          pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        ]}>
        <Ionicons name="add" size={28} color="#0b0b14" />
      </Pressable>

      <BottomSheet
        visible={open}
        onClose={closeSheet}
        title={editing ? 'Edit period' : 'Log period'}>
        <Field label="Start date">
          <DatePicker value={startDate} onChange={setStartDate} accent={accent} />
        </Field>
        <Field label="End date (optional)">
          <DatePicker value={endDate || todayISO()} onChange={setEndDate} accent={accent} />
          {endDate && (
            <Pressable onPress={() => setEndDate('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={14} color={spiritText.secondary} />
              <Text style={styles.clearLabel}>Clear end date</Text>
            </Pressable>
          )}
        </Field>
        <View style={{ height: 14 }} />
        <GlowButton
          title={editing ? 'Update' : 'Save'}
          color={accent}
          loading={start.isPending || update.isPending}
          onPress={onSave}
        />
        {editing && (
          <Pressable onPress={() => onDelete(editing.id)} style={styles.deleteLink}>
            <Ionicons name="trash" size={14} color={palette.danger} />
            <Text style={styles.deleteLabel}>Delete entry</Text>
          </Pressable>
        )}
      </BottomSheet>
    </ThemedScene>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  predictionCard: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 20,
    backgroundColor: palette.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: ACCENT + '55',
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  predLabel: {
    color: spiritText.secondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  predDate: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 6,
    textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 1 },
  },
  predSub: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  predMeta: {
    color: spiritText.secondary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.card,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  rowDate: { color: palette.text, fontSize: 14, fontWeight: '800' },
  rowSub: { color: spiritText.secondary, fontSize: 12, fontWeight: '700', marginTop: 2 },
  fieldLabel: {
    color: spiritText.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearLabel: { color: spiritText.secondary, fontSize: 11, fontWeight: '700' },
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  deleteLabel: { color: palette.danger, fontSize: 12, fontWeight: '800' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
