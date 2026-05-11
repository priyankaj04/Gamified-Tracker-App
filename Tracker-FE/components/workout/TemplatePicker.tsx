import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { palette, screenTheme } from '@/lib/themes';
import { useTemplates } from '@/hooks/useTemplates';
import { createExerciseDraft, type ExerciseDraft } from '@/components/workout/ExerciseCard';
import type { TemplateExercise } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercises: ExerciseDraft[]) => void;
}

// `templateId:exerciseIndex` is unique across all expanded templates.
const keyOf = (tplId: string, idx: number) => `${tplId}:${idx}`;

export function TemplatePicker({ visible, onClose, onSelect }: Props) {
  const accent = screenTheme.dojo.accent;
  const templates = useTemplates();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [picked, setPicked] = useState<Set<string>>(new Set());

  // Reset selection when sheet closes.
  React.useEffect(() => {
    if (!visible) {
      setExpanded(new Set());
      setPicked(new Set());
    }
  }, [visible]);

  const list = templates.data?.templates ?? [];

  const togglePick = (k: string) => {
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const pickAllInTemplate = (tplId: string, count: number) => {
    setPicked((cur) => {
      const next = new Set(cur);
      const allKeys = Array.from({ length: count }, (_, i) => keyOf(tplId, i));
      const allSelected = allKeys.every((k) => next.has(k));
      if (allSelected) allKeys.forEach((k) => next.delete(k));
      else allKeys.forEach((k) => next.add(k));
      return next;
    });
  };

  const pickedDrafts = useMemo<ExerciseDraft[]>(() => {
    const out: ExerciseDraft[] = [];
    list.forEach((tpl) => {
      tpl.exercises.forEach((te, i) => {
        if (!picked.has(keyOf(tpl.id, i))) return;
        out.push(toExerciseDraft(te));
      });
    });
    return out;
  }, [list, picked]);

  const onConfirm = () => {
    if (pickedDrafts.length === 0) {
      onClose();
      return;
    }
    onSelect(pickedDrafts);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add from Template">
      <Text style={styles.hint}>
        Tap a template to expand. Pick exercises (or the whole template) to add them to today&apos;s workout.
      </Text>
      <ScrollView style={{ maxHeight: 460 }} keyboardShouldPersistTaps="handled">
        {list.length === 0 && (
          <Text style={{ color: palette.textMuted, padding: 14, fontSize: 13 }}>
            {templates.isFetching ? 'Loading…' : 'No templates yet. Create one in Dojo → Templates.'}
          </Text>
        )}
        {list.map((tpl) => {
          const open = expanded.has(tpl.id);
          const pickedInTpl = tpl.exercises.reduce(
            (n, _, i) => (picked.has(keyOf(tpl.id, i)) ? n + 1 : n),
            0,
          );
          const total = tpl.exercises.length;
          const allSelected = total > 0 && pickedInTpl === total;
          return (
            <View key={tpl.id} style={[styles.tplCard, { borderColor: palette.border }]}>
              <Pressable
                onPress={() => {
                  setExpanded((cur) => {
                    const next = new Set(cur);
                    if (next.has(tpl.id)) next.delete(tpl.id);
                    else next.add(tpl.id);
                    return next;
                  });
                }}
                style={styles.tplHead}>
                <Ionicons
                  name={open ? 'chevron-down' : 'chevron-forward'}
                  size={16}
                  color={palette.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tplName} numberOfLines={1}>
                    {tpl.name}
                  </Text>
                  <Text style={styles.tplMeta}>
                    {tpl.exercises.length} exercise{tpl.exercises.length === 1 ? '' : 's'}
                    {pickedInTpl > 0 ? `  ·  ${pickedInTpl} picked` : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={() => pickAllInTemplate(tpl.id, total)}
                  hitSlop={8}
                  style={[
                    styles.allBtn,
                    { borderColor: allSelected ? accent : palette.border, backgroundColor: allSelected ? accent + '22' : 'transparent' },
                  ]}>
                  <Text style={[styles.allBtnText, { color: allSelected ? accent : palette.textMuted }]}>
                    {allSelected ? 'All ✓' : 'All'}
                  </Text>
                </Pressable>
              </Pressable>

              {open && (
                <View style={styles.exList}>
                  {tpl.exercises.map((te, i) => {
                    const k = keyOf(tpl.id, i);
                    const isPicked = picked.has(k);
                    return (
                      <Pressable
                        key={k}
                        onPress={() => togglePick(k)}
                        style={[
                          styles.exRow,
                          isPicked && { backgroundColor: accent + '15', borderColor: accent + '66' },
                        ]}>
                        <Ionicons
                          name={isPicked ? 'checkbox' : 'square-outline'}
                          size={18}
                          color={isPicked ? accent : palette.textMuted}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.exName}>{te.exerciseName ?? 'Exercise'}</Text>
                          <Text style={styles.exMeta} numberOfLines={1}>
                            {[te.musclePrimary, te.equipment, `${te.sets.length} sets`]
                              .filter(Boolean)
                              .join(' · ')}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={{ height: 12 }} />
      <GlowButton
        title={pickedDrafts.length > 0 ? `Add ${pickedDrafts.length} exercise${pickedDrafts.length === 1 ? '' : 's'}` : 'Done'}
        color={accent}
        onPress={onConfirm}
      />
      <View style={{ height: 16 }} />
    </BottomSheet>
  );
}

const toExerciseDraft = (te: TemplateExercise): ExerciseDraft =>
  createExerciseDraft({
    exerciseId: te.exerciseId,
    name: te.exerciseName ?? 'Exercise',
    musclePrimary: te.musclePrimary,
    equipment: te.equipment,
    sets: te.sets.map((s) => ({
      reps: s.targetReps,
      weightKg: s.targetWeightKg,
      setType: s.setType,
    })),
  });

const styles = StyleSheet.create({
  hint: { color: palette.textMuted, fontSize: 12, paddingHorizontal: 4, paddingBottom: 8 },
  tplCard: {
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
    overflow: 'hidden',
  },
  tplHead: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  tplName: { color: palette.text, fontWeight: '800', fontSize: 14 },
  tplMeta: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
  allBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  allBtnText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  exList: { paddingHorizontal: 12, paddingBottom: 10, gap: 6 },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.cardAlt,
  },
  exName: { color: palette.text, fontSize: 13, fontWeight: '700' },
  exMeta: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
});
