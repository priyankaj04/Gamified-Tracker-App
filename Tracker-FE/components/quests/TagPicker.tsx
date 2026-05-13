import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';
import { useTags, useCreateTag } from '@/hooks/useQuests';

interface Props {
  value: string[];
  onChange: (ids: string[]) => void;
  accent?: string;
}

export function TagPicker({ value, onChange, accent = '#e879f9' }: Props) {
  const tagsQ = useTags();
  const createTag = useCreateTag();
  const [newTag, setNewTag] = useState('');

  const tags = tagsQ.data?.tags ?? [];

  return (
    <View>
      <View style={styles.row}>
        {tags.map((t) => {
          const active = value.includes(t.id);
          return (
            <Pressable
              key={t.id}
              onPress={() => {
                onChange(active ? value.filter((v) => v !== t.id) : [...value, t.id]);
              }}
              style={[
                styles.chip,
                { borderColor: active ? t.color : palette.border, backgroundColor: active ? t.color + '22' : palette.card },
              ]}>
              <Text style={[styles.txt, active && { color: t.color }]}>#{t.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.addRow}>
        <TextInput
          value={newTag}
          onChangeText={setNewTag}
          placeholder="new tag..."
          placeholderTextColor={palette.textDim}
          style={styles.input}
        />
        <Pressable
          onPress={async () => {
            const name = newTag.trim().replace(/^#/, '');
            if (!name) return;
            const tag = await createTag.mutateAsync({ name });
            onChange([...value, tag.id]);
            setNewTag('');
          }}
          style={[styles.addBtn, { backgroundColor: accent + '33', borderColor: accent }]}>
          <Ionicons name="add" size={18} color={accent} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  txt: { color: palette.textMuted, fontWeight: '700', fontSize: 12 },
  addRow: { flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 10,
    fontSize: 13,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
