import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { palette, screenTheme } from '@/lib/themes';
import {
  useRecoveryLogs,
  useUpsertRecovery,
  type Soreness,
} from '@/hooks/useRecovery';

const MUSCLES = [
  'Chest','Back','Shoulders','Biceps','Triceps','Forearms','Core',
  'Quads','Hamstrings','Glutes','Calves',
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

const todayISO = () => new Date().toISOString().split('T')[0];

export function RecoverySheet({ visible, onClose }: Props) {
  const accent = screenTheme.dojo.accent;
  const today = todayISO();
  const upsert = useUpsertRecovery();
  const logs = useRecoveryLogs({ from: today, to: today });
  const existing = logs.data?.logs?.[0];

  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [soreness, setSoreness] = useState<Soreness>({});
  const [notes, setNotes] = useState('');

  // Hydrate from existing log when sheet opens.
  useEffect(() => {
    if (!visible) return;
    if (existing) {
      setSleepHours(existing.sleepHours != null ? String(existing.sleepHours) : '');
      setSleepQuality(existing.sleepQuality);
      setEnergy(existing.energyLevel);
      setSoreness(existing.soreness ?? {});
      setNotes(existing.notes ?? '');
    } else {
      setSleepHours('');
      setSleepQuality(null);
      setEnergy(null);
      setSoreness({});
      setNotes('');
    }
  }, [visible, existing?.id]);

  const onSave = async () => {
    await upsert.mutateAsync({
      date: today,
      sleepHours: sleepHours ? parseFloat(sleepHours) : null,
      sleepQuality,
      energyLevel: energy,
      soreness,
      notes: notes || null,
    });
    onClose();
  };

  const setSorenessFor = (muscle: string, value: number | null) => {
    setSoreness((cur) => {
      const next = { ...cur };
      if (value == null || cur[muscle] === value) delete next[muscle];
      else next[muscle] = value;
      return next;
    });
  };

  const ratedCount = Object.keys(soreness).length;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Log Recovery">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={{ maxHeight: 600 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Sleep (hours)</Text>
          <TextInput
            value={sleepHours}
            onChangeText={(v) => setSleepHours(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="e.g. 7.5"
            placeholderTextColor={palette.textDim}
          />

          <Text style={styles.label}>Sleep Quality</Text>
          <ScaleRow value={sleepQuality} onChange={setSleepQuality} accent={accent} />

          <Text style={styles.label}>Energy Level</Text>
          <ScaleRow value={energy} onChange={setEnergy} accent={accent} />

          <View style={styles.sorenessHead}>
            <Text style={styles.label}>Soreness</Text>
            <Text style={styles.ratedCount}>
              {ratedCount} of {MUSCLES.length} rated
            </Text>
          </View>
          <Text style={styles.hint}>1 = none · 5 = very sore</Text>
          <View style={{ gap: 6 }}>
            {MUSCLES.map((m) => (
              <MuscleSorenessRow
                key={m}
                muscle={m}
                value={soreness[m]}
                onChange={(v) => setSorenessFor(m, v)}
                accent={accent}
              />
            ))}
          </View>

          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            multiline
            placeholder="Anything notable…"
            placeholderTextColor={palette.textDim}
          />

          <View style={{ height: 16 }} />
          <GlowButton title="Save" color={accent} loading={upsert.isPending} onPress={onSave} />
          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

function ScaleRow({
  value,
  onChange,
  accent,
  small,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  accent: string;
  small?: boolean;
}) {
  return (
    <View style={[styles.scaleRow, small && { gap: 4 }]}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value === n;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(active ? null : n)}
            style={[
              small ? styles.scaleBtnSm : styles.scaleBtn,
              active && { backgroundColor: accent + '22', borderColor: accent },
            ]}>
            <Text style={[small ? styles.scaleTextSm : styles.scaleText, active && { color: accent }]}>
              {n}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MuscleSorenessRow({
  muscle,
  value,
  onChange,
  accent,
}: {
  muscle: string;
  value: number | undefined;
  onChange: (v: number | null) => void;
  accent: string;
}) {
  return (
    <View style={[styles.muscleRow, value != null && { borderColor: accent + '88', backgroundColor: accent + '10' }]}>
      <Text style={[styles.muscleName, value != null && { color: accent }]} numberOfLines={1}>
        {muscle}
      </Text>
      <ScaleRow value={value ?? null} onChange={onChange} accent={accent} small />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 6,
  },
  hint: { color: palette.textDim, fontSize: 11, marginBottom: 6 },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
  scaleRow: { flexDirection: 'row', gap: 6 },
  scaleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  scaleBtnSm: {
    width: 30,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  scaleText: { color: palette.textMuted, fontWeight: '800' },
  scaleTextSm: { color: palette.textMuted, fontWeight: '800', fontSize: 11 },
  sorenessHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  ratedCount: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  muscleName: { color: palette.text, fontSize: 13, fontWeight: '700', flex: 1 },
});
