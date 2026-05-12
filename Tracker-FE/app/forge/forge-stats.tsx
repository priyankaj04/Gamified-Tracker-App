import React from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { StatCard } from '@/components/ui/StatCard';
import { BarChart } from '@/components/charts/BarChart';
import { TrendLine } from '@/components/charts/TrendLine';
import { DonutChart } from '@/components/charts/DonutChart';
import {
  useBillable,
  useDailyGoal,
  useForgeSettings,
  useForgeSummary,
  useHoursByProject,
  useWeeklyChart,
  useWeeklyHours,
} from '@/hooks/useForgeStats';

export default function ForgeStats() {
  const accent = screenTheme.forge.accent;
  const summary = useForgeSummary();
  const weekly = useWeeklyHours();
  const weeklyChart = useWeeklyChart();
  const byProject = useHoursByProject();
  const goal = useDailyGoal();
  const settings = useForgeSettings();
  const month = new Date().toISOString().slice(0, 7);
  const billable = useBillable(month);

  const s = summary.data;

  const refreshAll = () => {
    summary.refetch();
    weekly.refetch();
    weeklyChart.refetch();
    byProject.refetch();
    goal.refetch();
    settings.refetch();
    billable.refetch();
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView refreshControl={<RefreshControl tintColor={accent} refreshing={summary.isFetching} onRefresh={refreshAll} />}>
        <PageHeader title="Forge Stats" subtitle="Analytics" accent={accent} accent2={screenTheme.forge.accent2} />

        <View style={styles.stats}>
          <StatCard label="Today" value={`${Math.floor((s?.todayMinutes ?? 0) / 60)}h ${(s?.todayMinutes ?? 0) % 60}m`} icon="today" accent={accent} />
          <StatCard label="Week" value={`${Math.round((s?.weekMinutes ?? 0) / 60 * 10) / 10}h`} icon="calendar" accent={accent} />
          <StatCard label="Month" value={`${Math.round((s?.monthMinutes ?? 0) / 60 * 10) / 10}h`} icon="calendar-clear" accent={accent} />
          <StatCard label="All-time" value={`${s?.allTimeHours ?? 0}h`} icon="time" accent={accent} />
          <StatCard label="Avg Session" value={`${s?.avgSessionMinutes ?? 0}m`} icon="speedometer" accent={accent} />
          <StatCard label="Consistency" value={`${s?.codingConsistency30d ?? 0}%`} icon="pulse" accent={accent} />
        </View>

        <SectionTitle title="This Week (daily hours)" accent={accent} />
        <View style={{ paddingHorizontal: 20 }}>
          <BarChart
            bars={(weekly.data?.days ?? []).map((d) => ({ label: new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' }), value: Math.round((d.minutes / 60) * 10) / 10 }))}
            color={accent}
            valueFormatter={(v) => `${v}h`}
          />
        </View>

        <SectionTitle title="12 Week Trend" accent={accent} />
        <View style={{ paddingHorizontal: 20 }}>
          <TrendLine
            values={(weeklyChart.data?.weeks ?? []).map((w) => Math.round((w.minutes / 60) * 10) / 10)}
            color={accent}
          />
        </View>

        <SectionTitle title="Hours by Project" accent={accent} />
        <View style={{ paddingHorizontal: 20 }}>
          <DonutChart
            slices={(byProject.data?.projects ?? []).map((p, i) => ({
              label: p.projectName,
              value: Math.round((p.minutes / 60) * 10) / 10,
              color: ['#22d3ee', '#a78bfa', '#fbbf24', '#4ade80', '#ef4444', '#60a5fa', '#f97316', '#e879f9', '#22c55e', '#94a3b8'][i % 10],
            }))}
          />
        </View>

        {s && (
          <>
            <SectionTitle title="Insights" accent={accent} />
            <View style={[styles.insightCard, { borderColor: accent + '33' }]}>
              <Text style={styles.insightText}>📅 You code most on <Text style={styles.bold}>{s.mostProductiveDayOfWeek}s</Text></Text>
              <Text style={styles.insightText}>🕐 Peak hour: <Text style={styles.bold}>{s.mostProductiveHourOfDay}:00</Text></Text>
              <Text style={styles.insightText}>📊 90d consistency: <Text style={styles.bold}>{s.codingConsistency90d}%</Text></Text>
            </View>

            <SectionTitle title="Personal Bests" accent={accent} />
            <View style={[styles.insightCard, { borderColor: accent + '33' }]}>
              <Text style={styles.insightText}>🏆 Longest session: <Text style={styles.bold}>{s.personalBests.longestSession} min</Text></Text>
              <Text style={styles.insightText}>🔥 Most hours / day: <Text style={styles.bold}>{s.personalBests.mostHoursInDay}h</Text></Text>
              <Text style={styles.insightText}>📈 Current streak: <Text style={styles.bold}>{s.personalBests.currentStreak}d</Text></Text>
              <Text style={styles.insightText}>🏔 Longest streak: <Text style={styles.bold}>{s.personalBests.longestStreak}d</Text></Text>
            </View>
          </>
        )}

        {settings.data?.billableRate && billable.data && billable.data.totalHours > 0 && (
          <>
            <SectionTitle title={`Billable · ${month}`} accent="#fbbf24" />
            <View style={[styles.insightCard, { borderColor: '#fbbf2433' }]}>
              <Text style={styles.insightText}>⏱ Hours: <Text style={styles.bold}>{billable.data.totalHours.toFixed(1)}h</Text></Text>
              <Text style={styles.insightText}>💰 Earnings: <Text style={[styles.bold, { color: '#fbbf24' }]}>{billable.data.currency} {billable.data.totalEarnings.toFixed(2)}</Text></Text>
              {billable.data.projects.map((p) => (
                <Text key={p.projectId} style={styles.billRow}>
                  • {p.projectName}: {p.hours.toFixed(1)}h → {billable.data!.currency} {p.earnings.toFixed(2)}
                </Text>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20 },
  insightCard: { backgroundColor: palette.card, borderRadius: 12, borderWidth: 1, padding: 14, gap: 6, marginHorizontal: 20 },
  insightText: { color: palette.textMuted, fontSize: 13 },
  bold: { color: palette.text, fontWeight: '900' },
  billRow: { color: palette.textMuted, fontSize: 12, marginTop: 4 },
});
