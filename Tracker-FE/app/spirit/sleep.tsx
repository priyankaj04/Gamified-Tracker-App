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
import { StatCard } from '@/components/ui/StatCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { TrendLine } from '@/components/charts/TrendLine';
import { EmptyState } from '@/components/layout/EmptyState';
import { SpiritDatePicker as DatePicker, todayISO } from '@/components/spirit/SpiritDatePicker';
import { useSleep, useSleepGoal, useSleepStats, useLogSleep, useDeleteSleep } from '@/hooks/useSleep';

export default function SleepScreen() {
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;

  const logs = useSleep();
  const goal = useSleepGoal();
  const stats = useSleepStats();
  const logSleep = useLogSleep();
  const del = useDeleteSleep();

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [bedtime, setBedtime] = useState('22:30');
  const [wake, setWake] = useState('06:30');
  const [quality, setQuality] = useState(4);
  const [notes, setNotes] = useState('');

  const winW = Dimensions.get('window').width;
  const series = useMemo(() => [...(logs.data ?? [])].reverse().map((s) => Number(s.durationHours ?? 0)), [logs.data]);
  const labels = useMemo(() => [...(logs.data ?? [])].reverse().map((s) => s.date.slice(5)), [logs.data]);

  const refreshing = logs.isFetching || stats.isFetching;
  const onRefresh = () => {
    logs.refetch();
    stats.refetch();
    goal.refetch();
  };

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <SpiritHeader title="Sleep" subtitle="Rest · Recovery" accent={accent} accent2={accent2} back compact />

        <View style={styles.statsRow}>
          <StatCard label="Avg Duration" value={stats.data?.avgDuration7d != null ? `${stats.data.avgDuration7d}h` : '—'} accent={accent} />
          <StatCard label="Avg Quality" value={stats.data?.avgQuality7d != null ? `${stats.data.avgQuality7d}/5` : '—'} accent={accent2} />
          <StatCard label="Streak" value={stats.data?.currentStreak ?? 0} accent={accent} />
        </View>

        {stats.data?.sleepDebt7d != null && stats.data.sleepDebt7d > 0 && (
          <View style={[styles.debt, { borderColor: palette.warning }]}>
            <Ionicons name="alert-circle" size={18} color={palette.warning} />
            <Text style={styles.debtText}>You owe {stats.data.sleepDebt7d} hr this week</Text>
          </View>
        )}

        <SectionTitle title="Duration (14 days)" accent={accent} />
        <View style={{ paddingHorizontal: 16 }}>
          <TrendLine
            values={series.slice(-14)}
            labels={labels.slice(-14)}
            color={accent}
            width={winW - 32}
            height={180}
            valueFormatter={(v) => `${v.toFixed(1)} hr`}
          />
        </View>

        <SectionTitle title="Log" accent={accent} />
        {logs.data && logs.data.length > 0 ? (
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {logs.data.map((s) => (
              <View key={s.id} style={styles.row}>
                <Text style={styles.date}>{new Date(s.date).toLocaleDateString()}</Text>
                <Text style={styles.duration}>{s.durationHours} h</Text>
                {s.quality && (
                  <View style={styles.stars}>
                    {Array.from({ length: s.quality }).map((_, i) => (
                      <Ionicons key={i} name="star" size={11} color={accent2} />
                    ))}
                  </View>
                )}
                <Pressable onPress={() => del.mutate(s.id)} hitSlop={8}>
                  <Ionicons name="trash" size={14} color={spiritText.tertiary} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="moon" title="No sleep logged yet" message="Tap + to log last night." accent={accent} />
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

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Log Sleep">
        <Field label="Date (wake day)">
          <DatePicker value={date} onChange={setDate} accent={accent} />
        </Field>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field label="Bedtime (HH:MM)">
              <TextInput value={bedtime} onChangeText={setBedtime} style={styles.input} placeholderTextColor={spiritText.tertiary} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Wake (HH:MM)">
              <TextInput value={wake} onChangeText={setWake} style={styles.input} placeholderTextColor={spiritText.tertiary} />
            </Field>
          </View>
        </View>
        <Field label="Quality">
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => setQuality(n)}
                style={[styles.dot, quality >= n && { backgroundColor: accent2, borderColor: accent2 }]}>
                <Text style={[styles.dotLabel, quality >= n && { color: '#0b0b14' }]}>{n}</Text>
              </Pressable>
            ))}
          </View>
        </Field>
        <Field label="Notes">
          <TextInput value={notes} onChangeText={setNotes} style={styles.input} placeholderTextColor={spiritText.tertiary} />
        </Field>
        <View style={{ height: 14 }} />
        <GlowButton
          title="Save"
          color={accent}
          loading={logSleep.isPending}
          onPress={async () => {
            // bedtime is the previous day if HH:MM > 12
            const wakeDate = new Date(`${date}T${wake}:00`);
            const bed = new Date(`${date}T${bedtime}:00`);
            if (bed.getTime() > wakeDate.getTime()) bed.setDate(bed.getDate() - 1);
            await logSleep.mutateAsync({
              date,
              bedtime: bed.toISOString(),
              wakeTime: wakeDate.toISOString(),
              quality,
              notes: notes || undefined,
            });
            setOpen(false);
            setNotes('');
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
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  debt: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
  },
  debtText: { color: palette.text, fontSize: 13, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  date: { color: spiritText.secondary, fontSize: 12, fontWeight: '800', width: 100 },
  duration: { color: palette.text, fontSize: 14, fontWeight: '900', flex: 1 },
  stars: { flexDirection: 'row', gap: 2 },
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
  dot: {
    flex: 1,
    aspectRatio: 1.2,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: { color: palette.text, fontWeight: '900', fontSize: 13 },
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
