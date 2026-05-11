import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, rarityColor } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { BadgeCard } from '@/components/gamification/BadgeCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { useBadges } from '@/hooks/useBadges';
import type { Rarity, Module } from '@/types';

type Filter = 'All' | Rarity | 'Locked' | 'Unlocked' | Module | 'global';

const MAIN_FILTERS: Filter[] = ['All', 'Unlocked', 'Locked'];
const RARITY_FILTERS: Filter[] = ['Common', 'Rare', 'Epic', 'Legendary'];

export default function HallScreen() {
  const { data, isLoading } = useBadges();
  const [filter, setFilter] = useState<Filter>('All');

  const badges = data?.badges ?? [];
  const summary = data?.summary;

  const filtered = useMemo(() => {
    if (filter === 'All') return badges;
    if (filter === 'Unlocked') return badges.filter((b) => b.unlocked);
    if (filter === 'Locked') return badges.filter((b) => !b.unlocked);
    if (['Common', 'Rare', 'Epic', 'Legendary'].includes(filter as any)) {
      return badges.filter((b) => b.rarity === filter);
    }
    return badges.filter((b) => b.module === filter);
  }, [badges, filter]);

  return (
    <ThemedScene scene="hall">
      <LinearGradient
        colors={['transparent', 'rgba(7,7,16,0.55)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}>
        <Text style={styles.heroLabel}>HALL OF POWER</Text>
        <Text style={styles.heroTitle}>
          {summary?.unlocked ?? 0} / {summary?.total ?? 0} Unlocked
        </Text>
        <Text style={styles.heroSub}>
          {(badges.filter((b) => b.unlocked).reduce((s, b) => s + b.xpReward, 0)).toLocaleString()} XP from Badges
        </Text>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {[...MAIN_FILTERS, ...RARITY_FILTERS].map((f) => {
          const active = filter === f;
          const c = RARITY_FILTERS.includes(f) ? rarityColor[f as Rarity] : '#a78bfa';
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, active && { borderColor: c, backgroundColor: c + '22' }]}>
              <Text style={[styles.chipText, active && { color: c }]}>{f}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {isLoading ? (
          <EmptyState icon="hourglass" title="Loading badges…" accent="#a78bfa" />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search" title="No badges match this filter" accent="#a78bfa" />
        ) : (
          <View style={styles.grid}>
            {filtered.map((b) => (
              <View key={b.id} style={styles.cell}>
                <BadgeCard badge={b} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 18,
    gap: 4,
  },
  heroLabel: {
    color: '#a78bfa',
    letterSpacing: 1.5,
    fontWeight: '800',
    fontSize: 11,
  },
  heroTitle: { color: palette.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.4 },
  heroSub: { color: palette.textMuted, fontSize: 13, marginTop: 2 },
  filterRow: { paddingHorizontal: 16, gap: 6, paddingVertical: 12 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    marginRight: 6,
  },
  chipText: { color: palette.textMuted, fontWeight: '700', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '48%' },
});
