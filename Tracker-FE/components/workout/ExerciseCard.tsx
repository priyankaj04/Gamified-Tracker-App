import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { palette } from '@/lib/themes';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useLastSet } from '@/hooks/useExercises';
import type { SetType } from '@/types';

export interface SetDraft {
  id: string;
  setType: SetType;
  reps: string;
  weightKg: string;
  durationSeconds?: string;
  completed: boolean;
}

export interface ExerciseDraft {
  id: string;
  exerciseId?: string;
  name: string;
  musclePrimary?: string;
  equipment?: string;
  notes?: string;
  sets: SetDraft[];
}

export interface ExercisePR {
  bestWeightKg: number | null;
  bestReps: number | null;
}

interface Props {
  draft: ExerciseDraft;
  index: number;
  isActive: boolean;
  accent?: string;
  pr?: ExercisePR;
  onUpdate: (next: ExerciseDraft) => void;
  onRemove: () => void;
  onSwap?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onCompleteSet?: (setIndex: number) => void;
}

const SET_TYPES: { value: SetType; label: string; full: string; description: string; color: string }[] = [
  { value: 'Normal',  label: 'N', full: 'Normal',   description: 'Standard working set',                color: '#a78bfa' },
  { value: 'Warmup',  label: 'W', full: 'Warm-up',  description: 'Light prep — excluded from volume & PR', color: '#fbbf24' },
  { value: 'DropSet', label: 'D', full: 'Drop set', description: 'Lower the weight, keep going',         color: '#22d3ee' },
  { value: 'Failure', label: 'F', full: 'Failure',  description: 'Pushed to muscular failure',           color: '#ef4444' },
  { value: 'AMRAP',   label: 'A', full: 'AMRAP',    description: 'As many reps as possible',             color: '#4ade80' },
];

const newSet = (setType: SetType = 'Normal'): SetDraft => ({
  id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  setType,
  reps: '',
  weightKg: '',
  completed: false,
});

// A working set is a PR if its weight is higher than the prior best weight,
// OR equal weight + more reps.
const setIsPr = (reps: number, weight: number, pr?: ExercisePR): boolean => {
  if (!pr || pr.bestWeightKg == null) return weight > 0 && reps > 0;
  const bestW = pr.bestWeightKg;
  const bestR = pr.bestReps ?? 0;
  if (weight > bestW) return true;
  if (weight === bestW && reps > bestR) return true;
  return false;
};

