import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { DatePicker, todayISO } from '@/components/ui/DatePicker';
import { MeasurementCard } from '@/components/spirit/MeasurementCard';
import { EmptyState } from '@/components/layout/EmptyState';

import {
  useLatestMeasurement,
  useLogMeasurement,
  useMeasurements,
  useMeasurementsStats,
} from '@/hooks/useSpirit';

const FIELDS: { key: string; label: string }[] = [
  { key: 'chestCm', label: 'Chest' },
  { key: 'waistCm', label: 'Waist' },
  { key: 'hipsCm', label: 'Hips' },
  { key: 'bicepsCm', label: 'Biceps' },
  { key: 'thighsCm', label: 'Thighs' },
  { key: 'neckCm', label: 'Neck' },
  { key: 'shouldersCm', label: 'Shoulders' },
  { key: 'calvesCm', label: 'Calves' },
  { key: 'forearmsCm', label: 'Forearms' },
];

export default function MeasurementsScreen() {
  const accent = screenTheme.spirit.accent;
  const router = useRouter();

  const latest = useLatestMeasurement();
  const all = useMeasurements();
  const stats = useMeasurementsStats();
  const log = useLogMeasurement();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [values, setValues] = useState<Record<string, string>>({});

  const refreshing = latest.isFetching || all.isFetching || stats.isFetching;
  const onRefresh = () => {
    latest.refetch();
    all.refetch();
    stats.refetch();
  };

  const totalLost = stats.data?.totalLost ?? {};
  const totalLostSum = Object.values(totalLost).reduce((s, n) => s + (n > 0 ? n : 0), 0);

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <SpiritHeader title="Measurements" subtitle="Body" accent={accent} back compact />

        {/* Summary card */}
        <View style={styles.summary}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Total Lost</Text>
            <Text style={[styles.summaryValue, { color: accent }]}>
              {totalLostSum > 0 ? totalLostSum.toFixed(1) : '0.0'} <Text style={styles.unit}>cm</Text>
            </Text>
          </View>
          {stats.data?.waistToHipRatio && (
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.summaryLabel}>Waist-Hip Ratio</Text>
              <Text style={[styles.summaryValue, { color: accent }]}>
                {stats.data.waistToHipRatio}
              </Text>
              <Text style={styles.subText}>{stats.data.waistToHipCategory}</Text>
            </View>
          )}
        </View>

        {all.data && all.data.length >= 2 && (
          <Pressable
            onPress={() => router.push('/spirit/measurement-compare')}
            style={({ pressed }) => [styles.compareBtn, pressed && { opacity: 0.85 }]}>
            <Ionicons name="git-compare" size={16} color={accent} />
            <Text style={[styles.compareLabel, { color: accent }]}>Compare two dates</Text>
            <Ionicons name="chevron-forward" size={14} color={accent} />
          </Pressable>
        )}

        {/* Grid of latest measurements */}
        <SectionTitle title="Latest" accent={accent} />
        {latest.data ? (
          <View style={styles.grid}>
            {FIELDS.map((f) => (
              <MeasurementCard
                key={f.key}
                label={f.label}
                value={(latest.data as any)?.[f.key] ?? null}
                trend={(stats.data?.trend as any)?.[f.key]}
                accent={accent}
              />
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="resize"
              title="No measurements yet"
              message="Tap + to log your first measurements."
              accent={accent}
            />
          </View>
        )}

        {/* History */}
        {all.data && all.data.length > 1 && (
          <>
            <SectionTitle title="History" accent={accent} />
            <View style={{ paddingHorizontal: 20, gap: 8 }}>
              {all.data.map((m) => (
                <View key={m.id} style={styles.histRow}>
                  <Text style={styles.histDate}>{new Date(m.date).toLocaleDateString()}</Text>
                  <Text style={styles.histText}>
                    {m.waistCm ? `Waist ${m.waistCm} ` : ''}
                    {m.chestCm ? `· Chest ${m.chestCm} ` : ''}
                    {m.hipsCm ? `· Hips ${m.hipsCm}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <Pressable
        onPress={() => setSheetOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: accent, shadowColor: accent },
          pressed && { opacity: 0.85 },
        ]}>
        <Ionicons name="add" size={28} color="#0b0b14" />
      </Pressable>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Log Measurements">
        <ScrollView style={{ maxHeight: 540 }}>
          <Field label="Date">
            <DatePicker value={date} onChange={setDate} accent={accent} />
          </Field>
          {FIELDS.map((f) => (
            <Field key={f.key} label={`${f.label} (cm)`}>
              <TextInput
                value={values[f.key] ?? ''}
                onChangeText={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                keyboardType="decimal-pad"
                style={styles.input}
                placeholderTextColor={spiritText.tertiary}
              />
            </Field>
          ))}
        </ScrollView>
        <View style={{ height: 10 }} />
        <GlowButton
          title="Save"
          color={accent}
          loading={log.isPending}
          onPress={async () => {
            const body: any = { date };
            FIELDS.forEach((f) => {
              const v = values[f.key];
              if (v && !isNaN(parseFloat(v))) body[f.key] = parseFloat(v);
            });
            await log.mutateAsync(body);
            setSheetOpen(false);
            setValues({});
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
  summary: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
  },
  summaryLabel: {
    color: spiritText.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryValue: { fontSize: 26, fontWeight: '900', marginTop: 4, letterSpacing: -0.5 },
  unit: { fontSize: 12, color: spiritText.secondary },
  subText: { color: spiritText.secondary, fontSize: 11, fontWeight: '700' },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  compareLabel: { flex: 1, fontSize: 13, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  histDate: { color: spiritText.secondary, fontSize: 12, fontWeight: '800', width: 90 },
  histText: { color: palette.text, fontSize: 13, fontWeight: '700', flex: 1 },
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
