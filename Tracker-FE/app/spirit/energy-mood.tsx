import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { GlowButton } from '@/components/ui/GlowButton';
import { TrendLine } from '@/components/charts/TrendLine';
import { MoodSelector } from '@/components/spirit/MoodSelector';
import { AnimatedCard } from '@/components/spirit/AnimatedCard';
import { useLogWellness, useWellnessHistory, useWellnessToday } from '@/hooks/useSpirit';

export default function EnergyMoodScreen() {
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;
  const winW = Dimensions.get('window').width;

  const today = useWellnessToday();
  const history = useWellnessHistory();
  const log = useLogWellness();

  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync local state with server data once it loads (and after refetch).
  useEffect(() => {
    if (today.data) {
      setMood(today.data.mood ?? null);
      setEnergy(today.data.energyLevel ?? null);
      setStress(today.data.stressLevel ?? null);
    }
  }, [today.data]);

  const refreshing = today.isFetching || history.isFetching;
  const onRefresh = () => {
    today.refetch();
    history.refetch();
  };

  const reversed = useMemo(() => [...(history.data ?? [])].reverse(), [history.data]);
  const moodSeries = reversed.map((r) => r.mood ?? 0);
  const energySeries = reversed.map((r) => r.energyLevel ?? 0);
  const stressSeries = reversed.map((r) => r.stressLevel ?? 0);

  const handleSave = async () => {
    setError(null);
    if (mood == null && energy == null && stress == null) {
      setError('Pick at least one value first');
      return;
    }
    try {
      await log.mutateAsync({
        mood: mood ?? undefined,
        energyLevel: energy ?? undefined,
        stressLevel: stress ?? undefined,
      });
      setSavedAt(Date.now());
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save');
    }
  };

  const savedRecently = savedAt && Date.now() - savedAt < 2500;

  return (
    <ThemedScene scene="spirit">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 80 }}>
        <SpiritHeader title="Energy & Mood" subtitle="Daily check-in" accent={accent} accent2={accent2} back compact />

        {today.data && (
          <AnimatedCard index={0}>
            <View style={styles.todayPill}>
              <Ionicons name="checkmark-circle" size={14} color={accent} />
              <Text style={styles.todayLabel}>Logged today</Text>
            </View>
          </AnimatedCard>
        )}

        <SectionTitle title="Mood" accent={accent} />
        <AnimatedCard index={1}>
          <View style={{ paddingHorizontal: 20 }}>
            <MoodSelector value={mood} onChange={setMood} accent={accent} />
          </View>
        </AnimatedCard>

        <SectionTitle title="Energy" accent={accent} />
        <AnimatedCard index={2}>
          <DotRow value={energy} onChange={setEnergy} accent={accent} />
        </AnimatedCard>

        <SectionTitle title="Stress" accent={accent} />
        <AnimatedCard index={3}>
          <DotRow value={stress} onChange={setStress} accent={palette.danger} />
        </AnimatedCard>

        <View style={{ paddingHorizontal: 20, marginTop: 18, gap: 8 }}>
          <GlowButton
            title={savedRecently ? '✓ Saved' : 'Save Today'}
            color={savedRecently ? accent2 : accent}
            loading={log.isPending}
            onPress={handleSave}
          />
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={14} color={palette.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        <SectionTitle title="Mood Trend" accent={accent} />
        <View style={{ paddingHorizontal: 16 }}>
          <TrendLine values={moodSeries} color={accent} width={winW - 32} height={120} />
        </View>
        <SectionTitle title="Energy Trend" accent={accent} />
        <View style={{ paddingHorizontal: 16 }}>
          <TrendLine values={energySeries} color={accent2} width={winW - 32} height={120} />
        </View>
        <SectionTitle title="Stress Trend" accent={accent} />
        <View style={{ paddingHorizontal: 16 }}>
          <TrendLine values={stressSeries} color={palette.danger} width={winW - 32} height={120} />
        </View>
      </ScrollView>
    </ThemedScene>
  );
}

function DotRow({
  value,
  onChange,
  accent,
}: {
  value: number | null;
  onChange: (n: number) => void;
  accent: string;
}) {
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          style={[
            styles.dot,
            (value ?? 0) >= n && { backgroundColor: accent, borderColor: accent },
          ]}>
          <Text style={[styles.dotLabel, (value ?? 0) >= n && { color: '#0b0b14' }]}>{n}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    flex: 1,
    aspectRatio: 1.4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: { color: palette.text, fontWeight: '900', fontSize: 15 },
  todayPill: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  todayLabel: {
    color: spiritText.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.danger + '88',
  },
  errorText: { color: palette.danger, fontSize: 12, fontWeight: '700', flex: 1 },
});
