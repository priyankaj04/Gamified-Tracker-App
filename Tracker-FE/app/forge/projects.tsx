import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { ProjectCard } from '@/components/forge/ProjectCard';
import {
  useProjects,
  useTogglePin,
  useToggleArchive,
  useShipProject,
  useDuplicateProject,
  useDeleteProject,
} from '@/hooks/useProjects';
import type { Project, ProjectStatus } from '@/types';

interface TabDef {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  status?: ProjectStatus;
  archived?: boolean;
}

const TABS: TabDef[] = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'in_progress', label: 'In Progress', icon: 'flash', status: 'In Progress' },
  { key: 'backlog', label: 'Backlog', icon: 'time', status: 'Backlog' },
  { key: 'shipped', label: 'Shipped', icon: 'rocket', status: 'Shipped' },
  { key: 'archived', label: 'Archived', icon: 'archive', archived: true },
];

type SortKey = 'last' | 'created' | 'target' | 'priority';

const SORT_LABEL: Record<SortKey, string> = {
  last: 'Last active',
  created: 'Newest',
  target: 'Target date',
  priority: 'Priority',
};

export default function ProjectsList() {
  const router = useRouter();
  const accent = screenTheme.forge.accent;
  const accent2 = screenTheme.forge.accent2;

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('last');
  const [sortOpen, setSortOpen] = useState(false);
  const [contextProj, setContextProj] = useState<Project | null>(null);

  const tabDef = TABS.find((t) => t.key === tab)!;
  const filters = {
    status: tabDef.status,
    archived: tabDef.archived ?? (tab === 'all' ? false : undefined),
    search: search || undefined,
  };
  const { data, isFetching, refetch } = useProjects(filters as any);
  const all = useProjects({});

  const pin = useTogglePin();
  const archive = useToggleArchive();
  const ship = useShipProject();
  const dup = useDuplicateProject();
  const del = useDeleteProject();

  const sorted = useMemo(() => {
    const arr = [...(data?.projects ?? [])];
    arr.sort((a, b) => {
      if (sort === 'last') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sort === 'created') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'target') return (a.targetShipDate ?? 'z').localeCompare(b.targetShipDate ?? 'z');
      const order = { S: 0, A: 1, B: 2, C: 3 } as const;
      return order[a.priority] - order[b.priority];
    });
    return arr;
  }, [data?.projects, sort]);

  // Summary stats (across all non-archived projects).
  const summary = useMemo(() => {
    const list = (all.data?.projects ?? []).filter((p) => !p.isArchived);
    return {
      total: list.length,
      inProgress: list.filter((p) => p.status === 'In Progress').length,
      shipped: list.filter((p) => p.status === 'Shipped').length,
      hours: list.reduce((s, p) => s + p.totalHours, 0),
    };
  }, [all.data]);

  const tabCount = (t: TabDef) => {
    const list = all.data?.projects ?? [];
    if (t.key === 'all') return list.filter((p) => !p.isArchived).length;
    if (t.archived) return list.filter((p) => p.isArchived).length;
    return list.filter((p) => p.status === t.status && !p.isArchived).length;
  };

  return (
    <ThemedScene scene="forge" dim={0.78}>
      <ScrollView
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={isFetching}
            onRefresh={() => {
              refetch();
              all.refetch();
            }}
          />
        }>
        <PageHeader
          title="All Projects"
          subtitle="Forge"
          accent={accent}
          accent2={accent2}
          right={
            <Pressable
              onPress={() => router.push('/forge/project-new' as any)}
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
              hitSlop={8}>
              <Ionicons name="add" size={20} color="#0b0b14" />
            </Pressable>
          }
        />

        {/* Summary stats */}
        <View style={styles.summary}>
          <SummaryCell label="Total" value={summary.total} icon="apps" color={accent} />
          <View style={styles.divider} />
          <SummaryCell label="In Progress" value={summary.inProgress} icon="flash" color="#22d3ee" />
          <View style={styles.divider} />
          <SummaryCell label="Shipped" value={summary.shipped} icon="rocket" color="#4ade80" />
          <View style={styles.divider} />
          <SummaryCell
            label="Hours"
            value={summary.hours.toFixed(1)}
            icon="time"
            color="#a78bfa"
          />
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={palette.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.search}
            placeholder="Search name, tech, tag…"
            placeholderTextColor={palette.textDim}
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={palette.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Status tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}>
          {TABS.map((t) => {
            const active = tab === t.key;
            const count = tabCount(t);
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[
                  styles.tab,
                  active && { backgroundColor: accent + '22', borderColor: accent },
                ]}>
                <Ionicons
                  name={t.icon}
                  size={13}
                  color={active ? accent : palette.textMuted}
                />
                <Text style={[styles.tabText, active && { color: accent }]}>{t.label}</Text>
                <View
                  style={[
                    styles.tabCount,
                    active && { backgroundColor: accent + '33' },
                  ]}>
                  <Text style={[styles.tabCountText, active && { color: accent }]}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Sort row */}
        <View style={styles.sortRow}>
          <Text style={styles.resultCount}>
            {sorted.length} {sorted.length === 1 ? 'project' : 'projects'}
          </Text>
          <Pressable onPress={() => setSortOpen(true)} style={styles.sortBtn}>
            <Ionicons name="swap-vertical" size={13} color={accent} />
            <Text style={[styles.sortText, { color: accent }]}>{SORT_LABEL[sort]}</Text>
          </Pressable>
        </View>

        {/* List */}
        <View style={{ paddingHorizontal: 20 }}>
          {sorted.length === 0 ? (
            <EmptyState
              icon="rocket-outline"
              title="No projects yet, Coder."
              message={search ? 'No matches. Try different keywords.' : 'What are you building? Tap + to start.'}
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

      {/* Sort bottom sheet */}
      <BottomSheet visible={sortOpen} onClose={() => setSortOpen(false)} title="Sort by">
        <View style={{ gap: 8 }}>
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <Pressable
              key={k}
              onPress={() => {
                setSort(k);
                setSortOpen(false);
              }}
              style={[
                styles.sortOption,
                sort === k && { borderColor: accent, backgroundColor: accent + '22' },
              ]}>
              <Text style={[styles.sortOptText, sort === k && { color: accent }]}>
                {SORT_LABEL[k]}
              </Text>
              {sort === k && <Ionicons name="checkmark" size={18} color={accent} />}
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      {/* Context menu */}
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
    </ThemedScene>
  );
}

function SummaryCell({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <View style={styles.summaryCell}>
      <View style={[styles.summaryIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22d3ee',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22d3ee',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    paddingVertical: 14,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  summaryCell: { flex: 1, alignItems: 'center', gap: 4 },
  summaryIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  summaryValue: { fontWeight: '900', fontSize: 18, letterSpacing: -0.3 },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  divider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: palette.border },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginTop: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  search: { flex: 1, color: palette.text, paddingVertical: 10, fontSize: 14 },
  tabsRow: { paddingHorizontal: 20, gap: 8, paddingVertical: 14 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  tabText: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
  tabCount: {
    backgroundColor: palette.cardAlt,
    paddingHorizontal: 6,
    minWidth: 18,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountText: { color: palette.textMuted, fontWeight: '900', fontSize: 10 },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  resultCount: { color: palette.textMuted, fontWeight: '700', fontSize: 12 },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  sortText: { fontSize: 11, fontWeight: '800' },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  sortOptText: { color: palette.text, fontWeight: '800', fontSize: 14 },
});
