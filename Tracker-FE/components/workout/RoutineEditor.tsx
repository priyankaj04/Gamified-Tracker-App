import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { useTemplates } from '@/hooks/useTemplates';
import {
  useCreateRoutine,
  useUpdateRoutine,
  type Routine,
  type RoutineBody,
} from '@/hooks/useRoutines';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type DayConfig =
  | { kind: 'template'; templateId: string; templateName: string }
  | { kind: 'rest' }
  | { kind: 'free' };

interface Props {
  initial?: Routine;
}

export function RoutineEditor({ initial }: Props) {
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const create = useCreateRoutine();
  const update = useUpdateRoutine();
  const templatesQ = useTemplates();

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? false);
  const [isDeload, setIsDeload] = useState(initial?.isDeloadWeek ?? false);

  const buildInitialDays = (): DayConfig[] => {
    const out: DayConfig[] = Array.from({ length: 7 }, () => ({ kind: 'free' }));
    initial?.days.forEach((d) => {
      if (d.isRestDay) out[d.dayOfWeek] = { kind: 'rest' };
      else if (d.templateId)
        out[d.dayOfWeek] = {
          kind: 'template',
          templateId: d.templateId,
          templateName: d.templateName ?? 'Template',
        };
    });
    return out;
  };

  const [days, setDays] = useState<DayConfig[]>(buildInitialDays());
  const [pickerDay, setPickerDay] = useState<number | null>(null);

  const setDayKind = (dayIdx: number, cfg: DayConfig) => {
    setDays((cur) => cur.map((d, i) => (i === dayIdx ? cfg : d)));
  };

  const buildPayload = (): RoutineBody => ({
    name: name.trim(),
    description: description || undefined,
    isActive,
    isDeloadWeek: isDeload,
    days: days
      .map((d, i) => {
        if (d.kind === 'rest') return { dayOfWeek: i, isRestDay: true };
        if (d.kind === 'template') return { dayOfWeek: i, templateId: d.templateId };
        return null;
      })
      .filter(Boolean) as RoutineBody['days'],
  });

  const onSave = async () => {
    if (!name.trim()) return Alert.alert('Routine name required');
    const payload = buildPayload();
    try {
      if (initial) await update.mutateAsync({ id: initial.id, body: payload });
      else await create.mutateAsync(payload);
      router.back();
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not save routine');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 200 }}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Push / Pull / Legs"
          placeholderTextColor={palette.textDim}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, { height: 64, textAlignVertical: 'top' }]}
          multiline
          placeholderTextColor={palette.textDim}
        />

        <Pressable onPress={() => setIsActive((v) => !v)} style={styles.activeToggle}>
          <Ionicons
            name={isActive ? 'checkbox' : 'square-outline'}
            size={20}
            color={isActive ? accent : palette.textMuted}
          />
          <Text style={[styles.toggleLabel, isActive && { color: accent }]}>
            Make this my active routine
          </Text>
        </Pressable>

        <Pressable onPress={() => setIsDeload((v) => !v)} style={styles.activeToggle}>
          <Ionicons
            name={isDeload ? 'checkbox' : 'square-outline'}
            size={20}
            color={isDeload ? '#fbbf24' : palette.textMuted}
          />
          <Text style={[styles.toggleLabel, isDeload && { color: '#fbbf24' }]}>
            Deload week (reduce volume / intensity)
          </Text>
        </Pressable>

        <Text style={styles.label}>Weekly Plan</Text>
        <View style={{ gap: 8 }}>
          {DAYS.map((dayLabel, idx) => {
            const cfg = days[idx];
            return (
              <Pressable
                key={idx}
                onPress={() => setPickerDay(idx)}
                style={({ pressed }) => [styles.dayRow, pressed && { opacity: 0.7 }]}>
                <View style={[styles.dayBadge, { backgroundColor: accent + '22', borderColor: accent + '66' }]}>
                  <Text style={[styles.dayBadgeText, { color: accent }]}>{dayLabel}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  {cfg.kind === 'template' ? (
                    <>
                      <Text style={styles.dayTitle}>{cfg.templateName}</Text>
                      <Text style={styles.dayMeta}>Tap to change</Text>
                    </>
                  ) : cfg.kind === 'rest' ? (
                    <>
                      <Text style={styles.dayTitle}>🛌 Rest Day</Text>
                      <Text style={styles.dayMeta}>Counts toward streak</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.dayTitle, { color: palette.textMuted }]}>Free day</Text>
                      <Text style={styles.dayMeta}>Tap to assign a workout or rest</Text>
                    </>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 16 }} />
        <GlowButton
          title={initial ? 'Save changes' : 'Create routine'}
          color={accent}
          loading={create.isPending || update.isPending}
          onPress={onSave}
        />
      </ScrollView>

      <Modal
        visible={pickerDay != null}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerDay(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerDay(null)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>
            {pickerDay != null ? DAYS[pickerDay] : ''} — assign
          </Text>
          <ScrollView>
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                if (pickerDay != null) setDayKind(pickerDay, { kind: 'free' });
                setPickerDay(null);
              }}>
              <Text style={styles.sheetText}>— Free day —</Text>
            </Pressable>
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                if (pickerDay != null) setDayKind(pickerDay, { kind: 'rest' });
                setPickerDay(null);
              }}>
              <Text style={styles.sheetText}>🛌 Rest Day</Text>
            </Pressable>
            <View style={styles.sheetDivider} />
            <Text style={styles.sheetSection}>Templates</Text>
            {(templatesQ.data?.templates ?? []).map((t) => (
              <Pressable
                key={t.id}
                style={styles.sheetRow}
                onPress={() => {
                  if (pickerDay != null)
                    setDayKind(pickerDay, { kind: 'template', templateId: t.id, templateName: t.name });
                  setPickerDay(null);
                }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetText}>{t.name}</Text>
                  <Text style={styles.sheetMeta}>
                    {t.exercises.length} exercises · ~{t.estimatedMinutes} min
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={palette.textMuted} />
              </Pressable>
            ))}
            {(templatesQ.data?.templates ?? []).length === 0 && (
              <Text style={[styles.sheetMeta, { padding: 14 }]}>
                No templates yet. Create one from the Dojo header to assign it here.
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 4,
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
  activeToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  toggleLabel: { color: palette.textMuted, fontWeight: '700', fontSize: 14 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  dayBadge: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  dayBadgeText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  dayTitle: { color: palette.text, fontWeight: '700', fontSize: 14 },
  dayMeta: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: '70%', backgroundColor: palette.bgElevated,
    borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, paddingBottom: 24,
  },
  sheetTitle: {
    color: palette.text, fontWeight: '800', fontSize: 16, paddingHorizontal: 18, paddingVertical: 10,
  },
  sheetRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: palette.border,
  },
  sheetText: { color: palette.text, fontWeight: '700', fontSize: 14 },
  sheetMeta: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
  sheetSection: {
    color: palette.textMuted, fontWeight: '800', letterSpacing: 0.6,
    fontSize: 10, textTransform: 'uppercase', padding: 12, paddingHorizontal: 18,
  },
  sheetDivider: { height: 1, backgroundColor: palette.border, marginVertical: 4 },
});
