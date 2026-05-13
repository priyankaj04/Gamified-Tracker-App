import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { palette, priorityColor, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { GlowButton } from '@/components/ui/GlowButton';
import { AnimeTag } from '@/components/ui/AnimeTag';
import { RecurrencePicker } from '@/components/quests/RecurrencePicker';
import { DifficultyPicker } from '@/components/quests/DifficultyPicker';
import { TagPicker } from '@/components/quests/TagPicker';
import { showQuestStamp } from '@/components/quests/QuestStamp';
import {
  useCompleteQuest,
  useCreateStep,
  useCreateTemplate,
  useDeleteQuest,
  useDeleteStep,
  usePauseTimer,
  useQuest,
  useQuestSteps,
  useQuestTimer,
  useStartTimer,
  useStopTimer,
  useUpdateQuest,
  useUpdateStep,
  useArchiveQuest,
  useUnarchiveQuest,
} from '@/hooks/useQuests';
import type { Priority, QuestDifficulty, Recurrence } from '@/types';

const PRIORITIES: Priority[] = ['S', 'A', 'B', 'C'];

export default function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accent = screenTheme.quests.accent;
  const accent2 = screenTheme.quests.accent2;

  const questQ = useQuest(id);
  const stepsQ = useQuestSteps(id);
  const timerQ = useQuestTimer();

  const update = useUpdateQuest();
  const complete = useCompleteQuest();
  const remove = useDeleteQuest();
  const archive = useArchiveQuest();
  const unarchive = useUnarchiveQuest();
  const createStep = useCreateStep();
  const updateStep = useUpdateStep();
  const deleteStep = useDeleteStep();
  const startTimer = useStartTimer();
  const pauseTimer = usePauseTimer();
  const stopTimer = useStopTimer();
  const createTemplate = useCreateTemplate();

  const quest = questQ.data;
  const steps = stepsQ.data ?? [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<Priority>('C');
  const [difficulty, setDifficulty] = useState<QuestDifficulty | null>(null);
  const [recurrence, setRecurrence] = useState<Recurrence>(null);
  const [isBoss, setIsBoss] = useState(false);
  const [estimated, setEstimated] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [newStep, setNewStep] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!quest) return;
    setTitle(quest.title);
    setDescription(quest.description ?? '');
    setNotes(quest.notes ?? '');
    setPriority(quest.priority);
    setDifficulty(quest.difficulty);
    setRecurrence(quest.recurrence);
    setIsBoss(quest.isBoss);
    setEstimated(quest.estimatedMinutes ? String(quest.estimatedMinutes) : '');
    setDueDate(quest.dueDate);
    setTagIds(quest.tags.map((t) => t.id));
    setDirty(false);
  }, [quest?.id]);

  const markDirty = () => setDirty(true);

  const activeTimer = timerQ.data && timerQ.data.questId === id ? timerQ.data : null;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!activeTimer?.isRunning) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [activeTimer?.isRunning]);

  const elapsedSec = useMemo(() => {
    if (!activeTimer) return 0;
    if (!activeTimer.isRunning) return activeTimer.elapsedSec;
    return (
      activeTimer.elapsedSec +
      Math.floor((Date.now() - new Date(activeTimer.startedAt).getTime()) / 1000)
    );
  }, [activeTimer, tick]);

  const fmtElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${m}:${String(sec).padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!quest) return;
    await update.mutateAsync({
      id: quest.id,
      body: {
        title: title.trim(),
        description: description.trim() || null,
        notes: notes.trim() || undefined,
        priority,
        difficulty,
        recurrence,
        isBoss,
        estimatedMinutes: estimated ? Number(estimated) : null,
        dueDate,
        tagIds,
        isDaily: recurrence?.kind === 'daily',
      },
    });
    setDirty(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleComplete = async () => {
    if (!quest) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const res = await complete.mutateAsync({ id: quest.id });
    showQuestStamp(quest.priority, quest.isBoss, res.comboActive ? res.comboCount : undefined);
  };

  const handleDelete = () => {
    if (!quest) return;
    Alert.alert('Delete quest?', `"${quest.title}" will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove.mutateAsync(quest.id);
          router.back();
        },
      },
    ]);
  };

  const handleSaveAsTemplate = async () => {
    if (!quest) return;
    await createTemplate.mutateAsync({
      name: title.trim() || quest.title,
      title: title.trim() || quest.title,
      priority,
      difficulty,
      isDaily: recurrence?.kind === 'daily',
      isBoss,
      recurrence,
      estimatedMinutes: estimated ? Number(estimated) : null,
      notes: notes.trim() || null,
      tagIds,
      stepLabels: steps.map((s) => s.label),
    });
    Alert.alert('Template saved', 'Long-press the + button on Quests to reuse it.');
  };

  if (!quest) {
    return (
      <ThemedScene scene="quests">
        <View style={{ paddingTop: 80, alignItems: 'center' }}>
          <Text style={{ color: palette.textMuted }}>Loading quest...</Text>
        </View>
      </ThemedScene>
    );
  }

  return (
    <ThemedScene scene="quests">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={questQ.isFetching}
            onRefresh={() => {
              questQ.refetch();
              stepsQ.refetch();
            }}
          />
        }>
        <PageHeader
          title={quest.isBoss ? 'Boss Quest' : 'Quest'}
          subtitle={quest.completed ? 'Cleared' : 'In Progress'}
          accent={accent}
          accent2={accent2}
          right={
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {/* Title + priority */}
          <View style={styles.titleCard}>
            <View style={styles.titleRow}>
              <AnimeTag label={priority} variant="priority" />
              {isBoss && <Ionicons name="flame" size={20} color="#ef4444" />}
              {quest.completed && (
                <View style={[styles.completedPill, { backgroundColor: '#4ade8033', borderColor: '#4ade80' }]}>
                  <Text style={{ color: '#4ade80', fontWeight: '900', fontSize: 11, letterSpacing: 0.6 }}>
                    CLEARED
                  </Text>
                </View>
              )}
            </View>
            <TextInput
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                markDirty();
              }}
              style={styles.titleInput}
              placeholderTextColor={palette.textDim}
              multiline
            />
            {quest.completed && quest.completedAt && (
              <Text style={styles.completedAt}>
                Cleared {new Date(quest.completedAt).toLocaleString()}
                {quest.xpEarned ? ` · +${quest.xpEarned} XP` : ''}
                {quest.actualMinutes ? ` · ${quest.actualMinutes}m` : ''}
              </Text>
            )}
          </View>

          {/* Priority picker */}
          <View>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.prioRow}>
              {PRIORITIES.map((p) => {
                const active = priority === p;
                const c = priorityColor[p];
                return (
                  <Pressable
                    key={p}
                    onPress={() => {
                      setPriority(p);
                      markDirty();
                    }}
                    style={[
                      styles.prioBtn,
                      active && { backgroundColor: c + '22', borderColor: c },
                    ]}>
                    <Text style={[styles.prioText, active && { color: c }]}>{p}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Difficulty */}
          <View>
            <Text style={styles.label}>Difficulty</Text>
            <DifficultyPicker
              value={difficulty}
              onChange={(v) => {
                setDifficulty(v);
                markDirty();
              }}
              accent={accent}
            />
          </View>

          {/* Description */}
          <View>
            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={(v) => {
                setDescription(v);
                markDirty();
              }}
              placeholder="What's this quest about?"
              placeholderTextColor={palette.textDim}
              style={[styles.input, { minHeight: 70 }]}
              multiline
            />
          </View>

          {/* Subtasks */}
          <SectionTitle title={`Subtasks (${steps.filter((s) => s.done).length}/${steps.length})`} accent={accent} />
          <View style={{ gap: 6 }}>
            {steps.map((s) => (
              <View key={s.id} style={styles.stepRow}>
                <Pressable
                  onPress={() =>
                    updateStep.mutate({ stepId: s.id, questId: quest.id, body: { done: !s.done } })
                  }
                  hitSlop={6}>
                  <Ionicons
                    name={s.done ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={s.done ? accent : palette.textMuted}
                  />
                </Pressable>
                <Text
                  style={[
                    styles.stepLbl,
                    s.done && { color: palette.textMuted, textDecorationLine: 'line-through' },
                  ]}>
                  {s.label}
                </Text>
                <Pressable
                  onPress={() => deleteStep.mutate({ stepId: s.id, questId: quest.id })}
                  hitSlop={6}>
                  <Ionicons name="trash" size={16} color={palette.danger} />
                </Pressable>
              </View>
            ))}
            <View style={styles.stepAddRow}>
              <TextInput
                value={newStep}
                onChangeText={setNewStep}
                placeholder="Add a step..."
                placeholderTextColor={palette.textDim}
                style={[styles.input, { flex: 1 }]}
                onSubmitEditing={async () => {
                  if (!newStep.trim()) return;
                  await createStep.mutateAsync({ questId: quest.id, label: newStep.trim() });
                  setNewStep('');
                }}
                returnKeyType="done"
              />
              <Pressable
                onPress={async () => {
                  if (!newStep.trim()) return;
                  await createStep.mutateAsync({ questId: quest.id, label: newStep.trim() });
                  setNewStep('');
                }}
                style={[styles.addBtn, { backgroundColor: accent + '33', borderColor: accent }]}>
                <Ionicons name="add" size={18} color={accent} />
              </Pressable>
            </View>
          </View>

          {/* Schedule */}
          <SectionTitle title="Schedule" accent={accent} />
          <View>
            <Text style={styles.label}>Recurrence</Text>
            <RecurrencePicker
              value={recurrence}
              onChange={(v) => {
                setRecurrence(v);
                markDirty();
              }}
              accent={accent}
            />
          </View>

          <View>
            <Text style={styles.label}>Due Date</Text>
            <View style={styles.row}>
              {([
                { lbl: 'None', val: null },
                { lbl: 'Today', val: new Date().toISOString().slice(0, 10) },
                {
                  lbl: 'Tomorrow',
                  val: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
                },
                {
                  lbl: 'Next week',
                  val: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
                },
              ] as const).map((opt) => {
                const active = dueDate === opt.val;
                return (
                  <Pressable
                    key={opt.lbl}
                    onPress={() => {
                      setDueDate(opt.val);
                      markDirty();
                    }}
                    style={[
                      styles.chip,
                      active && { borderColor: accent, backgroundColor: accent + '22' },
                    ]}>
                    <Text style={[styles.chipTxt, active && { color: accent }]}>{opt.lbl}</Text>
                  </Pressable>
                );
              })}
            </View>
            {dueDate && (
              <Text style={{ color: palette.textMuted, fontSize: 12, marginTop: 6 }}>
                Due {new Date(dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>

          {/* Tags */}
          <SectionTitle title="Tags" accent={accent} />
          <TagPicker
            value={tagIds}
            onChange={(v) => {
              setTagIds(v);
              markDirty();
            }}
            accent={accent}
          />

          {/* Effort / time */}
          <SectionTitle title="Effort" accent={accent} />
          <View>
            <Text style={styles.label}>Estimated minutes</Text>
            <TextInput
              value={estimated}
              onChangeText={(v) => {
                setEstimated(v.replace(/[^0-9]/g, ''));
                markDirty();
              }}
              placeholder="e.g. 30"
              placeholderTextColor={palette.textDim}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>

          {/* Timer */}
          {!quest.completed && (
            <View style={styles.timerCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.timerLabel}>{activeTimer ? 'Active session' : 'Track time'}</Text>
                <Text style={styles.timerValue}>
                  {fmtElapsed(elapsedSec)}
                  {quest.estimatedMinutes && (
                    <Text style={{ color: palette.textMuted, fontSize: 12 }}>
                      {' '}
                      / {quest.estimatedMinutes}m
                    </Text>
                  )}
                </Text>
              </View>
              {!activeTimer ? (
                <Pressable
                  onPress={() => startTimer.mutate(quest.id)}
                  style={[styles.timerBtn, { backgroundColor: accent }]}>
                  <Ionicons name="play" size={20} color="#0b0b14" />
                </Pressable>
              ) : activeTimer.isRunning ? (
                <Pressable
                  onPress={() => pauseTimer.mutate(quest.id)}
                  style={[styles.timerBtn, { backgroundColor: '#fbbf24' }]}>
                  <Ionicons name="pause" size={20} color="#0b0b14" />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => startTimer.mutate(quest.id)}
                  style={[styles.timerBtn, { backgroundColor: accent }]}>
                  <Ionicons name="play" size={20} color="#0b0b14" />
                </Pressable>
              )}
              {activeTimer && (
                <Pressable
                  onPress={() => stopTimer.mutate(quest.id)}
                  style={[styles.timerBtn, { backgroundColor: palette.danger }]}>
                  <Ionicons name="stop" size={18} color="#0b0b14" />
                </Pressable>
              )}
            </View>
          )}

          {/* Boss toggle */}
          <Pressable
            onPress={() => {
              setIsBoss((v) => !v);
              markDirty();
            }}
            style={styles.toggleRow}>
            <Ionicons
              name={isBoss ? 'checkbox' : 'square-outline'}
              size={22}
              color={isBoss ? '#ef4444' : palette.textMuted}
            />
            <Text style={[styles.toggleText, isBoss && { color: '#ef4444' }]}>Boss Quest (2× XP)</Text>
          </Pressable>

          {/* Notes */}
          <SectionTitle title="Notes" accent={accent} />
          <TextInput
            value={notes}
            onChangeText={(v) => {
              setNotes(v);
              markDirty();
            }}
            placeholder="Any extra context..."
            placeholderTextColor={palette.textDim}
            style={[styles.input, { minHeight: 90 }]}
            multiline
          />

          {/* Actions */}
          <View style={{ gap: 10, marginTop: 8 }}>
            {!quest.completed && (
              <GlowButton
                title="Mark Complete"
                color="#4ade80"
                loading={complete.isPending}
                onPress={handleComplete}
              />
            )}
            {dirty && (
              <GlowButton title="Save Changes" color={accent} loading={update.isPending} onPress={handleSave} />
            )}
            <View style={styles.row}>
              {quest.archivedAt ? (
                <GlowButton
                  title="Unarchive"
                  color={accent2}
                  variant="ghost"
                  style={{ flex: 1 }}
                  onPress={() => unarchive.mutate(quest.id)}
                />
              ) : (
                quest.completed && (
                  <GlowButton
                    title="Archive"
                    color={accent2}
                    variant="ghost"
                    style={{ flex: 1 }}
                    onPress={() => archive.mutate(quest.id)}
                  />
                )
              )}
              <GlowButton
                title="Delete"
                color={palette.danger}
                variant="ghost"
                style={{ flex: 1 }}
                onPress={handleDelete}
              />
            </View>
            <GlowButton
              title="Save as Template"
              color={accent2}
              variant="ghost"
              loading={createTemplate.isPending}
              onPress={handleSaveAsTemplate}
            />
          </View>
        </View>
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  titleCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 8,
  },
  titleRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  titleInput: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800',
    minHeight: 32,
  },
  completedPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  completedAt: { color: palette.textMuted, fontSize: 12 },
  label: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
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
    padding: 10,
  },
  stepLbl: { color: palette.text, flex: 1, fontSize: 14 },
  stepAddRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
  },
  timerLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  timerValue: { color: palette.text, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  timerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toggleText: { color: palette.textMuted, fontWeight: '800', fontSize: 14 },
});
