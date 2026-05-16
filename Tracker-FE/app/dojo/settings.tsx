import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { palette, screenTheme } from '@/lib/themes';
import { useSettings, useUpdateSettings, type UserSettings } from '@/hooks/useSettings';
import { PlateCalculator } from '@/components/workout/PlateCalculator';
import { syncDojoReminders } from '@/lib/notifications';

export default function DojoSettings() {
  const accent = screenTheme.dojo.accent;
  const { data } = useSettings();
  const update = useUpdateSettings();

  const [local, setLocal] = useState<UserSettings | null>(null);
  useEffect(() => {
    if (data) setLocal(data);
  }, [data]);

  if (!local) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: palette.textMuted }}>Loading…</Text>
      </View>
    );
  }

  const patch = (p: Partial<UserSettings>) => {
    const next = { ...local, ...p };
    setLocal(next);
    update.mutate(p, {
      onSuccess: (saved) => {
        syncDojoReminders({
          workoutReminderEnabled: saved.workoutReminderEnabled,
          reminderHour: saved.reminderHour,
          reminderMinute: saved.reminderMinute,
          streakAtRiskEnabled: saved.streakAtRiskEnabled,
          weeklySummaryEnabled: saved.weeklySummaryEnabled,
        }).catch(() => {});
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.section}>Units</Text>
      <View style={styles.card}>
        <Segment
          label="Weight"
          options={[
            { v: 'kg', label: 'kg' },
            { v: 'lbs', label: 'lbs' },
          ]}
          value={local.weightUnit}
          onChange={(v) => patch({ weightUnit: v as any })}
          accent={accent}
        />
        <Segment
          label="Distance"
          options={[
            { v: 'km', label: 'km' },
            { v: 'mi', label: 'mi' },
          ]}
          value={local.distanceUnit}
          onChange={(v) => patch({ distanceUnit: v as any })}
          accent={accent}
        />
      </View>

      <Text style={styles.section}>Rest Timer</Text>
      <View style={styles.card}>
        <Row
          label="Default rest"
          right={
            <View style={styles.numInputWrap}>
              <TextInput
                value={String(local.defaultRestSeconds)}
                onChangeText={(v) => {
                  const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
                  if (!Number.isNaN(n)) patch({ defaultRestSeconds: n });
                  else setLocal({ ...local, defaultRestSeconds: 0 });
                }}
                keyboardType="numeric"
                style={styles.numInput}
              />
              <Text style={styles.unit}>s</Text>
            </View>
          }
        />
        <Row
          label="Auto-start after set"
          right={
            <Switch
              value={local.autoStartRest}
              onValueChange={(v) => patch({ autoStartRest: v })}
              trackColor={{ true: accent, false: palette.cardAlt }}
            />
          }
        />
      </View>

      <Text style={styles.section}>Formulas</Text>
      <View style={styles.card}>
        <Segment
          label="Estimated 1RM"
          options={[
            { v: 'Epley', label: 'Epley' },
            { v: 'Brzycki', label: 'Brzycki' },
            { v: 'Lander', label: 'Lander' },
          ]}
          value={local.oneRmFormula}
          onChange={(v) => patch({ oneRmFormula: v as any })}
          accent={accent}
        />
        <Segment
          label="Week starts"
          options={[
            { v: 'mon', label: 'Mon' },
            { v: 'sun', label: 'Sun' },
          ]}
          value={local.weekStartsMonday ? 'mon' : 'sun'}
          onChange={(v) => patch({ weekStartsMonday: v === 'mon' })}
          accent={accent}
        />
      </View>

      <Text style={styles.section}>Barbell</Text>
      <View style={styles.card}>
        <Row
          label="Bar weight"
          right={
            <View style={styles.numInputWrap}>
              <TextInput
                value={String(local.barbellWeightKg)}
                onChangeText={(v) => {
                  const n = parseFloat(v.replace(/[^0-9.]/g, ''));
                  if (!Number.isNaN(n)) patch({ barbellWeightKg: n });
                  else setLocal({ ...local, barbellWeightKg: 0 });
                }}
                keyboardType="decimal-pad"
                style={styles.numInput}
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          }
        />
      </View>

      <Text style={styles.section}>Notifications</Text>
      <View style={styles.card}>
        <Row
          label="Daily workout reminder"
          right={
            <Switch
              value={local.workoutReminderEnabled}
              onValueChange={(v) => patch({ workoutReminderEnabled: v })}
              trackColor={{ true: accent, false: palette.cardAlt }}
            />
          }
        />
        {local.workoutReminderEnabled && (
          <Row
            label="Time"
            right={
              <View style={styles.numInputWrap}>
                <TextInput
                  value={String(local.reminderHour).padStart(2, '0')}
                  onChangeText={(v) => {
                    const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
                    if (!Number.isNaN(n) && n >= 0 && n <= 23) patch({ reminderHour: n });
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  style={[styles.numInput, { minWidth: 44 }]}
                />
                <Text style={styles.unit}>:</Text>
                <TextInput
                  value={String(local.reminderMinute).padStart(2, '0')}
                  onChangeText={(v) => {
                    const n = parseInt(v.replace(/[^0-9]/g, ''), 10);
                    if (!Number.isNaN(n) && n >= 0 && n <= 59) patch({ reminderMinute: n });
                  }}
                  keyboardType="numeric"
                  maxLength={2}
                  style={[styles.numInput, { minWidth: 44 }]}
                />
              </View>
            }
          />
        )}
        <Row
          label="Streak-at-risk alert"
          right={
            <Switch
              value={local.streakAtRiskEnabled}
              onValueChange={(v) => patch({ streakAtRiskEnabled: v })}
              trackColor={{ true: accent, false: palette.cardAlt }}
            />
          }
        />
        <Row
          label="Sunday weekly summary"
          right={
            <Switch
              value={local.weeklySummaryEnabled}
              onValueChange={(v) => patch({ weeklySummaryEnabled: v })}
              trackColor={{ true: accent, false: palette.cardAlt }}
            />
          }
        />
      </View>

      <Text style={styles.section}>Tools</Text>
      <PlateCalculator
        barbellKg={local.barbellWeightKg}
        unitLabel="kg"
        accent={accent}
      />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
    </View>
  );
}

function Segment<T extends string>({
  label,
  options,
  value,
  onChange,
  accent,
}: {
  label: string;
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accent: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.segWrap}>
        {options.map((opt) => {
          const active = value === opt.v;
          return (
            <Pressable
              key={opt.v}
              onPress={() => onChange(opt.v)}
              style={[styles.segBtn, active && { backgroundColor: accent + '22', borderColor: accent }]}>
              <Text style={[styles.segText, active && { color: accent }]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: palette.text, fontWeight: '700', fontSize: 14 },
  segWrap: {
    flexDirection: 'row',
    backgroundColor: palette.cardAlt,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  segBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segText: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
  numInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  numInput: {
    backgroundColor: palette.cardAlt,
    color: palette.text,
    borderRadius: 8,
    padding: 8,
    minWidth: 70,
    textAlign: 'right',
    fontWeight: '900',
  },
  unit: { color: palette.textMuted, fontWeight: '700', fontSize: 12 },
});
