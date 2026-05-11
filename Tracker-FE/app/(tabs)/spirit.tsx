import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { TrendLine } from '@/components/charts/TrendLine';
import { EmptyState } from '@/components/layout/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { DatePicker, todayISO } from '@/components/ui/DatePicker';
import { useWeight, useLogWeight } from '@/hooks/useWeight';

export default function SpiritScreen() {
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;
  const { data, isFetching, refetch } = useWeight();
  const logWeight = useLogWeight();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [bf, setBf] = useState('');
  const [waist, setWaist] = useState('');
  const [notes, setNotes] = useState('');
  const [entryDate, setEntryDate] = useState(todayISO());

  const [accordionOpen, setAccordionOpen] = useState(false);

  const entries = data?.entries ?? [];
  const goal = data?.goal;
  const progressPct = data?.progressPct ?? 0;
  const latest = entries[0];

  const trend = useMemo(() => [...entries].reverse().map((e) => Number(e.weightKg)), [entries]);

  const winW = Dimensions.get('window').width;

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />
        }>
        <PageHeader
          title="Spirit"
          subtitle="Inner Chakra"
          accent={accent}
          accent2={accent2}
          right={<Ionicons name="pulse" size={26} color={accent} />}
        />

        <SectionTitle title="Goal Progress" accent={accent} />
        <View style={styles.goalCard}>
          <ProgressRing
            progress={progressPct}
            color={accent}
            size={150}
            centerValue={`${Math.round(progressPct * 100)}%`}
            label="Goal"
          />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.goalLabel}>Current</Text>
            <Text style={styles.goalValue}>
              {latest ? `${latest.weightKg} kg` : '— kg'}
            </Text>
            <Text style={styles.goalLabel}>Target</Text>
            <Text style={[styles.goalValue, { color: accent2 }]}>
              {goal ? `${goal.targetWeightKg} kg` : '— kg'}
            </Text>
          </View>
        </View>

        <SectionTitle title="Trend (30 days)" accent={accent} />
        <View style={{ paddingHorizontal: 16 }}>
          <TrendLine
            values={trend.slice(-30)}
            color={accent}
            width={winW - 32}
            height={160}
          />
        </View>

        <SectionTitle title="Log" accent={accent} />
        {entries.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="scale"
              title="No weight entries yet"
              message="Tap + to log your first weigh-in."
              accent={accent}
            />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {entries.slice(0, 20).map((e, i) => {
              const prev = entries[i + 1];
              const delta = prev ? Number(e.weightKg) - Number(prev.weightKg) : 0;
              const down = delta < 0;
              return (
                <View key={e.id} style={styles.entryRow}>
                  <Text style={styles.entryDate}>{new Date(e.date).toLocaleDateString()}</Text>
                  <Text style={styles.entryWeight}>{e.weightKg} kg</Text>
                  {prev && (
                    <View style={[styles.deltaPill, { backgroundColor: (down ? accent : palette.danger) + '22' }]}>
                      <Ionicons
                        name={down ? 'arrow-down' : 'arrow-up'}
                        size={11}
                        color={down ? accent : palette.danger}
                      />
                      <Text
                        style={{
                          color: down ? accent : palette.danger,
                          fontSize: 11,
                          fontWeight: '800',
                        }}>
                        {Math.abs(delta).toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <SectionTitle
          title="Measurements"
          accent={accent}
          right={
            <Pressable onPress={() => setAccordionOpen((v) => !v)} hitSlop={8}>
              <Ionicons
                name={accordionOpen ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={palette.textMuted}
              />
            </Pressable>
          }
        />
        {accordionOpen && latest && (
          <View style={styles.measGrid}>
            <Measure label="Chest" v={latest.chestCm} accent={accent} />
            <Measure label="Waist" v={latest.waistCm} accent={accent} />
            <Measure label="Hips" v={latest.hipsCm} accent={accent} />
            <Measure label="Biceps" v={latest.bicepsCm} accent={accent} />
            <Measure label="Thighs" v={latest.thighsCm} accent={accent} />
            <Measure label="BF%" v={latest.bodyFatPct} unit="%" accent={accent} />
          </View>
        )}

        <View style={{ height: 100 }} />
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

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Log Weight">
        <Field label="Date">
          <DatePicker value={entryDate} onChange={setEntryDate} accent={accent} />
        </Field>
        <Field label="Weight (kg)">
          <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" style={styles.input} placeholderTextColor={palette.textDim} />
        </Field>
        <Field label="Body Fat %">
          <TextInput value={bf} onChangeText={setBf} keyboardType="decimal-pad" style={styles.input} placeholderTextColor={palette.textDim} />
        </Field>
        <Field label="Waist (cm)">
          <TextInput value={waist} onChangeText={setWaist} keyboardType="decimal-pad" style={styles.input} placeholderTextColor={palette.textDim} />
        </Field>
        <Field label="Notes">
          <TextInput value={notes} onChangeText={setNotes} style={styles.input} placeholderTextColor={palette.textDim} />
        </Field>
        <View style={{ height: 14 }} />
        <GlowButton
          title="Save"
          color={accent}
          loading={logWeight.isPending}
          onPress={async () => {
            const w = parseFloat(weight);
            if (!w) return;
            await logWeight.mutateAsync({
              weightKg: w,
              date: entryDate,
              bodyFatPct: bf ? parseFloat(bf) : undefined,
              waistCm: waist ? parseFloat(waist) : undefined,
              notes: notes || undefined,
            });
            setSheetOpen(false);
            setEntryDate(todayISO());
            setWeight('');
            setBf('');
            setWaist('');
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

function Measure({ label, v, unit = 'cm', accent }: { label: string; v: number | null; unit?: string; accent: string }) {
  return (
    <View style={styles.measCell}>
      <Text style={styles.measLabel}>{label}</Text>
      <Text style={[styles.measVal, { color: v != null ? accent : palette.textDim }]}>
        {v != null ? `${v} ${unit}` : '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 18,
  },
  goalLabel: { color: palette.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  goalValue: { color: palette.text, fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
  },
  entryDate: { color: palette.textMuted, fontSize: 12, fontWeight: '700', flex: 1 },
  entryWeight: { color: palette.text, fontWeight: '800', fontSize: 15 },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  measGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  measCell: {
    flexGrow: 1,
    minWidth: '30%',
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  measLabel: { color: palette.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  measVal: { fontWeight: '900', fontSize: 16, marginTop: 4 },
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
  fieldLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.6, textTransform: 'uppercase' },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
});
