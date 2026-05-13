import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { palette, priorityColor, screenTheme } from '@/lib/themes';
import { useCompleteQuest, useTodaysHunt } from '@/hooks/useQuests';
import { showQuestStamp } from './QuestStamp';

export function DashboardQuestWidget() {
  const huntQ = useTodaysHunt();
  const complete = useCompleteQuest();
  const router = useRouter();
  const accent = screenTheme.quests.accent;

  const items = huntQ.data?.items.slice(0, 3) ?? [];
  const progress = huntQ.data?.perfectDayProgress;

  if (items.length === 0) return null;

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/quests')}
      style={[styles.card, { borderColor: accent + '66' }]}>
      <View style={styles.head}>
        <View>
          <Text style={[styles.kicker, { color: accent }]}>NEXT UP</Text>
          <Text style={styles.title}>Top hunts</Text>
        </View>
        <Ionicons name="paw" size={22} color={accent} />
      </View>

      {progress && progress.total > 0 && (
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, Math.round((progress.done / progress.total) * 100))}%`,
                  backgroundColor: accent,
                },
              ]}
            />
          </View>
          <Text style={styles.progressTxt}>
            {progress.done}/{progress.total} dailies
          </Text>
        </View>
      )}

      <View style={styles.list}>
        {items.map((q) => (
          <View key={q.id} style={styles.row}>
            <View
              style={[
                styles.prio,
                { borderColor: priorityColor[q.priority] ?? accent },
              ]}>
              <Text style={[styles.prioTxt, { color: priorityColor[q.priority] ?? accent }]}>
                {q.priority}
              </Text>
            </View>
            <Text style={styles.qTitle} numberOfLines={1}>
              {q.isBoss ? '👹 ' : ''}{q.title}
            </Text>
            <Pressable
              hitSlop={6}
              onPress={async (e) => {
                e.stopPropagation?.();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                const res = await complete.mutateAsync({ id: q.id });
                showQuestStamp(q.priority, q.isBoss, res.comboActive ? res.comboCount : undefined);
              }}>
              <Ionicons name="checkmark-circle" size={22} color="#4ade80" />
            </Pressable>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 4,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: palette.text, fontSize: 16, fontWeight: '900', marginTop: 2 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBg: { flex: 1, height: 5, backgroundColor: palette.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressTxt: { color: palette.textMuted, fontSize: 11, fontWeight: '800' },
  list: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    backgroundColor: palette.bgElevated,
    borderRadius: 8,
  },
  prio: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  prioTxt: { fontSize: 11, fontWeight: '900' },
  qTitle: { flex: 1, color: palette.text, fontWeight: '700', fontSize: 13 },
});
