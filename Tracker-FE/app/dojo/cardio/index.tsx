import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme } from '@/lib/themes';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { GlowButton } from '@/components/ui/GlowButton';
import { useCardio, useCardioStats, useDeleteCardio } from '@/hooks/useCardio';
import { useSettings, toDisplayDistance } from '@/hooks/useSettings';

export default function CardioList() {
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const { data, isFetching, refetch } = useCardio();
  const stats = useCardioStats();
  const del = useDeleteCardio();
  const settings = useSettings();
  const distUnit = settings.data?.distanceUnit ?? 'km';

  const sessions = data?.sessions ?? [];
  const totalKmDisplay = toDisplayDistance(stats.data?.totalKm ?? 0, distUnit) ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />}>
        <View style={styles.stats}>
          <StatCard label="Sessions" value={stats.data?.totalSessions ?? 0} icon="bicycle" accent={accent} />
          <StatCard
            label={`Distance (${distUnit})`}
            value={totalKmDisplay.toFixed(1)}
            icon="speedometer"
            accent={accent}
          />
          <StatCard
            label="Minutes"
            value={stats.data?.totalMinutes ?? 0}
            icon="time"
            accent={accent}
          />
        </View>

        <View style={{ height: 16 }} />
        <GlowButton title="Log Cardio" color={accent} onPress={() => router.push('/dojo/cardio/new' as any)} />

        <View style={{ height: 16 }} />
        {sessions.length === 0 ? (
          <EmptyState
            icon="bicycle"
            title="No cardio logged"
            message="Run, cycle, swim, jump rope — log a session and it feeds your streak."
            accent={accent}
          />
        ) : (
          <View style={{ gap: 8 }}>
            {sessions.map((s) => (
              <View key={s.id} style={styles.row}>
                <View style={[styles.icon, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
                  <Ionicons name="pulse" size={16} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{s.activityType}</Text>
                  <Text style={styles.meta}>
                    {new Date(s.date).toLocaleDateString()} · {s.durationMinutes} min
                    {s.distanceKm != null && ` · ${(toDisplayDistance(s.distanceKm, distUnit) ?? 0).toFixed(2)} ${distUnit}`}
                    {s.avgPaceMinPerKm != null && ` · ${s.avgPaceMinPerKm.toFixed(2)} min/${distUnit}`}
                  </Text>
                </View>
                <Pressable
                  onPress={() =>
                    Alert.alert('Delete?', 'This session will be removed.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(s.id) },
                    ])
                  }
                  hitSlop={6}
                  style={{ padding: 6 }}>
                  <Ionicons name="trash-outline" size={18} color={palette.danger} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  icon: {
    width: 32, height: 32, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: palette.text, fontWeight: '800', fontSize: 14 },
  meta: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
});
