import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';
import type { Snippet } from '@/types';

const langColor: Record<string, string> = {
  javascript: '#facc15',
  typescript: '#22d3ee',
  python: '#60a5fa',
  rust: '#fb923c',
  go: '#22d3ee',
  java: '#ef4444',
  sql: '#a78bfa',
};

interface Props {
  snippet: Snippet;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function SnippetCard({ snippet: s, onPress, onLongPress }: Props) {
  const color = langColor[s.language.toLowerCase()] ?? '#22d3ee';
  const preview = s.content.split('\n').slice(0, 3).join('\n');
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={styles.head}>
        <View style={[styles.langPill, { backgroundColor: color + '22', borderColor: color }]}>
          <Text style={[styles.langText, { color }]}>{s.language}</Text>
        </View>
        <Text style={styles.category}>{s.category}</Text>
        {s.isPinned && <Ionicons name="pin" size={12} color="#22d3ee" />}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {s.title}
      </Text>
      <View style={styles.codeBox}>
        <Text style={styles.code} numberOfLines={3}>
          {preview}
        </Text>
      </View>
      {(s.tags ?? []).length > 0 && (
        <View style={styles.tags}>
          {s.tags.slice(0, 4).map((t) => (
            <Text key={t} style={styles.tag}>
              #{t}
            </Text>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    gap: 8,
    marginBottom: 8,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  langText: { fontSize: 10, fontWeight: '900' },
  category: { color: palette.textMuted, fontSize: 11, fontWeight: '700', flex: 1 },
  title: { color: palette.text, fontSize: 14, fontWeight: '800' },
  codeBox: {
    backgroundColor: '#0a0a0f',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  code: { color: '#c9d1d9', fontFamily: 'Courier', fontSize: 11, lineHeight: 16 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { color: '#22d3ee', fontSize: 10, fontWeight: '700' },
});
