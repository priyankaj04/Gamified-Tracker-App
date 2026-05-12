import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Share } from 'react-native';
import { palette, screenTheme } from '@/lib/themes';
import { useSnippets, useToggleSnippetPin, useDeleteSnippet } from '@/hooks/useSnippets';

export default function SnippetDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accent = screenTheme.forge.accent;
  const snippets = useSnippets({});
  const pin = useToggleSnippetPin();
  const del = useDeleteSnippet();
  const s = snippets.data?.snippets.find((x) => x.id === id);

  if (!s) {
    return (
      <View style={styles.center}>
        <Text style={{ color: palette.textMuted }}>Snippet not found.</Text>
      </View>
    );
  }

  const onCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // expo-clipboard not installed — fall back to the system share sheet, which
    // gives the user a "Copy" affordance on iOS/Android.
    await Share.share({ message: s.content });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 20, gap: 12 }}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.meta}>{s.language} · {s.category}</Text>
        </View>
        <Pressable onPress={() => pin.mutate(s.id)} hitSlop={8}>
          <Ionicons name={s.isPinned ? 'pin' : 'pin-outline'} size={20} color={accent} />
        </Pressable>
        <Pressable
          onPress={() => Alert.alert('Delete?', undefined, [
            { text: 'Cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await del.mutateAsync(s.id); router.back(); } },
          ])}
          hitSlop={8}>
          <Ionicons name="trash" size={18} color="#ef4444" />
        </Pressable>
      </View>

      <Pressable onPress={onCopy} style={[styles.copyBtn, { borderColor: accent }]}>
        <Ionicons name="copy-outline" size={16} color={accent} />
        <Text style={[styles.copyText, { color: accent }]}>Copy to Clipboard</Text>
      </Pressable>

      <View style={styles.codeBox}>
        <Text style={styles.code}>{s.content}</Text>
      </View>

      {(s.tags ?? []).length > 0 && (
        <View style={styles.tags}>
          {s.tags.map((t) => (
            <Text key={t} style={[styles.tag, { color: accent, borderColor: accent + '55' }]}>#{t}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: palette.text, fontSize: 22, fontWeight: '900' },
  meta: { color: palette.textMuted, fontWeight: '700', fontSize: 12, marginTop: 4 },
  copyBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 10, padding: 12 },
  copyText: { fontWeight: '900', fontSize: 13 },
  codeBox: { backgroundColor: '#0a0a0f', borderWidth: 1, borderColor: palette.border, borderRadius: 12, padding: 14, overflow: 'hidden' },
  code: { color: '#c9d1d9', fontFamily: 'Courier', fontSize: 12, lineHeight: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { fontSize: 11, fontWeight: '800', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
});
