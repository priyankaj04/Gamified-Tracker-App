import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { useCreateProject } from '@/hooks/useProjects';

export default function NewProject() {
  const router = useRouter();
  const accent = screenTheme.forge.accent;
  const create = useCreateProject();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [techInput, setTechInput] = useState('');
  const [tech, setTech] = useState<string[]>([]);
  const [github, setGithub] = useState('');
  const [milestoneInput, setMilestoneInput] = useState('');
  const [milestones, setMilestones] = useState<string[]>([]);

  const addTech = () => {
    if (!techInput.trim()) return;
    setTech([...tech, techInput.trim()]);
    setTechInput('');
  };

  const addMilestone = () => {
    if (!milestoneInput.trim()) return;
    setMilestones([...milestones, milestoneInput.trim()]);
    setMilestoneInput('');
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required');
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        description: desc || undefined,
        techStack: tech,
        githubUrl: github || undefined,
        milestones: milestones.map((title) => ({ title })),
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not save');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={styles.label}>Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor={palette.textDim} />

      <Text style={styles.label}>Description</Text>
      <TextInput value={desc} onChangeText={setDesc} style={[styles.input, { height: 80 }]} multiline placeholderTextColor={palette.textDim} />

      <Text style={styles.label}>Tech stack</Text>
      <View style={styles.row}>
        <TextInput
          value={techInput}
          onChangeText={setTechInput}
          onSubmitEditing={addTech}
          returnKeyType="done"
          style={[styles.input, { flex: 1 }]}
          placeholder="e.g. TypeScript"
          placeholderTextColor={palette.textDim}
        />
        <Pressable onPress={addTech} style={[styles.add, { borderColor: accent }]}>
          <Ionicons name="add" size={18} color={accent} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        {tech.map((t, i) => (
          <Pressable
            key={t + i}
            onPress={() => setTech((arr) => arr.filter((_, idx) => idx !== i))}
            style={[styles.chip, { borderColor: accent + '66' }]}>
            <Text style={[styles.chipText, { color: accent }]}>{t} ×</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>GitHub URL</Text>
      <TextInput value={github} onChangeText={setGithub} style={styles.input} autoCapitalize="none" placeholderTextColor={palette.textDim} />

      <Text style={styles.label}>Milestones</Text>
      <View style={styles.row}>
        <TextInput
          value={milestoneInput}
          onChangeText={setMilestoneInput}
          onSubmitEditing={addMilestone}
          returnKeyType="done"
          style={[styles.input, { flex: 1 }]}
          placeholder="Ship MVP"
          placeholderTextColor={palette.textDim}
        />
        <Pressable onPress={addMilestone} style={[styles.add, { borderColor: accent }]}>
          <Ionicons name="add" size={18} color={accent} />
        </Pressable>
      </View>
      <View style={{ gap: 6 }}>
        {milestones.map((m, i) => (
          <View key={m + i} style={styles.mRow}>
            <Ionicons name="ellipse-outline" size={16} color={accent} />
            <Text style={styles.mText}>{m}</Text>
            <Pressable onPress={() => setMilestones((arr) => arr.filter((_, idx) => idx !== i))} hitSlop={6}>
              <Ionicons name="close" size={16} color={palette.textDim} />
            </Pressable>
          </View>
        ))}
      </View>

      <View style={{ height: 16 }} />
      <GlowButton title="Create Project" color={accent} onPress={onSave} loading={create.isPending} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: { color: palette.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  add: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipText: { fontWeight: '800', fontSize: 12 },
  mRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  mText: { color: palette.text, fontSize: 14, flex: 1 },
});
