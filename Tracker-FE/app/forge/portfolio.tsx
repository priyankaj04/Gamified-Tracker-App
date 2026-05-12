import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert, Share, Linking, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/layout/EmptyState';
import { TechTag } from '@/components/forge/TechTag';
import { usePortfolio } from '@/hooks/useProjects';
import { api } from '@/lib/api';

export default function Portfolio() {
  const accent = screenTheme.forge.accent;
  const { data, isFetching, refetch } = usePortfolio();
  const items = data?.projects ?? [];

  // Top techs derivation
  const techCount: Record<string, number> = {};
  items.forEach((p) => (p.techStack ?? []).forEach((t) => { techCount[t] = (techCount[t] ?? 0) + 1; }));
  const topTechs = Object.entries(techCount).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);

  const onExport = async () => {
    try {
      const res = await api.get('/projects/portfolio/export');
      await Share.share({ message: JSON.stringify(res.data.data, null, 2) });
    } catch (e: any) {
      Alert.alert('Failed', e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView refreshControl={<RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />}>
        <PageHeader
          title="Portfolio"
          subtitle="Forge"
          accent={accent}
          accent2={screenTheme.forge.accent2}
          right={
            <Pressable onPress={onExport} hitSlop={8}>
              <Ionicons name="share-outline" size={22} color={accent} />
            </Pressable>
          }
        />

        <View style={styles.headerCard}>
          <Text style={styles.bigNumber}>{items.length}</Text>
          <Text style={styles.label}>Shipped Projects</Text>
          {topTechs.length > 0 && (
            <Text style={styles.tech}>Top: {topTechs.join(' · ')}</Text>
          )}
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {items.length === 0 && (
            <EmptyState icon="briefcase-outline" title="Empty portfolio." message="Toggle a project as portfolio from its detail screen." accent={accent} />
          )}
          {items.map((p) => (
            <View key={p.id} style={[styles.card, { borderColor: p.coverColor + '55' }]}>
              <View style={styles.cardHead}>
                <Text style={styles.emoji}>{p.coverEmoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{p.name}</Text>
                  {p.shippedDate && <Text style={styles.shipped}>Shipped {new Date(p.shippedDate).toLocaleDateString()}</Text>}
                </View>
              </View>
              {p.description && <Text style={styles.desc}>{p.description}</Text>}
              {(p.techStack ?? []).length > 0 && (
                <View style={styles.tags}>
                  {p.techStack.map((t) => <TechTag key={t} label={t} color={accent} small />)}
                </View>
              )}
              <View style={styles.links}>
                {p.githubUrl && (
                  <Pressable onPress={() => Linking.openURL(p.githubUrl!)} style={styles.linkBtn}>
                    <Ionicons name="logo-github" size={14} color={accent} />
                  </Pressable>
                )}
                {p.demoUrl && (
                  <Pressable onPress={() => Linking.openURL(p.demoUrl!)} style={styles.linkBtn}>
                    <Ionicons name="open" size={14} color={accent} />
                  </Pressable>
                )}
                <View style={{ flex: 1 }} />
                <Text style={styles.hours}>{p.totalHours.toFixed(1)}h</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: { backgroundColor: palette.card, borderRadius: 14, borderWidth: 1, borderColor: palette.border, padding: 18, alignItems: 'center', marginHorizontal: 20, gap: 4 },
  bigNumber: { color: '#22d3ee', fontSize: 44, fontWeight: '900' },
  label: { color: palette.textMuted, fontWeight: '800', fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' },
  tech: { color: palette.textMuted, fontSize: 12, marginTop: 6 },
  card: { backgroundColor: palette.card, borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginTop: 14 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 30 },
  cardTitle: { color: palette.text, fontWeight: '900', fontSize: 16 },
  shipped: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  desc: { color: palette.textMuted, fontSize: 12, lineHeight: 17 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  links: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkBtn: { backgroundColor: palette.cardAlt, width: 30, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  hours: { color: palette.textMuted, fontWeight: '900', fontSize: 12 },
});
