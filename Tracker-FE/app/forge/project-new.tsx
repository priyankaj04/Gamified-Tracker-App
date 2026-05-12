import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette, screenTheme, priorityColor } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { todayISO } from '@/components/ui/DatePicker';
import { CalendarPicker } from '@/components/ui/CalendarPicker';
import { TechTag } from '@/components/forge/TechTag';
import { useCreateProject } from '@/hooks/useProjects';
import type { Priority, ProjectType } from '@/types';

const TYPES: ProjectType[] = ['Personal', 'Freelance', 'Open Source', 'Learning', 'Work'];
const PRIORITIES: Priority[] = ['S', 'A', 'B', 'C'];
const EMOJIS = ['💻', '🚀', '⚡', '🛠', '📱', '🤖', '🧠', '🎮', '🔥', '🌐', '🧪', '📊'];

export default function ProjectNew() {
  const router = useRouter();
  const accent = screenTheme.forge.accent;
  const create = useCreateProject();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<ProjectType>('Personal');
  const [priority, setPriority] = useState<Priority>('B');
  const [emoji, setEmoji] = useState('💻');
  const [startDate, setStart] = useState(todayISO());
  const [targetDate, setTarget] = useState<string>('');
  const [estHours, setEstHours] = useState('');
  const [github, setGithub] = useState('');
  const [demo, setDemo] = useState('');
  const [techInput, setTechInput] = useState('');
  const [tech, setTech] = useState<string[]>([]);
  const [msInput, setMsInput] = useState('');
  const [milestones, setMilestones] = useState<string[]>([]);

  const addTech = () => {
    if (!techInput.trim()) return;
    setTech((arr) => [...arr, techInput.trim()]);
    setTechInput('');
  };
  const addMs = () => {
    if (!msInput.trim()) return;
    setMilestones((arr) => [...arr, msInput.trim()]);
    setMsInput('');
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
        type,
        priority,
        techStack: tech,
        coverEmoji: emoji,
        startDate,
        targetShipDate: targetDate || null,
        estimatedHours: estHours ? Number(estHours) : null,
        githubUrl: github || null,
        demoUrl: demo || null,
        milestones: milestones.map((title) => ({ title })),
      });
      router.back();
    } catch (e: any) {
      Alert.alert('Failed', e.message ?? 'Could not save');
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Label text="Name" />
      <TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor={palette.textDim} />

      <Label text="Description" />
      <TextInput value={desc} onChangeText={setDesc} style={[styles.input, { height: 70 }]} multiline placeholderTextColor={palette.textDim} />

      <Label text="Type" />
      <View style={styles.chipsRow}>
        {TYPES.map((t) => (
          <Pressable
            key={t}
            onPress={() => setType(t)}
            style={[styles.choice, type === t && { borderColor: accent, backgroundColor: accent + '22' }]}>
            <Text style={[styles.choiceText, type === t && { color: accent }]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      <Label text="Priority" />
      <View style={styles.chipsRow}>
        {PRIORITIES.map((p) => (
          <Pressable
            key={p}
            onPress={() => setPriority(p)}
            style={[styles.priority, { borderColor: priorityColor[p] }, priority === p && { backgroundColor: priorityColor[p] + '22' }]}>
            <Text style={[styles.priorityText, { color: priorityColor[p] }]}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <Label text="Cover Emoji" />
      <View style={styles.chipsRow}>
        {EMOJIS.map((e) => (
          <Pressable key={e} onPress={() => setEmoji(e)} style={[styles.emoji, emoji === e && { borderColor: accent }]}>
            <Text style={{ fontSize: 22 }}>{e}</Text>
          </Pressable>
        ))}
      </View>

      <Label text="Tech Stack" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={techInput}
          onChangeText={setTechInput}
          onSubmitEditing={addTech}
          returnKeyType="done"
          style={[styles.input, { flex: 1 }]}
          placeholder="e.g. TypeScript"
          placeholderTextColor={palette.textDim}
        />
        <Pressable onPress={addTech} style={[styles.addBtn, { borderColor: accent }]}>
          <Ionicons name="add" size={18} color={accent} />
        </Pressable>
      </View>
      <View style={styles.tagsWrap}>
        {tech.map((t, i) => (
          <TechTag key={t + i} label={t} color={accent} onRemove={() => setTech((arr) => arr.filter((_, idx) => idx !== i))} />
        ))}
      </View>

      <Label text="Start Date" />
      <CalendarPicker value={startDate} onChange={setStart} accent={accent} />

      <Label text="Target Ship Date" />
      <CalendarPicker
        value={targetDate}
        onChange={setTarget}
        accent={accent}
        placeholder="Pick a target ship date"
        minimumDate={new Date()}
      />

      <Label text="Estimated Hours" />
      <TextInput value={estHours} onChangeText={setEstHours} keyboardType="numeric" style={styles.input} placeholder="e.g. 40" placeholderTextColor={palette.textDim} />

      <Label text="GitHub URL" />
      <TextInput value={github} onChangeText={setGithub} style={styles.input} autoCapitalize="none" placeholder="https://github.com/..." placeholderTextColor={palette.textDim} />

      <Label text="Demo URL" />
      <TextInput value={demo} onChangeText={setDemo} style={styles.input} autoCapitalize="none" placeholderTextColor={palette.textDim} />

      <Label text="Milestones" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput
          value={msInput}
          onChangeText={setMsInput}
          onSubmitEditing={addMs}
          returnKeyType="done"
          style={[styles.input, { flex: 1 }]}
          placeholder="Ship MVP"
          placeholderTextColor={palette.textDim}
        />
        <Pressable onPress={addMs} style={[styles.addBtn, { borderColor: accent }]}>
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
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  h1: { color: palette.text, fontSize: 24, fontWeight: '900', marginBottom: 6 },
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
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { borderWidth: 1, borderColor: palette.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.card },
  choiceText: { color: palette.textMuted, fontSize: 12, fontWeight: '800' },
  priority: { width: 40, height: 40, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  priorityText: { fontSize: 14, fontWeight: '900' },
  emoji: { width: 42, height: 42, borderRadius: 8, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.card },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.card, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: palette.border },
  mText: { color: palette.text, fontSize: 14, flex: 1 },
});
