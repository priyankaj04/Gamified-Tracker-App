import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { palette, priorityColor } from '@/lib/themes';
import { RecurrencePicker } from './RecurrencePicker';
import { DifficultyPicker } from './DifficultyPicker';
import { TagPicker } from './TagPicker';
import { useCreateQuest } from '@/hooks/useQuests';
import type { Priority, QuestDifficulty, Recurrence } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  accent: string;
  defaultPriority?: Priority;
}

const PRIORITIES: Priority[] = ['S', 'A', 'B', 'C'];

export function QuestCreateSheet({ visible, onClose, accent, defaultPriority = 'C' }: Props) {
  const create = useCreateQuest();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>(defaultPriority);
  const [difficulty, setDifficulty] = useState<QuestDifficulty | null>(null);
  const [recurrence, setRecurrence] = useState<Recurrence>(null);
  const [isBoss, setIsBoss] = useState(false);
  const [estimated, setEstimated] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');

  useEffect(() => {
    if (!visible) return;
    setTitle('');
    setDescription('');
    setNotes('');
    setPriority(defaultPriority);
    setDifficulty(null);
    setRecurrence(null);
    setIsBoss(false);
    setEstimated('');
    setDueDate(null);
    setTagIds([]);
    setSteps([]);
    setNewStep('');
  }, [visible, defaultPriority]);

  const handleSave = async () => {
    if (!title.trim()) return;
    await create.mutateAsync({
      title: title.trim(),
      description: description.trim() || null,
      notes: notes.trim() || undefined,
      priority,
      difficulty,
      recurrence,
      isBoss,
      isDaily: recurrence?.kind === 'daily',
      dueDate,
      estimatedMinutes: estimated ? Number(estimated) : null,
      tagIds,
      steps: steps.length ? steps : undefined,
    });
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="New Quest">
      <ScrollView style={{ maxHeight: 560 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What's the quest?"
          placeholderTextColor={palette.textDim}
          style={styles.input}
        />

        <Text style={styles.label}>Priority</Text>
        <View style={styles.prioRow}>
          {PRIORITIES.map((p) => {
            const active = priority === p;
            const c = priorityColor[p];
            return (
              <Pressable
                key={p}
                onPress={() => setPriority(p)}
                style={[
                  styles.prioBtn,
                  active && { backgroundColor: c + '22', borderColor: c },
                ]}>
                <Text style={[styles.prioText, active && { color: c }]}>{p}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Difficulty</Text>
        <DifficultyPicker value={difficulty} onChange={setDifficulty} accent={accent} />

        <Text style={styles.label}>Recurrence</Text>
        <RecurrencePicker value={recurrence} onChange={setRecurrence} accent={accent} />

        <Text style={styles.label}>Due Date</Text>
        <View style={styles.row}>
          {([
            { lbl: 'None', val: null },
            { lbl: 'Today', val: new Date().toISOString().slice(0, 10) },
            { lbl: 'Tomorrow', val: new Date(Date.now() + 86400000).toISOString().slice(0, 10) },
            { lbl: 'Next week', val: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) },
          ] as const).map((opt) => {
            const active = dueDate === opt.val;
            return (
              <Pressable
                key={opt.lbl}
                onPress={() => setDueDate(opt.val)}
                style={[styles.chip, active && { borderColor: accent, backgroundColor: accent + '22' }]}>
                <Text style={[styles.chipTxt, active && { color: accent }]}>{opt.lbl}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Tags</Text>
        <TagPicker value={tagIds} onChange={setTagIds} accent={accent} />

        <Text style={styles.label}>Estimated minutes</Text>
        <TextInput
          value={estimated}
          onChangeText={(v) => setEstimated(v.replace(/[^0-9]/g, ''))}
          placeholder="e.g. 30"
          placeholderTextColor={palette.textDim}
          keyboardType="number-pad"
          style={styles.input}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="(optional)"
          placeholderTextColor={palette.textDim}
          style={[styles.input, { minHeight: 60 }]}
          multiline
        />

        <Text style={styles.label}>Subtasks</Text>
        <View style={{ gap: 6 }}>
          {steps.map((s, i) => (
            <View key={i} style={styles.stepRow}>
              <Ionicons name="square-outline" size={20} color={palette.textMuted} />
              <Text style={styles.stepLbl}>{s}</Text>
              <Pressable onPress={() => setSteps(steps.filter((_, idx) => idx !== i))} hitSlop={6}>
                <Ionicons name="close" size={16} color={palette.textMuted} />
              </Pressable>
            </View>
          ))}
          <View style={styles.stepAddRow}>
            <TextInput
              value={newStep}
              onChangeText={setNewStep}
              placeholder="Add subtask..."
              placeholderTextColor={palette.textDim}
              style={[styles.input, { flex: 1 }]}
              onSubmitEditing={() => {
                if (!newStep.trim()) return;
                setSteps([...steps, newStep.trim()]);
                setNewStep('');
              }}
              returnKeyType="done"
            />
            <Pressable
              onPress={() => {
                if (!newStep.trim()) return;
                setSteps([...steps, newStep.trim()]);
                setNewStep('');
              }}
              style={[styles.addBtn, { backgroundColor: accent + '33', borderColor: accent }]}>
              <Ionicons name="add" size={18} color={accent} />
            </Pressable>
          </View>
        </View>

        <Pressable onPress={() => setIsBoss((v) => !v)} style={styles.toggleRow}>
          <Ionicons
            name={isBoss ? 'checkbox' : 'square-outline'}
            size={22}
            color={isBoss ? '#ef4444' : palette.textMuted}
          />
          <Text style={[styles.toggleText, isBoss && { color: '#ef4444' }]}>Boss Quest (2× XP)</Text>
        </Pressable>

        <View style={{ height: 16 }} />
        <GlowButton
          title="Save Quest"
          color={accent}
          loading={create.isPending}
          onPress={handleSave}
        />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  label: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
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
  prioRow: { flexDirection: 'row', gap: 6 },
  prioBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  prioText: { color: palette.textMuted, fontWeight: '900', fontSize: 14 },
  row: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  chipTxt: { color: palette.textMuted, fontWeight: '700', fontSize: 12 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 8,
  },
  stepLbl: { color: palette.text, flex: 1, fontSize: 13 },
  stepAddRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  toggleText: { color: palette.textMuted, fontWeight: '800', fontSize: 14 },
});
