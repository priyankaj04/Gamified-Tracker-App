import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { StatCard } from '@/components/ui/StatCard';
import { DonutChart } from '@/components/charts/DonutChart';
import { EmptyState } from '@/components/layout/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { useTransactions, useBudget, useCreateTx } from '@/hooks/useFinance';
import type { TxType } from '@/types';

const CATEGORIES = [
  'Food',
  'Transport',
  'Entertainment',
  'Health',
  'Shopping',
  'Education',
  'Investment',
  'Other',
];

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#fbbf24',
  Transport: '#22d3ee',
  Entertainment: '#e879f9',
  Health: '#4ade80',
  Shopping: '#f97316',
  Education: '#818cf8',
  Investment: '#a3e635',
  Other: '#94a3b8',
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function VaultScreen() {
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const month = currentMonth();
  const tx = useTransactions({ month });
  const budget = useBudget(month);
  const createTx = useCreateTx();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxType>('Expense');
  const [category, setCategory] = useState('Food');
  const [desc, setDesc] = useState('');

  const transactions = tx.data?.transactions ?? [];

  const grouped = useMemo(() => {
    const map: Record<string, typeof transactions> = {};
    transactions.forEach((t) => {
      const k = t.date;
      if (!map[k]) map[k] = [];
      map[k].push(t);
    });
    return Object.entries(map).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [transactions]);

  const slices = useMemo(() => {
    const totals = (budget.data?.actual?.byCategory ?? {}) as Record<string, number>;
    return Object.entries(totals).map(([label, value]) => ({
      label,
      value,
      color: CATEGORY_COLORS[label] ?? '#94a3b8',
    }));
  }, [budget.data]);

  const totalExp = budget.data?.actual?.totalExpenses ?? 0;
  const totalInc = budget.data?.actual?.totalIncome ?? 0;
  const netSav = budget.data?.actual?.netSavings ?? 0;
  const savingsTarget = budget.data?.budget?.savingsTarget ?? 0;
  const savingsPct = savingsTarget ? Math.min(1, Math.max(0, netSav / savingsTarget)) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={tx.isFetching}
            onRefresh={() => {
              tx.refetch();
              budget.refetch();
            }}
          />
        }>
        <PageHeader
          title="Vault"
          subtitle={`Treasury · ${month}`}
          accent={accent}
          accent2={accent2}
          right={<Ionicons name="wallet" size={26} color={accent} />}
        />

        <View style={styles.monthCard}>
          <Text style={styles.cardTitle}>This Month</Text>
          <View style={styles.statRow}>
            <View style={styles.statCol}>
              <Text style={styles.miniLabel}>Income</Text>
              <Text style={[styles.miniVal, { color: '#4ade80' }]}>₹{totalInc.toLocaleString()}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.miniLabel}>Expenses</Text>
              <Text style={[styles.miniVal, { color: palette.danger }]}>₹{totalExp.toLocaleString()}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.miniLabel}>Saved</Text>
              <Text style={[styles.miniVal, { color: accent }]}>₹{netSav.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.savingsTrack}>
            <View style={[styles.savingsFill, { width: `${savingsPct * 100}%`, backgroundColor: accent }]} />
          </View>
          <Text style={styles.savingsCap}>
            {savingsTarget
              ? `${Math.round(savingsPct * 100)}% to ₹${savingsTarget.toLocaleString()} target`
              : 'Set a savings target in budget settings'}
          </Text>
        </View>

        <SectionTitle title="Where it goes" accent={accent} />
        <View style={styles.donutRow}>
          <DonutChart
            slices={slices}
            size={170}
            centerValue={`₹${totalExp.toLocaleString()}`}
            centerLabel="Spent"
          />
          <View style={{ flex: 1, gap: 6 }}>
            {slices.length === 0 ? (
              <Text style={{ color: palette.textMuted, fontSize: 12 }}>No expenses yet</Text>
            ) : (
              slices.slice(0, 6).map((s) => (
                <View key={s.label} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: s.color }]} />
                  <Text style={styles.legendLabel}>{s.label}</Text>
                  <Text style={styles.legendVal}>₹{s.value.toLocaleString()}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <SectionTitle title="Transactions" accent={accent} />
        {grouped.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="cash" title="No transactions yet" message="Tap + to add your first one." accent={accent} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {grouped.map(([date, list]) => (
              <View key={date}>
                <Text style={styles.dateHead}>{new Date(date).toLocaleDateString()}</Text>
                <View style={{ gap: 6, marginTop: 6 }}>
                  {list.map((t) => (
                    <View key={t.id} style={styles.txRow}>
                      <View
                        style={[
                          styles.catDot,
                          { backgroundColor: CATEGORY_COLORS[t.category] ?? '#94a3b8' },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.txDesc} numberOfLines={1}>
                          {t.description ?? t.category}
                        </Text>
                        <Text style={styles.txCat}>{t.category}</Text>
                      </View>
                      <Text
                        style={[
                          styles.txAmt,
                          { color: t.type === 'Income' ? '#4ade80' : '#ef4444' },
                        ]}>
                        {t.type === 'Income' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Pressable
        onPress={() => setSheetOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: accent, shadowColor: accent },
          pressed && { opacity: 0.85 },
        ]}>
        <Ionicons name="add" size={28} color="#0b0b14" />
      </Pressable>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Add Transaction">
        <Text style={styles.fieldLabel}>Type</Text>
        <View style={styles.tabRow}>
          {(['Expense', 'Income'] as TxType[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[
                styles.typeTab,
                type === t && { backgroundColor: accent + '22', borderColor: accent },
              ]}>
              <Text style={[styles.typeTabText, type === t && { color: accent }]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          style={styles.input}
          placeholderTextColor={palette.textDim}
        />

        <Text style={styles.fieldLabel}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {CATEGORIES.map((c) => {
              const active = category === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[
                    styles.catChip,
                    active && { backgroundColor: accent + '22', borderColor: accent },
                  ]}>
                  <Text style={[styles.catChipText, active && { color: accent }]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <Text style={styles.fieldLabel}>Description</Text>
        <TextInput
          value={desc}
          onChangeText={setDesc}
          style={styles.input}
          placeholderTextColor={palette.textDim}
        />
        <View style={{ height: 14 }} />
        <GlowButton
          title="Save"
          color={accent}
          loading={createTx.isPending}
          onPress={async () => {
            const a = parseFloat(amount);
            if (!a) return;
            await createTx.mutateAsync({
              amount: a,
              type,
              category,
              description: desc || undefined,
            });
            setSheetOpen(false);
            setAmount('');
            setDesc('');
          }}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  monthCard: {
    backgroundColor: palette.card,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 10,
  },
  cardTitle: { color: palette.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', fontSize: 11 },
  statRow: { flexDirection: 'row', gap: 14 },
  statCol: { flex: 1 },
  miniLabel: { color: palette.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  miniVal: { fontSize: 18, fontWeight: '900', marginTop: 4, letterSpacing: -0.3 },
  savingsTrack: { height: 8, backgroundColor: palette.cardAlt, borderRadius: 4, overflow: 'hidden' },
  savingsFill: { height: '100%', borderRadius: 4 },
  savingsCap: { color: palette.textMuted, fontSize: 11 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: palette.text, fontSize: 12, flex: 1, fontWeight: '600' },
  legendVal: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
  dateHead: { color: palette.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 10,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  txDesc: { color: palette.text, fontSize: 14, fontWeight: '700' },
  txCat: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
  txAmt: { fontWeight: '900', fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  fieldLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6, letterSpacing: 0.6, textTransform: 'uppercase' },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
  tabRow: { flexDirection: 'row', gap: 8 },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    backgroundColor: palette.card,
  },
  typeTabText: { color: palette.textMuted, fontWeight: '800', fontSize: 13 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  catChipText: { color: palette.textMuted, fontWeight: '700', fontSize: 12 },
});
