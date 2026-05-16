import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme } from '@/lib/themes';
import { EmptyState } from '@/components/layout/EmptyState';
import { GlowButton } from '@/components/ui/GlowButton';
import {
  useTemplates,
  useDeleteTemplate,
  useDuplicateTemplate,
} from '@/hooks/useTemplates';

export default function TemplatesList() {
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const { data, isFetching, refetch } = useTemplates();
  const del = useDeleteTemplate();
  const dup = useDuplicateTemplate();
  const [search, setSearch] = useState('');

  const all = data?.templates ?? [];
  const templates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((t) => t.name.toLowerCase().includes(q));
  }, [all, search]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        refreshControl={<RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />}>
        {all.length > 0 && (
          <View style={[styles.searchWrap, { borderColor: palette.border }]}>
            <Ionicons name="search" size={16} color={palette.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search templates…"
              placeholderTextColor={palette.textDim}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {!!search && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={palette.textDim} />
              </Pressable>
            )}
          </View>
        )}

        {templates.length === 0 ? (
          all.length === 0 ? (
            <EmptyState
              icon="albums"
              title="No templates yet"
              message="Save a recurring workout (PPL Push Day, Upper Body, etc.) so you can start it in one tap."
              accent={accent}
            />
          ) : (
            <EmptyState
              icon="search"
              title="No matches"
              message={`No template matches "${search}".`}
              accent={accent}
            />
          )
        ) : (
          <View style={{ gap: 10 }}>
            {templates.map((t) => (
              <View key={t.id} style={styles.card}>
                <Pressable
                  onPress={() => router.push(`/dojo/templates/${t.id}` as any)}
                  style={{ flex: 1 }}>
                  <Text style={styles.name}>{t.name}</Text>
                  <Text style={styles.meta}>
                    {t.exercises.length} exercises · ~{t.estimatedMinutes} min · {t.type}
                  </Text>
                  {t.lastUsedAt && (
                    <Text style={styles.lastUsed}>
                      Last used: {new Date(t.lastUsedAt).toLocaleDateString()}
                    </Text>
                  )}
                </Pressable>
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/dojo/new-workout', params: { templateId: t.id } } as any)}
                    hitSlop={6}
                    style={[styles.actionBtn, { backgroundColor: accent + '22', borderColor: accent }]}>
                    <Ionicons name="play" size={16} color={accent} />
                    <Text style={[styles.actionText, { color: accent }]}>Start</Text>
                  </Pressable>
                  <Pressable onPress={() => dup.mutate(t.id)} hitSlop={6} style={styles.iconBtn}>
                    <Ionicons name="copy-outline" size={20} color={palette.textMuted} />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert('Delete template?', t.name, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => del.mutate(t.id) },
                      ])
                    }
                    hitSlop={6}
                    style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={20} color={palette.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 16 }} />
        <GlowButton
          title="New Template"
          color={accent}
          onPress={() => router.push('/dojo/templates/new' as any)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 8,
  },
  name: { color: palette.text, fontWeight: '800', fontSize: 16 },
  meta: { color: palette.textMuted, fontSize: 12, marginTop: 4 },
  lastUsed: { color: palette.textDim, fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  actionText: { fontWeight: '900', fontSize: 13, letterSpacing: 0.3 },
  iconBtn: { padding: 10 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  searchInput: { flex: 1, color: palette.text, fontSize: 14 },
});
