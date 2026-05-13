import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { palette, priorityColor } from '@/lib/themes';
import { useCompleteQuest, useTodaysHunt } from '@/hooks/useQuests';
import { showQuestStamp } from './QuestStamp';

interface Props {
  accent: string;
  accent2: string;
}

export function TodaysHuntCard({ accent, accent2 }: Props) {
  const huntQ = useTodaysHunt();
  const complete = useCompleteQuest();
  const router = useRouter();

  const items = huntQ.data?.items ?? [];
  const top = items.slice(0, 5);
  const progress = huntQ.data?.perfectDayProgress ?? { total: 0, done: 0 };
  const pct = progress.total ? Math.min(100, Math.round((progress.done / progress.total) * 100)) : 0;
  const allDone = progress.total > 0 && progress.done >= progress.total;

  return (
    <View style={[styles.card, { borderColor: accent + '88' }]}>
      <LinearGradient
        colors={[accent + '33', accent2 + '11', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.head}>
        <View>
          <Text style={[styles.kicker, { color: accent }]}>TODAY'S HUNT</Text>
          <Text style={styles.title}>
            {allDone ? 'Perfect day cleared' : top.length === 0 ? 'No active hunts' : `${top.length} target${top.length === 1 ? '' : 's'}`}
          </Text>
        </View>
        <Ionicons name={allDone ? 'trophy' : 'paw'} size={26} color={accent} />
      </View>

      {progress.total > 0 && (
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${pct}%`,
                  backgroundColor: allDone ? '#4ade80' : accent,
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
        {top.length === 0 ? (
          <Text style={styles.emptyTxt}>
            Drop a quest with the + button — your hunt board fills as you add S/A-rank or daily quests.
          </Text>
        ) : (
          top.map((q) => (
            <View key={q.id} style={styles.row}>
              <View
                style={[
                  styles.prio,
                  { backgroundColor: (priorityColor[q.priority] ?? accent) + '33', borderColor: priorityColor[q.priority] ?? accent },
                ]}>
                <Text style={[styles.prioTxt, { color: priorityColor[q.priority] ?? accent }]}>
                  {q.priority}
                </Text>
              </View>
              <Pressable style={{ flex: 1 }} onPress={() => router.push(`/quest/${q.id}`)}>
                <Text style={styles.qTitle} numberOfLines={1}>
                  {q.isBoss ? '👹 ' : ''}{q.title}
                </Text>
                <Text style={styles.qSub} numberOfLines={1}>
                  {q.isDaily ? 'Daily' : q.dueDate ? `Due ${new Date(q.dueDate).toLocaleDateString()}` : 'Priority'}
                </Text>
              </Pressable>
              <Pressable
                hitSlop={6}
                onPress={async () => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  const res = await complete.mutateAsync({ id: q.id });
                  showQuestStamp(q.priority, q.isBoss, res.comboActive ? res.comboCount : undefined);
                }}>
                <Ionicons name="checkmark-circle" size={26} color="#4ade80" />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: palette.card,
    padding: 14,
    gap: 12,
    overflow: 'hidden',
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: palette.text, fontSize: 18, fontWeight: '900', marginTop: 2 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBg: { flex: 1, height: 6, backgroundColor: palette.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressTxt: { color: palette.textMuted, fontSize: 11, fontWeight: '800' },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(11,11,20,0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 10,
  },
  prio: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  prioTxt: { fontWeight: '900', fontSize: 12 },
  qTitle: { color: palette.text, fontWeight: '700', fontSize: 13 },
  qSub: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  emptyTxt: { color: palette.textMuted, fontSize: 13, fontStyle: 'italic' },
});
