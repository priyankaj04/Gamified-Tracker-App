import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { SnippetCard } from '@/components/forge/SnippetCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import {
  useCreateSnippet,
  useDeleteSnippet,
  useSnippets,
  useToggleSnippetPin,
} from '@/hooks/useSnippets';
import type { SnippetCategory } from '@/types';

const CATEGORIES: (SnippetCategory | 'All')[] = ['All', 'Bug Fix', 'Algorithm', 'Config', 'Reference', 'Template'];

export default function SnippetsScreen() {
  const router = useRouter();
  const accent = screenTheme.forge.accent;

  const [cat, setCat] = useState<SnippetCategory | 'All'>('All');
  const [search, setSearch] = useState('');
  const filters = { category: cat === 'All' ? undefined : cat, search: search || undefined };
  const { data, isFetching, refetch } = useSnippets(filters as any);
  const pin = useToggleSnippetPin();
  const del = useDeleteSnippet();
  const create = useCreateSnippet();

  // create sheet
  const [newOpen, setNewOpen] = useState(false);
  const [nTitle, setNTitle] = useState('');
  const [nLang, setNLang] = useState('typescript');
  const [nContent, setNContent] = useState('');
  const [nCat, setNCat] = useState<SnippetCategory>('Reference');

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView refreshControl={<RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />}>
        <PageHeader
          title="Snippets"
          subtitle="Forge"
          accent={accent}
          accent2={screenTheme.forge.accent2}
          right={
            <Pressable onPress={() => setNewOpen(true)} hitSlop={8}>
              <Ionicons name="add" size={26} color={accent} />
            </Pressable>
          }
        />

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={palette.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.search}
            placeholder="Search snippets…"
            placeholderTextColor={palette.textDim}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setCat(c)} style={[styles.tab, cat === c && { borderColor: accent, backgroundColor: accent + '22' }]}>
              <Text style={[styles.tabText, cat === c && { color: accent }]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 20 }}>
          {(data?.snippets ?? []).length === 0 && (
            <EmptyState icon="code-slash" title="No snippets yet." message="Save your first useful chunk of code." accent={accent} />
          )}
          {(data?.snippets ?? []).map((s) => (
            <SnippetCard
              key={s.id}
              snippet={s}
              onPress={() => router.push(`/forge/snippet-detail?id=${s.id}` as any)}
              onLongPress={() => {
                Alert.alert(s.title, undefined, [
                  { text: s.isPinned ? 'Unpin' : 'Pin', onPress: () => pin.mutate(s.id) },
                  { text: 'Delete', style: 'destructive', onPress: () => del.mutate(s.id) },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              }}
            />
          ))}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>

      <BottomSheet visible={newOpen} onClose={() => setNewOpen(false)} title="New Snippet">
        <TextInput placeholder="Title" placeholderTextColor={palette.textDim} value={nTitle} onChangeText={setNTitle} style={styles.input} />
        <View style={{ height: 8 }} />
        <TextInput placeholder="Language (typescript, python, …)" placeholderTextColor={palette.textDim} value={nLang} onChangeText={setNLang} style={styles.input} autoCapitalize="none" />
        <View style={{ height: 8 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {(['Bug Fix', 'Algorithm', 'Config', 'Reference', 'Template'] as SnippetCategory[]).map((c) => (
            <Pressable key={c} onPress={() => setNCat(c)} style={[styles.tab, nCat === c && { borderColor: accent }]}>
              <Text style={[styles.tabText, nCat === c && { color: accent }]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <TextInput
          placeholder="Code…"
          placeholderTextColor={palette.textDim}
          value={nContent}
          onChangeText={setNContent}
          multiline
          style={[styles.input, { height: 160, fontFamily: 'Courier' }]}
        />
        <View style={{ height: 10 }} />
        <GlowButton
          title="Save Snippet"
          color={accent}
          loading={create.isPending}
          onPress={async () => {
            if (!nTitle.trim() || !nContent.trim()) return;
            await create.mutateAsync({ title: nTitle.trim(), language: nLang, content: nContent, category: nCat });
            setNTitle(''); setNContent('');
            setNewOpen(false);
          }}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.card, borderRadius: 10, paddingHorizontal: 12, marginHorizontal: 20, borderWidth: 1, borderColor: palette.border },
  search: { flex: 1, color: palette.text, paddingVertical: 10, fontSize: 14 },
  tabsRow: { paddingHorizontal: 20, gap: 6, paddingVertical: 10 },
  tab: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
  tabText: { color: palette.textMuted, fontSize: 12, fontWeight: '800' },
  input: { backgroundColor: palette.card, borderRadius: 10, borderWidth: 1, borderColor: palette.border, color: palette.text, padding: 12, fontSize: 14 },
});
