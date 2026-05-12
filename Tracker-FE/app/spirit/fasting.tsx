import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { StatCard } from '@/components/ui/StatCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { FastingClock } from '@/components/spirit/FastingClock';
import { EmptyState } from '@/components/layout/EmptyState';
import { XPBadge } from '@/components/gamification/XPBadge';
import { useActiveFast, useFasts, useFastingStats, useStartFast, useEndFast } from '@/hooks/useFasting';
import { scheduleFastTargetNotification, cancelFastNotifications } from '@/lib/notifications';

const PRESETS = [16, 18, 20, 24];

export default function FastingScreen() {
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;

  const active = useActiveFast();
  const list = useFasts();
  const stats = useFastingStats();
  const start = useStartFast();
  const end = useEndFast();

  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('16');

  const refreshing = active.isFetching || list.isFetching;
  const onRefresh = () => {
    active.refetch();
    list.refetch();
    stats.refetch();
  };

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 80 }}>
        <SpiritHeader title="Fasting" subtitle="Intermittent · Window" accent={accent} accent2={accent2} back compact />

        <View style={{ alignItems: 'center' }}>
          <FastingClock
            startTime={active.data?.startTime ?? null}
            targetHours={active.data?.targetHours ?? 16}
          />
        </View>

        <View style={{ alignItems: 'center', marginTop: 14 }}>
          {active.data ? (
            <GlowButton
              title="End Fast"
              color={accent}
              loading={end.isPending}
              onPress={async () => {
                await cancelFastNotifications();
                end.mutate({});
              }}
              style={{ minWidth: 200 }}
            />
          ) : (
            <GlowButton
              title="Start Fast"
              color={accent}
              onPress={() => setOpen(true)}
              style={{ minWidth: 200 }}
            />
          )}
        </View>

        <View style={[styles.statsRow, { marginTop: 18 }]}>
          <StatCard label="Longest" value={stats.data?.longestFast ? `${stats.data.longestFast}h` : '—'} accent={accent} />
          <StatCard label="Completed" value={stats.data?.completedFasts ?? 0} accent={accent2} />
          <StatCard label="Streak" value={stats.data?.currentStreak ?? 0} accent={accent} />
        </View>

        <SectionTitle title="History" accent={accent} />
        {list.data && list.data.length > 0 ? (
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {list.data.map((s) => (
              <View key={s.id} style={styles.row}>
                <Text style={styles.date}>{new Date(s.startTime).toLocaleDateString()}</Text>
                <Text style={styles.text}>
                  {s.actualHours}h / {s.targetHours}h
                </Text>
                <Ionicons
                  name={s.completed ? 'checkmark-circle' : 'close-circle'}
                  size={18}
                  color={s.completed ? accent : palette.danger}
                />
                <XPBadge amount={s.xpEarned} color={accent2} />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="timer" title="No fasts yet" message="Start your first fast to begin tracking." accent={accent} />
          </View>
        )}
      </ScrollView>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Start Fast">
        <Text style={styles.fieldLabel}>Choose target hours</Text>
        <View style={styles.presets}>
          {PRESETS.map((h) => (
            <Pressable
              key={h}
              onPress={() => setCustom(String(h))}
              style={[styles.preset, custom === String(h) && { borderColor: accent, backgroundColor: accent + '22' }]}>
              <Text style={[styles.presetVal, custom === String(h) && { color: accent }]}>{h}h</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Or custom (hours)</Text>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          keyboardType="number-pad"
          style={styles.input}
          placeholderTextColor={spiritText.tertiary}
        />
        <View style={{ height: 14 }} />
        <GlowButton
          title="Start"
          color={accent}
          loading={start.isPending}
          onPress={async () => {
            const h = parseFloat(custom);
            if (!h) return;
            await start.mutateAsync({ targetHours: h });
            await cancelFastNotifications();
            await scheduleFastTargetNotification(h * 3600);
            setOpen(false);
          }}
        />
      </BottomSheet>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  date: { color: spiritText.secondary, fontSize: 12, fontWeight: '800', width: 100 },
  text: { color: palette.text, fontSize: 14, fontWeight: '800', flex: 1 },
  xp: { fontWeight: '900', fontSize: 12 },
  fieldLabel: {
    color: spiritText.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  presets: { flexDirection: 'row', gap: 8 },
  preset: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: palette.card,
    borderWidth: 1.5,
    borderColor: palette.border,
    alignItems: 'center',
  },
  presetVal: { color: spiritText.secondary, fontWeight: '900', fontSize: 18 },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
});
