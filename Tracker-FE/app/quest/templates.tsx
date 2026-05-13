import React from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, priorityColor, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { useDeleteTemplate, useQuestTemplates, useUseTemplate } from '@/hooks/useQuests';

export default function QuestTemplatesScreen() {
  const router = useRouter();
  const accent = screenTheme.quests.accent;
  const accent2 = screenTheme.quests.accent2;
  const templatesQ = useQuestTemplates();
  const useTpl = useUseTemplate();
  const removeTpl = useDeleteTemplate();

  const templates = templatesQ.data ?? [];

  return (
    <ThemedScene scene="quests">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={templatesQ.isFetching}
            onRefresh={templatesQ.refetch}
          />
        }>
        <PageHeader
          title="Templates"
          subtitle="Reusable Quests"
          accent={accent}
          accent2={accent2}
          right={
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        {templates.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="bookmark"
              title="No templates yet"
              message="Save your repeating setups for one-tap creation later. From any quest detail screen, tap 'Save as template'."
              accent={accent}
            />
          </View>
        ) : (
          <View style={{ gap: 8, paddingHorizontal: 20 }}>
            {templates.map((t) => (
              <View key={t.id} style={styles.card}>
                <View style={[styles.prio, { borderColor: priorityColor[t.priority] }]}>
                  <Text style={[styles.prioTxt, { color: priorityColor[t.priority] }]}>{t.priority}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{t.name}</Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {t.title} {t.isBoss && '· 👹 Boss'}{' '}
                    {t.recurrence?.kind ? `· ${t.recurrence.kind}` : t.isDaily ? '· daily' : ''}{' '}
                    {t.useCount ? `· used ${t.useCount}×` : ''}
                  </Text>
                </View>
                <Pressable
                  onPress={async () => {
                    await useTpl.mutateAsync(t.id);
                  }}
                  hitSlop={4}
                  style={[styles.useBtn, { backgroundColor: accent }]}>
                  <Ionicons name="add" size={20} color="#0b0b14" />
                </Pressable>
                <Pressable
                  onPress={() =>
                    Alert.alert('Delete template?', t.name, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => removeTpl.mutate(t.id),
                      },
                    ])
                  }
                  hitSlop={4}>
                  <Ionicons name="trash" size={18} color={palette.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  prio: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  prioTxt: { fontSize: 13, fontWeight: '900' },
  name: { color: palette.text, fontSize: 14, fontWeight: '800' },
  sub: { color: palette.textMuted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  useBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