export function ExerciseCard({
  draft,
  index,
  isActive,
  accent = '#f97316',
  pr,
  onUpdate,
  onRemove,
  onSwap,
  onMoveUp,
  onMoveDown,
  onCompleteSet,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const lastSet = useLastSet({ exerciseId: draft.exerciseId, name: draft.name });
  const last = lastSet.data?.last ?? null;

  const updateSet = (i: number, patch: Partial<SetDraft>) => {
    onUpdate({
      ...draft,
      sets: draft.sets.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    });
  };

  const [typePickerFor, setTypePickerFor] = useState<number | null>(null);

  const addSet = () => {
    const lastDraft = draft.sets[draft.sets.length - 1];
    const cloned = newSet(lastDraft?.setType ?? 'Normal');
    if (lastDraft) {
      cloned.reps = lastDraft.reps;
      cloned.weightKg = lastDraft.weightKg;
    }
    onUpdate({ ...draft, sets: [...draft.sets, cloned] });
  };

  const removeSet = (i: number) => {
    onUpdate({ ...draft, sets: draft.sets.filter((_, idx) => idx !== i) });
  };

  return (
    <View style={[styles.card, { borderColor: palette.border }]}>
      <Pressable onPress={() => setExpanded((v) => !v)} style={styles.head}>
        <View style={[styles.badge, { backgroundColor: accent + '22', borderColor: accent + '66' }]}>
          <Text style={[styles.badgeText, { color: accent }]}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.exName} numberOfLines={1}>
            {draft.name}
          </Text>
          {(draft.musclePrimary || draft.equipment || last) && (
            <Text style={styles.exMeta} numberOfLines={1}>
              {draft.musclePrimary}
              {draft.equipment ? ` · ${draft.equipment}` : ''} · {draft.sets.length} set
              {draft.sets.length === 1 ? '' : 's'}
              {last ? `  ·  Last: ${last.weightKg}kg × ${last.reps}` : ''}
            </Text>
          )}
        </View>
        {onMoveUp && (
          <Pressable onPress={onMoveUp} hitSlop={6} style={styles.iconBtn}>
            <Ionicons name="chevron-up" size={18} color={palette.textMuted} />
          </Pressable>
        )}
        {onMoveDown && (
          <Pressable onPress={onMoveDown} hitSlop={6} style={styles.iconBtn}>
            <Ionicons name="chevron-down" size={18} color={palette.textMuted} />
          </Pressable>
        )}
        {onSwap && (
          <Pressable onPress={onSwap} hitSlop={6} style={styles.iconBtn}>
            <Ionicons name="swap-horizontal" size={18} color={palette.textMuted} />
          </Pressable>
        )}
        <Pressable onPress={onRemove} hitSlop={6} style={styles.iconBtn}>
          <Ionicons name="close" size={20} color={palette.textDim} />
        </Pressable>
      </Pressable>

      {expanded && (
        <View style={{ gap: 6 }}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCol, { width: 36 }]}>SET</Text>
            <Text style={[styles.headerCol, { flex: 1 }]}>REPS</Text>
            <Text style={[styles.headerCol, { flex: 1 }]}>KG</Text>
            <View style={{ width: 36 }} />
          </View>

          {draft.sets.map((s, i) => {
            const setMeta = SET_TYPES.find((t) => t.value === s.setType) ?? SET_TYPES[0];
            const reps = parseInt(s.reps, 10) || 0;
            const weight = parseFloat(s.weightKg) || 0;
            const isPrCandidate =
              s.setType !== 'Warmup' && setIsPr(reps, weight, pr);
            return (
              <SetRow
                key={s.id}
                set={s}
                setMeta={setMeta}
                accent={accent}
                isActive={isActive}
                isPrCandidate={isPrCandidate}
                onChangeType={() => setTypePickerFor(i)}
                onChangeReps={(v) => updateSet(i, { reps: v })}
                onChangeWeight={(v) => updateSet(i, { weightKg: v })}
                onToggleComplete={() => {
                  const next = !s.completed;
                  updateSet(i, { completed: next });
                  if (next) onCompleteSet?.(i);
                }}
                onDelete={() => removeSet(i)}
              />
            );
          })}

          <Pressable onPress={addSet} style={[styles.addSet, { borderColor: accent + '55' }]}>
            <Ionicons name="add" size={16} color={accent} />
            <Text style={[styles.addSetText, { color: accent }]}>Add set</Text>
          </Pressable>
        </View>
      )}

      <BottomSheet
        visible={typePickerFor != null}
        onClose={() => setTypePickerFor(null)}
        title="Set type">
        <View style={{ gap: 6, paddingBottom: 12 }}>
          {SET_TYPES.map((t) => {
            const isCurrent = typePickerFor != null && draft.sets[typePickerFor]?.setType === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => {
                  if (typePickerFor != null) updateSet(typePickerFor, { setType: t.value });
                  setTypePickerFor(null);
                }}
                style={[
                  styles.typeOption,
                  { borderColor: isCurrent ? t.color : palette.border, backgroundColor: isCurrent ? t.color + '18' : palette.card },
                ]}>
                <View style={[styles.typeOptionBadge, { borderColor: t.color + '99', backgroundColor: t.color + '22' }]}>
                  <Text style={[styles.typeOptionBadgeText, { color: t.color }]}>{t.label}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.typeOptionName, isCurrent && { color: t.color }]}>{t.full}</Text>
                  <Text style={styles.typeOptionDesc}>{t.description}</Text>
                </View>
                {isCurrent && <Ionicons name="checkmark" size={18} color={t.color} />}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>
    </View>
  );
}

interface SetRowProps {
  set: SetDraft;
  setMeta: { value: SetType; label: string; color: string };
  accent: string;
  isActive: boolean;
  isPrCandidate: boolean;
  onChangeType: () => void;
  onChangeReps: (v: string) => void;
  onChangeWeight: (v: string) => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}

