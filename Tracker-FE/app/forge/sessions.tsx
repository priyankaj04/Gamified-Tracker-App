import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { SessionCard } from '@/components/forge/SessionCard';
import { useDeleteSession, useSessions } from '@/hooks/useSessions';

export default function SessionsList() {
  const router = useRouter();
  const accent = screenTheme.forge.accent;
  const { data, isFetching, refetch } = useSessions({ limit: 200 });
  const del = useDeleteSession();
  const sessions = data?.sessions ?? [];

  // group by ISO week
  const grouped = sessions.reduce<Record<string, typeof sessions>>((acc, s) => {
    const d = new Date(s.date);
    d.setDate(d.getDate() - d.getDay());
    const key = d.toISOString().split('T')[0];
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView refreshControl={<RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />}>
        <PageHeader
          title="All Sessions"
          subtitle="Forge"
          accent={accent}
          accent2={screenTheme.forge.accent2}
          right={
            <Pressable onPress={() => router.push('/forge/session-new' as any)} hitSlop={8}>
              <Ionicons name="add" size={26} color={accent} />
            </Pressable>
          }
        />

        <View style={{ paddingHorizontal: 20 }}>
          {sessions.length === 0 && (
            <EmptyState
              icon="terminal-outline"
              title="No sessions yet."
              message="Start your first coding session."
              accent={accent}
            />
          )}
          {Object.entries(grouped).map(([weekStart, list]) => (
            <View key={weekStart} style={{ marginBottom: 14 }}>
              <Text style={styles.weekLabel}>
                Week of {new Date(weekStart).toLocaleDateString()} ·{' '}
                {Math.round(list.reduce((s, x) => s + x.durationMinutes, 0) / 60 * 10) / 10}h
              </Text>
              {list.map((s) => (
                <Pressable
                  key={s.id}
                  onLongPress={() =>
                    Alert.alert('Delete this session?', undefined, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(s.id) },
                    ])
                  }>
                  <SessionCard session={s} accent={accent} />
                </Pressable>
              ))}
            </View>
          ))}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  weekLabel: { color: palette.textMuted, fontWeight: '900', fontSize: 11, letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' },
});
