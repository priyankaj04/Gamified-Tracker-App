import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { EmptyState } from '@/components/layout/EmptyState';
import { useSubscriptionsSummary, useCancelRecurring } from '@/hooks/useFinance';
import { fmtINR } from './_shared';
import { GradientCard, HeroMetric, IconTile, ColoredPill } from './_components';

export default function SubscriptionsScreen() {
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const summary = useSubscriptionsSummary();
  const cancel = useCancelRecurring();

  const subs = summary.data?.subscriptions ?? [];
  const monthlyTotal = summary.data?.monthlyTotal ?? 0;
  const yearlyTotal = monthlyTotal * 12;

  return (
    <ThemedScene scene="vault">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={summary.isFetching} onRefresh={() => summary.refetch()} />}>
        <PageHeader
          title="Subscriptions"
          subtitle={`${subs.length} draining your wallet`}
          accent={accent}
          accent2={accent2}
          right={
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        {/* Hero */}
        <View style={{ marginHorizontal: 20 }}>
          <GradientCard accent="#fb923c" accent2={palette.danger} intensity={0.18}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconTile icon="receipt" accent="#fb923c" size={48} iconSize={24} />
              <View style={{ flex: 1 }}>
                <HeroMetric
                  label="MONTHLY DRAIN"
                  value={fmtINR(monthlyTotal)}
                  accent="#fb923c"
                  caption={`≈ ${fmtINR(yearlyTotal)} per year`}
                />
              </View>
            </View>
          </GradientCard>
        </View>

        <SectionTitle title="Drain audit" accent="#fb923c" />
        {subs.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="receipt" title="No subscriptions tracked" message="Mark recurring transactions as subscriptions to see them here." accent={accent} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {subs.map((s, idx) => {
              const max = subs[0]?.amount ?? 1;
              const pct = max > 0 ? s.amount / max : 0;
              return (
                <View key={s.id} style={styles.cardWrap}>
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#10101c', borderRadius: 18 }]} />
                  <LinearGradient
                    colors={['#fb923c14', '#10101cf2', '#fb923c14']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={[StyleSheet.absoluteFillObject, { borderRadius: 18, borderWidth: 1, borderColor: '#fb923c55' }]} />
                  <View style={{ padding: 12, gap: 8 }}>
                    <View style={styles.headRow}>
                      <View style={[styles.rankBubble, { borderColor: '#fb923c99' }]}>
                        <Text style={styles.rankText}>#{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{s.name}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                          <ColoredPill label={`${s.interval}× ${s.frequency}`} color="#94a3b8" small />
                          <ColoredPill label={`next ${s.nextDue}`} color="#fbbf24" icon="time" small />
                        </View>
                      </View>
                      <Text style={[styles.amt, { color: palette.danger }]}>{fmtINR(s.amount)}</Text>
                    </View>
                    <View style={styles.track}>
                      <LinearGradient
                        colors={['#fb923c', palette.danger]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 3 }}
                      />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.shareCap}>{Math.round(pct * 100)}% of largest drain</Text>
                      <View style={{ flex: 1 }} />
                      <Pressable
                        onPress={() => cancel.mutate(s.id)}
                        style={[styles.cancelBtn, { borderColor: palette.danger + '99', backgroundColor: palette.danger + '18' }]}>
                        <Ionicons name="close-circle" size={12} color={palette.danger} />
                        <Text style={{ color: palette.danger, fontWeight: '900', fontSize: 11 }}>Cancel · +150 XP</Text>
                      </Pressable>
                    </View>
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
  cardWrap: { borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: 'rgba(244,114,182,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: '#fb923c', fontWeight: '900', fontSize: 12 },
  name: { color: palette.text, fontWeight: '900', fontSize: 14, letterSpacing: -0.2 },
  amt: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  track: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  shareCap: { color: palette.textMuted, fontSize: 10, fontWeight: '800' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
});