function SetRow({
  set,
  setMeta,
  accent,
  isActive,
  isPrCandidate,
  onChangeType,
  onChangeReps,
  onChangeWeight,
  onToggleComplete,
  onDelete,
}: SetRowProps) {
  const flash = useSharedValue(0);
  const scale = useSharedValue(1);

  // PR flash when completing a PR-candidate working set.
  useEffect(() => {
    if (set.completed && isPrCandidate) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      flash.value = withSequence(
        withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) }),
      );
      scale.value = withSequence(
        withSpring(1.06, { damping: 9, stiffness: 220 }),
        withSpring(1, { damping: 11, stiffness: 200 }),
      );
    }
  }, [set.completed, isPrCandidate, flash, scale]);

  const rowStyle = useAnimatedStyle(() => ({
    backgroundColor: set.completed
      ? `rgba(74,222,128,${0.08 + flash.value * 0.25})`
      : `rgba(249,115,22,${flash.value * 0.25})`,
    borderColor: set.completed
      ? `rgba(74,222,128,${1 - flash.value * 0.4})`
      : `rgba(249,115,22,${flash.value})`,
    transform: [{ scale: scale.value }],
  }));

  const renderRightActions = () => (
    <RectButton style={styles.swipeDelete} onPress={onDelete}>
      <Ionicons name="trash" size={20} color="#fff" />
    </RectButton>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={48}
      onSwipeableOpen={onDelete}>
      <Animated.View style={[styles.setRow, rowStyle]}>
        <Pressable
          onPress={onChangeType}
          style={[
            styles.typeBtn,
            { borderColor: setMeta.color + '99', backgroundColor: setMeta.color + '22' },
          ]}>
          <Text style={[styles.typeBtnText, { color: setMeta.color }]}>{setMeta.label}</Text>
        </Pressable>
        <TextInput
          value={set.reps}
          onChangeText={(v) => onChangeReps(v.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={palette.textDim}
          style={styles.input}
        />
        <TextInput
          value={set.weightKg}
          onChangeText={(v) => onChangeWeight(v.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={palette.textDim}
          style={styles.input}
        />
        {isPrCandidate && !set.completed && (
          <View style={styles.prTag}>
            <Ionicons name="trophy" size={11} color="#fbbf24" />
          </View>
        )}
        {isActive ? (
          <Pressable onPress={onToggleComplete} hitSlop={6} style={styles.checkBtn}>
            <Ionicons
              name={set.completed ? 'checkmark-circle' : 'ellipse-outline'}
              size={26}
              color={set.completed ? '#4ade80' : palette.textDim}
            />
          </Pressable>
        ) : (
          <Pressable onPress={onDelete} hitSlop={6} style={styles.checkBtn}>
            <Ionicons name="remove-circle-outline" size={22} color={palette.textDim} />
          </Pressable>
        )}
      </Animated.View>
    </Swipeable>
  );
}

export const createExerciseDraft = (input: {
  exerciseId?: string;
  name: string;
  musclePrimary?: string;
  equipment?: string;
  sets?: { reps?: number | null; weightKg?: number | null; setType?: SetType }[];
}): ExerciseDraft => ({
  id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  exerciseId: input.exerciseId,
  name: input.name,
  musclePrimary: input.musclePrimary,
  equipment: input.equipment,
  sets:
    input.sets && input.sets.length > 0
      ? input.sets.map((s, i) => ({
          id: `s-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
          setType: s.setType ?? 'Normal',
          reps: s.reps != null ? String(s.reps) : '',
          weightKg: s.weightKg != null ? String(s.weightKg) : '',
          completed: false,
        }))
      : [newSet()],
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.cardAlt,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '900' },
  exName: { color: palette.text, fontWeight: '800', fontSize: 15 },
  exMeta: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
  iconBtn: { padding: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  headerCol: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeBtn: {
    width: 36, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  typeBtnText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },
  input: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  prTag: {
    paddingHorizontal: 4,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtn: { width: 36, alignItems: 'center', justifyContent: 'center' },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addSetText: { fontWeight: '800', fontSize: 12, letterSpacing: 0.3 },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeOptionBadge: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  typeOptionBadgeText: { fontSize: 14, fontWeight: '900' },
  typeOptionName: { color: palette.text, fontSize: 15, fontWeight: '800' },
  typeOptionDesc: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
  swipeDelete: {
    width: 64,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
});
