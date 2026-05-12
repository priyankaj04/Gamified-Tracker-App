import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { useCreateLearning } from '@/hooks/useLearning';
import type { LearningType } from '@/types';

const TYPES: LearningType[] = ['Course', 'Book', 'Tutorial', 'Video', 'Documentation', 'Paper'];

export default function LearningNew() {
  const router = useRouter();
  const accent = '#fbbf24';
  const create = useCreateLearning();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<LearningType>('Course');
  const [platform, setPlatform] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [topicInput, setTopicInput] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [estHours, setEstHours] = useState('');

  const addTopic = () => {
    if (!topicInput.trim()) return;
    setTopics((arr) => [...arr, topicInput.trim()]);
    setTopicInput('');
  };

  const onSave = async () => {
    if (!title.trim()) {
      Alert.alert('Title required');
      return;
    }
    try {
      await create.mutateAsync({
        title: title.trim(),
        type,
        platform: platform || null,
        sourceUrl: sourceUrl || null,
        topics,
        estimatedHours: estHours ? Number(estHours) : null,
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not save');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={styles.h1}>New Learning</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="e.g. System Design Primer" placeholderTextColor={palette.textDim} />

      <Text style={styles.label}>Type</Text>
      <View style={styles.chipsRow}>
        {TYPES.map((t) => (
          <Pressable key={t} onPress={() => setType(t)} style={[styles.chip, type === t && { borderColor: accent, backgroundColor: accent + '22' }]}>
            <Text style={[styles.chipText, type === t && { color: accent }]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Platform</Text>
      <TextInput value={platform} onChangeText={setPlatform} style={styles.input} placeholder="Coursera, Udemy, etc." placeholderTextColor={palette.textDim} />

      <Text style={styles.label}>Source URL</Text>
      <TextInput value={sourceUrl} onChangeText={setSourceUrl} style={styles.input} autoCapitalize="none" placeholderTextColor={palette.textDim} />

      <Text style={styles.label}>Topics</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={topicInput}
          onChangeText={setTopicInput}
          onSubmitEditing={addTopic}
          returnKeyType="done"
          style={[styles.input, { flex: 1 }]}
          placeholder="e.g. React"
          placeholderTextColor={palette.textDim}
        />
        <Pressable onPress={addTopic} style={[styles.addBtn, { borderColor: accent }]}>
          <Ionicons name="add" size={18} color={accent} />
        </Pressable>
      </View>
      <View style={styles.tagsWrap}>
        {topics.map((t, i) => (
          <Pressable key={t + i} onPress={() => setTopics((arr) => arr.filter((_, idx) => idx !== i))} style={[styles.topicChip, { borderColor: accent + '66' }]}>
            <Text style={[styles.topicText, { color: accent }]}>{t} ×</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Estimated Hours</Text>
      <TextInput value={estHours} onChangeText={setEstHours} keyboardType="numeric" style={styles.input} />

      <View style={{ height: 12 }} />
      <GlowButton title="Add Learning" color={accent} loading={create.isPending} onPress={onSave} />
      <View style={{ height: 60 }} />
    </ScrollView>
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
  addBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topicChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  topicText: { fontWeight: '800', fontSize: 12 },
});
