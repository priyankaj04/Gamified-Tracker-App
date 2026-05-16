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
import { useRouter } from 'expo-router';
import { palette } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { DatePicker, todayISO } from '@/components/ui/DatePicker';
import { useCreateDsaProblem } from '@/hooks/useDSA';
import type { DsaDifficulty, DsaPlatform, DsaStatus, DsaTopic } from '@/types';

const PLATFORMS: DsaPlatform[] = ['LeetCode', 'HackerRank', 'Codeforces', 'GeeksForGeeks', 'Custom'];
const DIFFS: DsaDifficulty[] = ['Easy', 'Medium', 'Hard'];
const STATUS: DsaStatus[] = ['Solved', 'Attempted', 'Revisit'];
const TOPICS: DsaTopic[] = [
  'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs',
  'Dynamic Programming', 'Backtracking', 'Sorting',
  'Binary Search', 'Stacks & Queues', 'Heaps',
  'Tries', 'Greedy', 'Math', 'Bit Manipulation', 'Other',
];

const diffColor = { Easy: '#4ade80', Medium: '#fbbf24', Hard: '#ef4444' } as const;

export default function DsaNew() {
  const router = useRouter();
  const accent = '#a78bfa';
  const create = useCreateDsaProblem();

  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<DsaPlatform>('LeetCode');
  const [difficulty, setDifficulty] = useState<DsaDifficulty>('Medium');
  const [topic, setTopic] = useState<DsaTopic>('Arrays');
  const [status, setStatus] = useState<DsaStatus>('Solved');
  const [timeMin, setTimeMin] = useState('');
  const [date, setDate] = useState(todayISO());
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [sol, setSol] = useState('');

  const onSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required');
      return;
    }
    try {
      await create.mutateAsync({
        title: title.trim(),
        platform,
        difficulty,
        topic,
        status,
        timeTakenMin: timeMin ? Number(timeMin) : null,
        date,
        problemUrl: url || null,
        notes: notes || null,
        solutionNotes: sol || null,
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
    <ScrollView
      contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="Two Sum" placeholderTextColor={palette.textDim} />

      <Text style={styles.label}>Platform</Text>
      <View style={styles.chipsRow}>
        {PLATFORMS.map((p) => (
          <Pressable key={p} onPress={() => setPlatform(p)} style={[styles.chip, platform === p && { borderColor: accent, backgroundColor: accent + '22' }]}>
            <Text style={[styles.chipText, platform === p && { color: accent }]}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Problem URL</Text>
      <TextInput value={url} onChangeText={setUrl} style={styles.input} autoCapitalize="none" placeholderTextColor={palette.textDim} />

      <Text style={styles.label}>Difficulty</Text>
      <View style={styles.chipsRow}>
        {DIFFS.map((d) => (
          <Pressable key={d} onPress={() => setDifficulty(d)} style={[styles.chip, { borderColor: diffColor[d] }, difficulty === d && { backgroundColor: diffColor[d] + '22' }]}>
            <Text style={[styles.chipText, { color: diffColor[d] }]}>{d}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Topic</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {TOPICS.map((t) => (
          <Pressable key={t} onPress={() => setTopic(t)} style={[styles.chip, topic === t && { borderColor: accent, backgroundColor: accent + '22' }]}>
            <Text style={[styles.chipText, topic === t && { color: accent }]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.label}>Status</Text>
      <View style={styles.chipsRow}>
        {STATUS.map((s) => (
          <Pressable key={s} onPress={() => setStatus(s)} style={[styles.chip, status === s && { borderColor: accent, backgroundColor: accent + '22' }]}>
            <Text style={[styles.chipText, status === s && { color: accent }]}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Date</Text>
      <DatePicker value={date} onChange={setDate} accent={accent} />

      <Text style={styles.label}>Time Taken (min)</Text>
      <TextInput value={timeMin} onChangeText={setTimeMin} keyboardType="numeric" style={styles.input} />

      <Text style={styles.label}>Notes</Text>
      <TextInput value={notes} onChangeText={setNotes} multiline style={[styles.input, { height: 70 }]} />

      <Text style={styles.label}>Solution Notes</Text>
      <TextInput value={sol} onChangeText={setSol} multiline style={[styles.input, { height: 90 }]} />

      <View style={{ height: 12 }} />
      <GlowButton title="Log Problem" color={accent} loading={create.isPending} onPress={onSave} />
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
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
  chipText: { color: palette.textMuted, fontSize: 12, fontWeight: '800' },
});
