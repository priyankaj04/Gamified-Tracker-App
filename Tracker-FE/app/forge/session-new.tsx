import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { DatePicker, todayISO } from '@/components/ui/DatePicker';
import { StarRating } from '@/components/gamification/StarRating';
import { useProjects } from '@/hooks/useProjects';
import { useCreateSession } from '@/hooks/useSessions';
import type { SessionMood } from '@/types';

const MOODS: { mood: SessionMood; emoji: string }[] = [
  { mood: 'Deep Focus', emoji: '🧠' },
  { mood: 'Normal', emoji: '🙂' },
  { mood: 'Distracted', emoji: '😵' },
  { mood: 'Blocked', emoji: '🚫' },
  { mood: 'Flow State', emoji: '⚡' },
];

const SUGGESTED_TAGS = ['debugging', 'feature', 'refactor', 'review', 'learning'];

export default function SessionNew() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const accent = screenTheme.forge.accent;
  const projects = useProjects({});
  const create = useCreateSession();

  const [projectId, setProjectId] = useState<string | null>(params.projectId ?? null);
  const [duration, setDuration] = useState('60');
  const [date, setDate] = useState(todayISO());
  const [mood, setMood] = useState<SessionMood | null>(null);
  const [notes, setNotes] = useState('');
  const [stars, setStars] = useState<number | null>(null);
  const [billable, setBillable] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const addTag = (t: string) => {
    const tt = t.trim();
    if (!tt) return;
    if (tags.includes(tt)) return;
    setTags((arr) => [...arr, tt]);
    setTagInput('');
  };

  const onSave = async () => {
    const min = parseInt(duration, 10);
    if (!min) {
      Alert.alert('Duration required');
      return;
    }
    try {
      await create.mutateAsync({
        projectId,
        durationMinutes: min,
        date,
        mood,
        notes: notes || null,
        stars,
        isBillable: billable,
        tags,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not save');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Project</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        <Pressable onPress={() => setProjectId(null)} style={[styles.projChip, projectId === null && { borderColor: accent }]}>
          <Text style={[styles.projText, projectId === null && { color: accent }]}>None</Text>
        </Pressable>
        {(projects.data?.projects ?? []).map((p) => (
          <Pressable key={p.id} onPress={() => setProjectId(p.id)} style={[styles.projChip, projectId === p.id && { borderColor: accent }]}>
            <Text style={[styles.projText, projectId === p.id && { color: accent }]}>{p.coverEmoji} {p.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>Date</Text>
      <DatePicker value={date} onChange={setDate} accent={accent} />

      <Text style={styles.label}>Duration (minutes)</Text>
      <TextInput value={duration} onChangeText={setDuration} keyboardType="numeric" style={styles.input} />

      <Text style={styles.label}>Mood</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {MOODS.map((m) => (
          <Pressable key={m.mood} onPress={() => setMood(m.mood)} style={[styles.moodBtn, mood === m.mood && { borderColor: accent, backgroundColor: accent + '22' }]}>
            <Text style={{ fontSize: 18 }}>{m.emoji}</Text>
            <Text style={[styles.moodText, mood === m.mood && { color: accent }]}>{m.mood}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Tags</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {SUGGESTED_TAGS.map((t) => (
          <Pressable key={t} onPress={() => addTag(t)} style={styles.suggestTag}>
            <Text style={styles.suggestText}>#{t}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={tagInput}
        onChangeText={setTagInput}
        onSubmitEditing={() => addTag(tagInput)}
        returnKeyType="done"
        placeholder="Custom tag…"
        placeholderTextColor={palette.textDim}
        style={styles.input}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {tags.map((t) => (
          <Pressable key={t} onPress={() => setTags((arr) => arr.filter((x) => x !== t))} style={[styles.suggestTag, { borderColor: accent }]}>
            <Text style={[styles.suggestText, { color: accent }]}>#{t} ×</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput value={notes} onChangeText={setNotes} multiline style={[styles.input, { height: 90 }]} />

      <Text style={styles.label}>Quality</Text>
      <StarRating value={stars} onChange={setStars} />

      <Pressable onPress={() => setBillable((b) => !b)} style={[styles.billRow, billable && { borderColor: '#fbbf24' }]}>
        <Text style={[styles.billText, billable && { color: '#fbbf24' }]}>$ Billable</Text>
        <View style={[styles.toggle, billable && { backgroundColor: '#fbbf2455' }]}>
          <View style={[styles.toggleDot, { backgroundColor: billable ? '#fbbf24' : palette.textMuted, alignSelf: billable ? 'flex-end' : 'flex-start' }]} />
        </View>
      </Pressable>

      <View style={{ height: 12 }} />
      <GlowButton title="Save Session" color={accent} loading={create.isPending} onPress={onSave} />
      <View style={{ height: 60 }} />
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  h1: { color: palette.text, fontSize: 24, fontWeight: '900' },
  label: { color: palette.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
  projChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
  projText: { color: palette.textMuted, fontWeight: '700', fontSize: 12 },
  moodBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: palette.border, borderRadius: 10, backgroundColor: palette.card },
  moodText: { color: palette.textMuted, fontWeight: '700', fontSize: 12 },
  suggestTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
  suggestText: { color: palette.textMuted, fontWeight: '700', fontSize: 11 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: palette.border, padding: 12, backgroundColor: palette.card },
  billText: { color: palette.textMuted, fontWeight: '800', fontSize: 13 },
  toggle: { width: 40, height: 24, borderRadius: 12, padding: 2, backgroundColor: palette.cardAlt },
  toggleDot: { width: 20, height: 20, borderRadius: 10 },
});
