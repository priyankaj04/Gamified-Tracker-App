import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { ProjectCard } from '@/components/forge/ProjectCard';
import { useProjects, useTogglePin, useToggleArchive, useShipProject, useDuplicateProject, useDeleteProject } from '@/hooks/useProjects';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import type { Project, ProjectStatus } from '@/types';

const TABS: { key: string; label: string; status?: ProjectStatus; archived?: boolean }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In Progress', status: 'In Progress' },
  { key: 'backlog', label: 'Backlog', status: 'Backlog' },
  { key: 'shipped', label: 'Shipped', status: 'Shipped' },
  { key: 'archived', label: 'Archived', archived: true },
];

type SortKey = 'last' | 'created' | 'target' | 'priority';

export default function ProjectsList() {
  const router = useRouter();
  const accent = screenTheme.forge.accent;
  const accent2 = screenTheme.forge.accent2;

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('last');
  const [contextProj, setContextProj] = useState<Project | null>(null);

  const tabDef = TABS.find((t) => t.key === tab)!;
  const filters = {
    status: tabDef.status,
    archived: tabDef.archived ?? (tab === 'all' ? false : undefined),
    search: search || undefined,
  };
  const { data, isFetching, refetch } = useProjects(filters as any);
  const pin = useTogglePin();
  const archive = useToggleArchive();
  const ship = useShipProject();
  const dup = useDuplicateProject();
  const del = useDeleteProject();

  const sorted = [...(data?.projects ?? [])].sort((a, b) => {
    if (sort === 'last') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (sort === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === 'target') return (a.targetShipDate ?? 'z').localeCompare(b.targetShipDate ?? 'z');
    const order = { S: 0, A: 1, B: 2, C: 3 } as const;
    return order[a.priority] - order[b.priority];
  });

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />}>
        <PageHeader
          title="All Projects"
          subtitle="Forge"
          accent={accent}
          accent2={accent2}
          right={
            <Pressable onPress={() => router.push('/forge/project-new' as any)} hitSlop={8}>
              <Ionicons name="add" size={26} color={accent} />
            </Pressable>
          }
        />

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={palette.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.search}
            placeholder="Search name, tech, tag…"
            placeholderTextColor={palette.textDim}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, tab === t.key && { backgroundColor: accent + '22', borderColor: accent }]}>
              <Text style={[styles.tabText, tab === t.key && { color: accent }]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort:</Text>
          {(['last', 'created', 'target', 'priority'] as SortKey[]).map((k) => (
            <Pressable key={k} onPress={() => setSort(k)} style={[styles.sortChip, sort === k && { borderColor: accent }]}>
              <Text style={[styles.sortText, sort === k && { color: accent }]}>{k}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {sorted.length === 0 ? (
            <EmptyState
              icon="rocket-outline"
              title="No projects yet, Coder."
              message="What are you building? Tap + to start."
              accent={accent}
            />
          ) : (
            sorted.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                index={i}
                accent={accent}
                onPress={() => router.push(`/forge/${p.id}` as any)}
                onLongPress={() => setContextProj(p)}
              />
            ))
          )}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomSheet visible={!!contextProj} onClose={() => setContextProj(null)} title={contextProj?.name}>
        {contextProj && (
          <View style={{ gap: 8 }}>
            <GlowButton
              title={contextProj.isPinned ? 'Unpin' : 'Pin'}
              variant="ghost"
              color={accent}
              onPress={async () => {
                await pin.mutateAsync(contextProj.id);
                setContextProj(null);
              }}
            />
            <GlowButton
              title="Duplicate"
              variant="ghost"
              color={accent}
              onPress={async () => {
                await dup.mutateAsync(contextProj.id);
                setContextProj(null);
              }}
            />
            {contextProj.status !== 'Shipped' && (
              <GlowButton
                title="🚀 Ship It"
                color={accent}
                onPress={async () => {
                  await ship.mutateAsync(contextProj.id);
                  setContextProj(null);
                }}
              />
            )}
            <GlowButton
              title={contextProj.isArchived ? 'Unarchive' : 'Archive'}
              variant="ghost"
              color={palette.textMuted}
              onPress={async () => {
                await archive.mutateAsync(contextProj.id);
                setContextProj(null);
              }}
            />
            <GlowButton
              title="Delete"
              variant="ghost"
              color="#ef4444"
              onPress={async () => {
                await del.mutateAsync(contextProj.id);
                setContextProj(null);
              }}
            />
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: palette.border,
  },
  search: { flex: 1, color: palette.text, paddingVertical: 10, fontSize: 14 },
  tabsRow: { paddingHorizontal: 20, gap: 8, paddingVertical: 12 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  tabText: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginBottom: 10 },
  sortLabel: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  sortText: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
});
