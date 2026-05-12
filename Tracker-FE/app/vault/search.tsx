import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { EmptyState } from '@/components/layout/EmptyState';
import { useTransactions, useDeleteTx, useVaultTags } from '@/hooks/useFinance';
import { CATEGORIES, CATEGORY_COLORS, fmtINR } from './_shared';
import { IconTile, ColoredPill } from './_components';

export default function SearchScreen() {
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'' | 'Income' | 'Expense'>('');
  const [category, setCategory] = useState<string>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [tagId, setTagId] = useState<string>('');

  const tags = useVaultTags();
  const txs = useTransactions({
    search: search || undefined,
    type: type || undefined,
    category: category || undefined,
    from: from || undefined,
    to: to || undefined,
    tagId: tagId || undefined,
    limit: 200,
  });
  const del = useDeleteTx();

  return (
    <ThemedScene scene="vault">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={txs.isFetching} onRefresh={() => txs.refetch()} />}>
        <PageHeader
          title="Search"
          subtitle={`${txs.data?.transactions?.length ?? 0} matches`}
          accent={accent}
          accent2={accent2}
          right={
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color={accent} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search description / merchant"
              placeholderTextColor={palette.textDim}
              style={styles.searchInput}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={6}>
                <Ionicons name="close-circle" size={16} color={palette.textDim} />
              </Pressable>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['', 'Expense', 'Income'] as const).map((t) => (
                <Pressable
                  key={t || 'all'}
                  onPress={() => setType(t)}
                  style={[styles.chip, type === t && { backgroundColor: accent + '22', borderColor: accent }]}>
                  <Text style={[styles.chipText, type === t && { color: accent }]}>{t || 'Both'}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                onPress={() => setCategory('')}
                style={[styles.chip, category === '' && { backgroundColor: accent + '22', borderColor: accent }]}>
                <Text style={[styles.chipText, category === '' && { color: accent }]}>All</Text>
              </Pressable>
              {CATEGORIES.map((c) => {
                const cColor = CATEGORY_COLORS[c] ?? '#94a3b8';
                const active = category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory((cur) => (cur === c ? '' : c))}
                    style={[styles.chip, active && { backgroundColor: cColor + '22', borderColor: cColor }]}>
                    <View style={[styles.dotMini, { backgroundColor: cColor }]} />
                    <Text style={[styles.chipText, active && { color: cColor }]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {(tags.data?.tags ?? []).length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Pressable
                  onPress={() => setTagId('')}
                  style={[styles.chip, tagId === '' && { backgroundColor: accent + '22', borderColor: accent }]}>
                  <Text style={[styles.chipText, tagId === '' && { color: accent }]}>Any tag</Text>
                </Pressable>
                {(tags.data?.tags ?? []).map((t) => {
                  const active = tagId === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => setTagId((cur) => (cur === t.id ? '' : t.id))}
                      style={[styles.chip, active && { backgroundColor: t.color + '22', borderColor: t.color }]}>
                      <View style={[styles.dotMini, { backgroundColor: t.color }]} />
                      <Text style={[styles.chipText, active && { color: t.color }]}>{t.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              value={from}
              onChangeText={setFrom}
              placeholder="From YYYY-MM-DD"
              placeholderTextColor={palette.textDim}
              style={[styles.input, { flex: 1 }]}
            />
            <TextInput
              value={to}
              onChangeText={setTo}
              placeholder="To YYYY-MM-DD"
              placeholderTextColor={palette.textDim}
              style={[styles.input, { flex: 1 }]}
            />
          </View>
        </View>

        <SectionTitle title="Results" accent={accent} />
        {(txs.data?.transactions ?? []).length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="search" title="No results" accent={accent} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {(txs.data?.transactions ?? []).map((t) => {
              const c = CATEGORY_COLORS[t.category] ?? '#94a3b8';
              return (
                <View key={t.id} style={styles.row}>
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#10101c', borderRadius: 14 }]} />
                  <LinearGradient
                    colors={[c + '24', '#10101cf2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={[StyleSheet.absoluteFillObject, { borderRadius: 14, borderWidth: 1, borderColor: c + '44' }]} />
                  <View style={styles.rowBody}>
                    <IconTile
                      icon={t.type === 'Income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                      accent={t.type === 'Income' ? '#4ade80' : c}
                      size={32}
                      iconSize={16}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.desc} numberOfLines={1}>{t.description ?? t.merchant ?? t.category}</Text>
                      <View style={{ flexDirection: 'row', gap: 4, marginTop: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <ColoredPill label={t.category} color={c} small />
                        <Text style={styles.meta}>{t.date}</Text>
                        {t.tags && t.tags.length > 0 && (
                          <Text style={styles.meta}>· {t.tags.map((tg) => tg.name).join(', ')}</Text>
                        )}
                      </View>
                    </View>
                    <Text style={[styles.amt, { color: t.type === 'Income' ? '#4ade80' : '#f87171' }]}>
                      {t.type === 'Income' ? '+' : '-'}{fmtINR(t.amount)}
                    </Text>
                    <Pressable onPress={() => del.mutate(t.id)} hitSlop={6}>
                      <Ionicons name="trash" size={14} color={palette.textDim} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 60 }} />
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: '#10101c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  searchInput: { flex: 1, color: palette.text, paddingVertical: 13, fontSize: 14, fontWeight: '700' },
  input: {
    backgroundColor: '#10101c',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    color: palette.text,
    padding: 11,
    fontSize: 12,
    fontWeight: '700',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#10101c',
  },
  chipText: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
  dotMini: { width: 7, height: 7, borderRadius: 4 },
  row: { borderRadius: 14, overflow: 'hidden' },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  desc: { color: palette.text, fontSize: 13, fontWeight: '800' },
  meta: { color: palette.textDim, fontSize: 10, fontWeight: '700' },
  amt: { fontSize: 13, fontWeight: '900' },
});
