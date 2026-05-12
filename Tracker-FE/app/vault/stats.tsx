import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { BarChart } from '@/components/charts/BarChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { TrendLine } from '@/components/charts/TrendLine';
import { ActivityGrid } from '@/components/ui/ActivityGrid';
import { EmptyState } from '@/components/layout/EmptyState';
import {
  useVaultStats,
  useNetWorth,
  useTakeNetWorthSnapshot,
  useMarkWeeklySeen,
  useMarkMonthlySeen,
} from '@/hooks/useFinance';
import { CATEGORY_COLORS, fmtINR } from './_shared';
import { GradientCard, GradientProgress, HeroMetric, IconTile, ColoredPill } from './_components';

export default function VaultStatsScreen() {
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const [months, setMonths] = useState(12);
  const stats = useVaultStats(months);
  const netWorth = useNetWorth();
  const takeSnapshot = useTakeNetWorthSnapshot();
  const weeklySeen = useMarkWeeklySeen();
  const monthlySeen = useMarkMonthlySeen();

  const d = stats.data;
  const latestNW = netWorth.data?.snapshots?.length
    ? netWorth.data.snapshots[netWorth.data.snapshots.length - 1].netWorth
    : 0;
  const latestRate = d?.savingsRate?.at(-1)?.rate ?? 0;

  return (
    <ThemedScene scene="vault">
      <ScrollView
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={stats.isFetching}
            onRefresh={() => {
              stats.refetch();
              netWorth.refetch();
            }}
          />
        }>
        <PageHeader
          title="Reports"
          subtitle={`Vault · ${months} months`}
          accent={accent}
          accent2={accent2}
          right={
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        {/* Range + Reviews */}
        <View style={styles.rangeRow}>
          {[3, 6, 12, 24].map((m) => (
            <Pressable
              key={m}
              onPress={() => setMonths(m)}
              style={[styles.rangeChip, months === m && { backgroundColor: accent + '22', borderColor: accent }]}>
              <Text style={[styles.rangeText, months === m && { color: accent }]}>{m}m</Text>
            </Pressable>
          ))}
          <View style={{ flex: 1 }} />
          <Pressable onPress={() => weeklySeen.mutate()} style={[styles.actionLink, { borderColor: accent + '66' }]}>
            <Ionicons name="newspaper" size={12} color={accent} />
            <Text style={[styles.linkText, { color: accent }]}>Weekly</Text>
          </Pressable>
          <Pressable onPress={() => monthlySeen.mutate()} style={[styles.actionLink, { borderColor: accent + '66' }]}>
            <Ionicons name="calendar" size={12} color={accent} />
            <Text style={[styles.linkText, { color: accent }]}>Monthly</Text>
          </Pressable>
        </View>

        {!d || (d.spendingTrend.length === 0 && d.byCategory.length === 0) ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="bar-chart" title="No data yet" message="Log a few transactions to see reports." accent={accent} />
          </View>
        ) : (
          <>
            {/* Hero stats row */}
            <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <GradientCard accent={accent} intensity={0.14}>
                  <IconTile icon="flash" accent={accent} size={28} iconSize={14} />
                  <Text style={styles.heroLabel}>BURN / DAY</Text>
                  <Text style={[styles.heroVal, { color: accent }]}>{fmtINR(d.burnRate)}</Text>
                </GradientCard>
              </View>
              <View style={{ flex: 1 }}>
                <GradientCard accent="#4ade80" intensity={0.14}>
                  <IconTile icon="leaf" accent="#4ade80" size={28} iconSize={14} />
                  <Text style={styles.heroLabel}>FRUGAL DAYS</Text>
                  <Text style={[styles.heroVal, { color: '#4ade80' }]}>{d.frugalDaysThisMonth}</Text>
                </GradientCard>
              </View>
              <View style={{ flex: 1 }}>
                <GradientCard accent={accent2} intensity={0.14}>
                  <IconTile icon="trophy" accent={accent2} size={28} iconSize={14} />
                  <Text style={styles.heroLabel}>NET WORTH</Text>
                  <Text style={[styles.heroVal, { color: accent2, fontSize: 16 }]}>{fmtINR(latestNW)}</Text>
                </GradientCard>
              </View>
            </View>

            {/* Spending trend */}
            <SectionTitle title="Spending trend" accent={accent} />
            <View style={{ marginHorizontal: 20 }}>
              <GradientCard accent={accent} intensity={0.08}>
                <BarChart
                  bars={d.spendingTrend.map((s) => ({ label: s.label, value: s.value }))}
                  color={accent}
                  width={300}
                  height={170}
                  valueFormatter={(v) => fmtINR(v)}
                />
              </GradientCard>
            </View>

            {/* Income vs Expense */}
            <SectionTitle title="Income vs Expense" accent={accent} />
            <View style={{ marginHorizontal: 20 }}>
              <GradientCard accent="#4ade80" accent2={palette.danger} intensity={0.08}>
                <View style={styles.iveLegend}>
                  <View style={styles.iveLegendRow}>
                    <View style={[styles.legendDot, { backgroundColor: '#4ade80' }]} />
                    <Text style={styles.iveLegendText}>Income</Text>
                    <View style={[styles.legendDot, { backgroundColor: palette.danger }]} />
                    <Text style={styles.iveLegendText}>Expense</Text>
                  </View>
                </View>
                {d.incomeVsExpense.slice(-6).map((m) => {
                  const max = Math.max(1, ...d.incomeVsExpense.map((x) => Math.max(x.income, x.expense)));
                  const net = m.income - m.expense;
                  return (
                    <View key={m.month} style={styles.iveRow}>
                      <Text style={styles.iveLabel}>{m.month.slice(5)}</Text>
                      <View style={styles.iveBars}>
                        <GradientProgress value={m.income / max} accent="#4ade80" accent2="#22c55e" height={5} showGlow={false} />
                        <GradientProgress value={m.expense / max} accent={palette.danger} accent2="#f97316" height={5} showGlow={false} />
                      </View>
                      <Text style={[styles.iveAmt, { color: net >= 0 ? '#4ade80' : palette.danger }]}>
                        {net >= 0 ? '+' : ''}
                        {fmtINR(net)}
                      </Text>
                    </View>
                  );
                })}
              </GradientCard>
            </View>

            {/* Savings rate trend */}
            <SectionTitle title="Savings rate" accent="#4ade80" />
            <View style={{ marginHorizontal: 20 }}>
              <GradientCard accent="#4ade80" intensity={0.08}>
                <View style={styles.savRateHead}>
                  <HeroMetric
                    label="LATEST"
                    value={`${Math.round(latestRate * 100)}%`}
                    accent="#4ade80"
                    caption={latestRate >= 0.5 ? 'FIRE-ready savings 🔥' : latestRate >= 0.2 ? 'Healthy' : 'Tighten up'}
                  />
                </View>
                <View style={{ marginTop: 4 }}>
                  <TrendLine
                    values={d.savingsRate.map((p) => p.rate * 100)}
                    color="#4ade80"
                    width={300}
                    height={110}
                    valueFormatter={(v) => `${Math.round(v)}%`}
                  />
                </View>
              </GradientCard>
            </View>

            {/* Category breakdown */}
            <SectionTitle title="Categories" accent={accent} />
            <View style={{ marginHorizontal: 20 }}>
              <GradientCard accent={accent} intensity={0.08}>
                <View style={styles.donutRow}>
                  <DonutChart
                    slices={d.byCategory.map((c) => ({
                      label: c.label,
                      value: c.value,
                      color: CATEGORY_COLORS[c.label] ?? '#94a3b8',
                    }))}
                    size={160}
                    centerValue={fmtINR(d.byCategory.reduce((s, c) => s + c.value, 0))}
                    centerLabel="Spent"
                  />
                  <View style={{ flex: 1, gap: 8 }}>
                    {d.byCategory.slice(0, 6).map((c) => (
                      <View key={c.label} style={styles.legendRow}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: CATEGORY_COLORS[c.label] ?? '#94a3b8', shadowColor: CATEGORY_COLORS[c.label] ?? '#94a3b8' },
                          ]}
                        />
                        <Text style={styles.legendLabel}>{c.label}</Text>
                        <Text style={styles.legendVal}>{fmtINR(c.value)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </GradientCard>
            </View>

            {/* Top merchants */}
            {d.topMerchants.length > 0 && (
              <>
                <SectionTitle title="Top merchants" accent={accent2} />
                <View style={{ marginHorizontal: 20 }}>
                  <GradientCard accent={accent2} intensity={0.08}>
                    <View style={{ gap: 8 }}>
                      {d.topMerchants.map((m) => {
                        const max = d.topMerchants[0].value;
                        return (
                          <View key={m.label} style={styles.merchRow}>
                            <Text style={styles.merchName} numberOfLines={1}>{m.label}</Text>
                            <View style={{ flex: 1 }}>
                              <GradientProgress value={m.value / max} accent={accent2} accent2={accent} height={6} />
                            </View>
                            <Text style={styles.merchVal}>{fmtINR(m.value)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </GradientCard>
                </View>
              </>
            )}

            {/* Top expenses */}
            {d.topExpenses.length > 0 && (
              <>
                <SectionTitle title="Largest expenses" accent={palette.danger} />
                <View style={{ paddingHorizontal: 20, gap: 8 }}>
                  {d.topExpenses.map((e) => {
                    const c = CATEGORY_COLORS[e.category] ?? '#94a3b8';
                    return (
                      <View key={e.id} style={styles.expRow}>
                        <View style={[styles.stripe, { backgroundColor: c }]} />
                        <IconTile icon="cash" accent={c} size={32} iconSize={14} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.expDesc}>{e.description ?? e.merchant ?? e.category}</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                            <ColoredPill label={e.category} color={c} small />
                            <Text style={styles.expMeta}>{e.date}</Text>
                          </View>
                        </View>
                        <Text style={[styles.expAmt, { color: palette.danger }]}>{fmtINR(e.amount)}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Day of week */}
            <SectionTitle title="By day of week" accent={accent2} />
            <View style={{ marginHorizontal: 20 }}>
              <GradientCard accent={accent2} intensity={0.08}>
                <BarChart
                  bars={d.dayOfWeek}
                  color={accent2}
                  width={300}
                  height={140}
                  valueFormatter={(v) => fmtINR(v)}
                />
              </GradientCard>
            </View>

            {/* Time of day */}
            <SectionTitle title="Time of day" accent={accent} />
            <View style={styles.todRow}>
              {([
                { key: 'morning', icon: 'sunny' as const, color: '#fbbf24' },
                { key: 'afternoon', icon: 'partly-sunny' as const, color: '#fb923c' },
                { key: 'evening', icon: 'moon' as const, color: '#f59e0b' },
                { key: 'night', icon: 'moon-outline' as const, color: '#f59e0b' },
              ] as const).map((t) => (
                <View key={t.key} style={{ flex: 1 }}>
                  <GradientCard accent={t.color} intensity={0.12}>
                    <IconTile icon={t.icon} accent={t.color} size={28} iconSize={14} />
                    <Text style={styles.todLabel}>{t.key}</Text>
                    <Text style={[styles.todVal, { color: t.color }]}>
                      {fmtINR((d.timeOfDay as any)[t.key])}
                    </Text>
                  </GradientCard>
                </View>
              ))}
            </View>

            {/* Activity grid */}
            <SectionTitle title="90-day intensity" accent={accent} />
            <View style={{ marginHorizontal: 20 }}>
              <GradientCard accent={accent} intensity={0.08}>
                <ActivityGrid data={d.activityGrid} accent={accent} />
              </GradientCard>
            </View>

            {/* Tag spend */}
            {d.tagSpend.length > 0 && (
              <>
                <SectionTitle title="By tag" accent="#fb923c" />
                <View style={{ paddingHorizontal: 20, gap: 6 }}>
                  {d.tagSpend.map((t) => (
                    <View key={t.id} style={styles.tagRow}>
                      <View style={[styles.legendDot, { backgroundColor: t.color, shadowColor: t.color }]} />
                      <Text style={styles.legendLabel}>{t.name}</Text>
                      <Text style={styles.legendVal}>{fmtINR(t.amount)}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Net worth */}
            <SectionTitle
              title="Net worth"
              accent="#f59e0b"
              right={
                <Pressable
                  onPress={() => takeSnapshot.mutate(undefined)}
                  style={[styles.snapshotBtn, { borderColor: '#f59e0b', backgroundColor: '#f59e0b22' }]}>
                  <Ionicons name="camera" size={12} color="#f59e0b" />
                  <Text style={[styles.linkText, { color: '#f59e0b' }]}>Snapshot</Text>
                </Pressable>
              }
            />
            {(netWorth.data?.snapshots ?? []).length === 0 ? (
              <View style={{ paddingHorizontal: 20 }}>
                <Text style={styles.cap}>Tap snapshot to capture your current net worth.</Text>
              </View>
            ) : (
              <View style={{ marginHorizontal: 20 }}>
                <GradientCard accent="#f59e0b" intensity={0.1}>
                  <HeroMetric
                    label="CURRENT"
                    value={fmtINR(latestNW)}
                    accent="#f59e0b"
                    caption={`${netWorth.data?.snapshots?.length ?? 0} snapshots logged`}
                  />
                  <View style={{ marginTop: 10 }}>
                    <TrendLine
                      values={(netWorth.data?.snapshots ?? []).map((s) => s.netWorth)}
                      color="#f59e0b"
                      width={300}
                      height={110}
                      valueFormatter={(v) => fmtINR(v)}
                    />
                  </View>
                </GradientCard>
              </View>
            )}
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  rangeRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  rangeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#10101c',
  },
  rangeText: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(10,10,18,0.6)',
  },
  linkText: { fontSize: 11, fontWeight: '800' },
  heroLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 6,
  },
  heroVal: { fontSize: 18, fontWeight: '900', marginTop: 2, letterSpacing: -0.3 },
  iveLegend: { marginBottom: 4 },
  iveLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iveLegendText: { color: palette.textMuted, fontSize: 10, fontWeight: '800', marginRight: 8 },
  iveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  iveLabel: { color: palette.textMuted, width: 36, fontSize: 11, fontWeight: '800' },
  iveBars: { flex: 1, gap: 3 },
  iveAmt: { fontWeight: '900', fontSize: 12, width: 78, textAlign: 'right' },
  savRateHead: { marginBottom: 6 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOpacity: 0.7,
    shadowRadius: 4,
  },
  legendLabel: { color: palette.text, fontSize: 12, flex: 1, fontWeight: '700' },
  legendVal: { color: palette.textMuted, fontSize: 12, fontWeight: '800' },
  merchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  merchName: { color: palette.text, fontSize: 12, fontWeight: '800', width: 90 },
  merchVal: { color: palette.textMuted, fontSize: 12, fontWeight: '800', width: 76, textAlign: 'right' },
  stripe: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginRight: 2 },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10101c',
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingLeft: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    gap: 10,
  },
  expDesc: { color: palette.text, fontSize: 13, fontWeight: '800' },
  expMeta: { color: palette.textDim, fontSize: 10, fontWeight: '700' },
  expAmt: { fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },
  todRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  todLabel: { color: palette.textMuted, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 6 },
  todVal: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10101c',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    gap: 10,
  },
  cap: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
  snapshotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});
