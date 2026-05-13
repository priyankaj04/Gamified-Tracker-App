import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, priorityColor, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { useQuests } from '@/hooks/useQuests';

const toISO = (d: Date) => d.toISOString().slice(0, 10);
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function QuestCalendarScreen() {
  const router = useRouter();
  const accent = screenTheme.quests.accent;
  const accent2 = screenTheme.quests.accent2;
  const today = toISO(new Date());

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const activeQ = useQuests({ completed: false });

  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const leading = first.getDay();
    const days: Array<{ iso: string | null; date: Date | null }> = [];
    for (let i = 0; i < leading; i++) days.push({ iso: null, date: null });
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      days.push({ iso: toISO(d), date: d });
    }
    return days;
  }, [cursor]);

  const byDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of activeQ.data?.quests ?? []) {
      if (q.dueDate) map.set(q.dueDate, (map.get(q.dueDate) ?? 0) + 1);
    }
    return map;
  }, [activeQ.data]);

  const [selected, setSelected] = useState<string>(today);
  const selectedQuests = (activeQ.data?.quests ?? []).filter((q) => q.dueDate === selected);
  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <ThemedScene scene="quests">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={activeQ.isFetching} onRefresh={activeQ.refetch} />
        }>
        <PageHeader
          title="Calendar"
          subtitle="Quest Schedule"
          accent={accent}
          accent2={accent2}
          right={
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        <View style={[styles.calCard, { borderColor: accent + '66' }]}>
          <View style={styles.calHead}>
            <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} hitSlop={6}>
              <Ionicons name="chevron-back" size={22} color={accent} />
            </Pressable>
            <Text style={styles.monthLbl}>{monthLabel}</Text>
            <Pressable onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} hitSlop={6}>
              <Ionicons name="chevron-forward" size={22} color={accent} />
            </Pressable>
          </View>

          <View style={styles.daysRow}>
            {DAY_LABELS.map((d, i) => (
              <Text key={i} style={styles.dayLbl}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {monthDays.map((d, i) => {
              if (!d.iso || !d.date) return <View key={i} style={styles.cell} />;
              const count = byDate.get(d.iso) ?? 0;
              const isToday = d.iso === today;
              const isSel = d.iso === selected;
              return (
                <Pressable
                  key={i}
                  onPress={() => setSelected(d.iso!)}
                  style={[
                    styles.cell,
                    styles.cellActive,
                    isToday && { borderColor: accent2 + '88' },
                    isSel && { backgroundColor: accent + '33', borderColor: accent },
                  ]}>
                  <Text style={[styles.dayNum, isSel && { color: accent }]}>{d.date.getDate()}</Text>
                  {count > 0 && (
                    <View style={[styles.dot, { backgroundColor: accent }]}>
                      <Text style={styles.dotTxt}>{count}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <SectionTitle title={`${selected === today ? 'Today' : new Date(selected).toLocaleDateString()}`} accent={accent} />
        <View style={{ paddingHorizontal: 20, gap: 8 }}>
          {selectedQuests.length === 0 ? (
            <Text style={{ color: palette.textMuted, fontSize: 13 }}>
              No quests on this date.
            </Text>
          ) : (
            selectedQuests.map((q) => (
              <Pressable
                key={q.id}
                onPress={() => router.push(`/quest/${q.id}`)}
                style={styles.questRow}>
                <View style={[styles.prio, { borderColor: priorityColor[q.priority] }]}>
                  <Text style={[styles.prioTxt, { color: priorityColor[q.priority] }]}>{q.priority}</Text>
                </View>
                <Text style={styles.qTitle} numberOfLines={1}>
                  {q.isBoss ? '👹 ' : ''}{q.title}
                </Text>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  calCard: {
    marginHorizontal: 20,
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  monthLbl: { color: palette.text, fontSize: 15, fontWeight: '900', letterSpacing: 0.4 },
  daysRow: { flexDirection: 'row' },
  dayLbl: {
    flex: 1,
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.6,
    paddingBottom: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 2,
  },
  cellActive: {
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNum: { color: palette.text, fontSize: 13, fontWeight: '700' },
  dot: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dotTxt: { color: '#0b0b14', fontSize: 9, fontWeight: '900' },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  prio: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  prioTxt: { fontSize: 12, fontWeight: '900' },
  qTitle: { color: palette.text, fontSize: 13, fontWeight: '700', flex: 1 },
});
