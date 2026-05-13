import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { useQuestChallenges, useSeedChallenges } from '@/hooks/useQuests';

export default function QuestChallengesScreen() {
  const router = useRouter();
  const accent = screenTheme.quests.accent;
  const accent2 = screenTheme.quests.accent2;
  const challengesQ = useQuestChallenges();
  const seed = useSeedChallenges();

  const items = challengesQ.data ?? [];

  return (
    <ThemedScene scene="quests">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={challengesQ.isFetching}
            onRefresh={challengesQ.refetch}
          />
        }>
        <PageHeader
          title="Challenges"
          subtitle="Weekly & Monthly"
          accent={accent}
          accent2={accent2}
          right={
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        {items.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="ribbon"
              title="No active challenges"
              message="Trigger the weekly board with a tap."
              accent={accent}
            />
            <Pressable
              onPress={() => seed.mutate()}
              style={[styles.seedBtn, { backgroundColor: accent + '33', borderColor: accent }]}>
              <Text style={[styles.seedTxt, { color: accent }]}>Seed this week</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 10, paddingHorizontal: 20 }}>
            {items.map((c) => {
              const pct = Math.min(100, Math.round((c.progress / Math.max(1, c.target)) * 100));
              const color = c.completed ? '#4ade80' : c.period === 'weekly' ? accent : accent2;
              return (
                <View key={c.id} style={[styles.card, { borderColor: color + '88' }]}>
                  <View style={styles.head}>
                    <Text style={[styles.period, { color }]}>{c.period.toUpperCase()}</Text>
                    <Text style={styles.reward}>+{c.xpReward} XP</Text>
                  </View>
                  <Text style={styles.title}>{c.title}</Text>
                  {c.description && <Text style={styles.desc}>{c.description}</Text>}
                  <View style={styles.progressWrap}>
                    <View style={styles.progressBg}>
                      <View
                        style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]}
                      />
                    </View>
                    <Text style={[styles.progressTxt, { color }]}>
                      {c.progress}/{c.target}
                    </Text>
                  </View>
                  {c.completed && (
                    <Text style={styles.doneBadge}>CLEARED · +{c.xpReward} XP</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  period: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  reward: { color: '#fbbf24', fontSize: 12, fontWeight: '900' },
  title: { color: palette.text, fontSize: 15, fontWeight: '900' },
  desc: { color: palette.textMuted, fontSize: 12 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBg: { flex: 1, height: 6, backgroundColor: palette.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressTxt: { fontSize: 11, fontWeight: '900' },
  doneBadge: { color: '#4ade80', fontSize: 11, fontWeight: '900', letterSpacing: 0.8, marginTop: 4 },
  seedBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  seedTxt: { fontWeight: '900', fontSize: 13 },
});
