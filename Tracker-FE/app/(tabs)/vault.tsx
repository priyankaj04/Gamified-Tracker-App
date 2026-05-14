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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { DonutChart } from '@/components/charts/DonutChart';
import { EmptyState } from '@/components/layout/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { DatePicker, todayISO } from '@/components/ui/DatePicker';
import {
  useTransactions,
  useBudget,
  useCreateTx,
  useAccounts,
  useGoals,
  useDebts,
  useVaultGame,
  useTemplates,
  useUseTemplate,
  useUpdateVaultSettings,
  useVaultChallenges,
  useRecurring,
  useCompleteChallenge,
} from '@/hooks/useFinance';
import type { TxType } from '@/types';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  currentMonth,
  fmtINR,
  parseAmount,
} from '../vault/_shared';
import {
  GradientCard,
  GradientProgress,
  IconTile,
  HeroMetric,
  ColoredPill,
  VAULT_COLORS,
} from '../vault/_components';
import { VaultRankBadgeCard } from '@/components/vault/VaultRankBadgeCard';

const HUB_TILES: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  path: string;
  color: string;
}[] = [
  { key: 'reports', label: 'Reports', icon: 'analytics', path: '/vault/stats', color: VAULT_COLORS.yellow },
  { key: 'accounts', label: 'Accounts', icon: 'card', path: '/vault/accounts', color: VAULT_COLORS.lime },
  { key: 'goals', label: 'Goals', icon: 'flag', path: '/vault/goals', color: VAULT_COLORS.green },
  { key: 'debts', label: 'Debts', icon: 'trending-down', path: '/vault/debts', color: VAULT_COLORS.red },
  { key: 'invest', label: 'Invest', icon: 'trending-up', path: '/vault/investments', color: VAULT_COLORS.orange },
  { key: 'recurring', label: 'Recurring', icon: 'repeat', path: '/vault/recurring', color: VAULT_COLORS.warmOrange },
  { key: 'subs', label: 'Subscriptions', icon: 'receipt', path: '/vault/subscriptions', color: VAULT_COLORS.orange },
  { key: 'search', label: 'Search', icon: 'search', path: '/vault/search', color: VAULT_COLORS.lime },
  { key: 'tags', label: 'Tags', icon: 'pricetags', path: '/vault/tags', color: VAULT_COLORS.orange },
  { key: 'challenges', label: 'Challenges', icon: 'trophy', path: '/vault/challenges', color: VAULT_COLORS.yellow },
];

export default function VaultScreen() {
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const month = currentMonth();
  const tx = useTransactions({ month, limit: 30 });
  const budget = useBudget(month);
  const accounts = useAccounts();
  const goals = useGoals();
  const debts = useDebts();
  const game = useVaultGame();
  const recurring = useRecurring();
  const challenges = useVaultChallenges();
  const templates = useTemplates();
  const createTx = useCreateTx();
  const useTpl = useUseTemplate();
  const updateSettings = useUpdateVaultSettings();
  const completeChallenge = useCompleteChallenge();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxType>('Expense');
  const [category, setCategory] = useState('Food');
  const [desc, setDesc] = useState('');
  const [txDate, setTxDate] = useState(todayISO());
  const [merchant, setMerchant] = useState('');
  const [calcUsedThisOpen, setCalcUsedThisOpen] = useState(false);

  const transactions = tx.data?.transactions ?? [];

  const slices = useMemo(() => {
    const totals = (budget.data?.actual?.byCategory ?? {}) as Record<string, number>;
    return Object.entries(totals)
      .map(([label, value]) => ({
        label,
        value,
        color: CATEGORY_COLORS[label] ?? VAULT_COLORS.neutral,
      }))
      .sort((a, b) => b.value - a.value);
  }, [budget.data]);

  const totalExp = budget.data?.actual?.totalExpenses ?? 0;
  const totalInc = budget.data?.actual?.totalIncome ?? 0;
  const netSav = budget.data?.actual?.netSavings ?? 0;
  const savingsTarget = budget.data?.budget?.savingsTarget ?? 0;
  const savingsPct = savingsTarget ? Math.min(1, Math.max(0, netSav / savingsTarget)) : 0;
  const velocity = budget.data?.actual?.spendVelocity ?? 0;
  const budgetIncome = budget.data?.budget?.income ?? 0;
  const expensePct = budgetIncome ? Math.min(1.4, totalExp / budgetIncome) : 0;

  const dueRecurring = (recurring.data?.recurring ?? []).filter(
    (r) => !r.cancelled && !r.paused && r.nextDue <= todayISO(),
  ).length;

  const activeChallenges = (challenges.data?.challenges ?? []).filter((c) => !c.completed);

  const totalAccountsBalance = (accounts.data?.accounts ?? []).reduce(
    (s, a) => s + (a.balance ?? a.openingBalance),
    0,
  );
  const totalDebt = (debts.data?.debts ?? []).reduce((s, d) => s + d.balance, 0);

  const submitTx = async () => {
    const a = parseAmount(amount);
    if (!a) return;
    if (calcUsedThisOpen) updateSettings.mutate({ calculatorUsed: true } as any);
    await createTx.mutateAsync({
      amount: a,
      type,
      category,
      date: txDate,
      description: desc || undefined,
      merchant: merchant || undefined,
      roundUp: true,
    });
    setSheetOpen(false);
    setTxDate(todayISO());
    setAmount('');
    setDesc('');
    setMerchant('');
    setCalcUsedThisOpen(false);
  };

  return (
    <ThemedScene scene="vault">
      <ScrollView
        refreshControl={
          <RefreshControl
            tintColor={accent}
            refreshing={tx.isFetching || budget.isFetching}
            onRefresh={() => {
              tx.refetch();
              budget.refetch();
              accounts.refetch();
              goals.refetch();
              debts.refetch();
              game.refetch();
              recurring.refetch();
              challenges.refetch();
            }}
          />
        }>
        <PageHeader
          title="Vault"
          subtitle={game.data ? `${game.data.title} · ${month}` : `Treasury · ${month}`}
          accent={accent}
          accent2={accent2}
          right={<Ionicons name="wallet" size={26} color={accent} />}
        />

        {/* Hero rank card — Mashle character ladder */}
        <VaultRankBadgeCard
          rank={game.data?.rank}
          nextRank={game.data?.nextRank}
          score={game.data?.vaultXp ?? 0}
          progressPct={game.data?.progressPct ?? 0}
          toNext={game.data?.toNext ?? 0}
          subtitle={
            game.data
              ? `${game.data.vaultXp.toLocaleString()} Vault XP · 🔥 ${game.data.streak.count} day streak`
              : undefined
          }
          accent={accent}
          onPress={() => router.push('/vault/ranks' as any)}
        />

        {/* Hero month card */}
        <View style={{ marginHorizontal: 20 }}>
          <GradientCard accent={accent2} accent2={accent}>
            <Text style={styles.cardTitle}>This Month · {month}</Text>
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <HeroMetric
                  label="Saved"
                  value={fmtINR(netSav)}
                  accent={netSav >= 0 ? VAULT_COLORS.green : VAULT_COLORS.red}
                  caption={
                    savingsTarget
                      ? `${Math.round(savingsPct * 100)}% of ${fmtINR(savingsTarget)} target`
                      : 'No target set'
                  }
                />
              </View>
              <View style={styles.miniBlocks}>
                <View style={[styles.miniBlock, { backgroundColor: VAULT_COLORS.green + '14', borderColor: VAULT_COLORS.green + '55' }]}>
                  <Ionicons name="arrow-down" size={11} color={VAULT_COLORS.green} />
                  <Text style={[styles.miniBlockVal, { color: VAULT_COLORS.green }]}>{fmtINR(totalInc)}</Text>
                  <Text style={styles.miniBlockLabel}>Income</Text>
                </View>
                <View style={[styles.miniBlock, { backgroundColor: VAULT_COLORS.red + '14', borderColor: VAULT_COLORS.red + '55' }]}>
                  <Ionicons name="arrow-up" size={11} color={VAULT_COLORS.red} />
                  <Text style={[styles.miniBlockVal, { color: VAULT_COLORS.red }]}>{fmtINR(totalExp)}</Text>
                  <Text style={styles.miniBlockLabel}>Spent</Text>
                </View>
              </View>
            </View>
            {savingsTarget > 0 && (
              <View style={{ marginTop: 12 }}>
                <GradientProgress value={savingsPct} accent={accent} accent2={VAULT_COLORS.green} height={10} />
              </View>
            )}
            {budgetIncome > 0 && (
              <View style={{ marginTop: 10, gap: 6 }}>
                <View style={styles.budgetMeta}>
                  <Text style={styles.budgetLabel}>Budget pace</Text>
                  <Text
                    style={[
                      styles.budgetLabel,
                      { color: expensePct > velocity + 0.05 ? VAULT_COLORS.red : VAULT_COLORS.green },
                    ]}>
                    Day {budget.data?.actual?.daysIntoMonth}/{budget.data?.actual?.daysInMonth}
                  </Text>
                </View>
                <GradientProgress
                  value={Math.min(1, expensePct)}
                  accent={expensePct > 1 ? VAULT_COLORS.red : VAULT_COLORS.orange}
                  accent2={expensePct > 1 ? VAULT_COLORS.softRed : VAULT_COLORS.warmOrange}
                  height={6}
                />
                <Text style={styles.budgetCaption}>
                  Spent {fmtINR(totalExp)} of {fmtINR(budgetIncome)} budget
                </Text>
              </View>
            )}
          </GradientCard>
        </View>

        {/* Ongoing challenges — promoted */}
        {activeChallenges.length > 0 && (
          <>
            <SectionTitle
              title="Ongoing challenges"
              accent={accent}
              right={
                <Pressable onPress={() => router.push('/vault/challenges')} hitSlop={8}>
                  <Text style={[styles.linkText, { color: accent }]}>Manage</Text>
                </Pressable>
              }
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
              {activeChallenges.slice(0, 6).map((c) => {
                const pct = c.target > 0 ? Math.min(1, c.progress / c.target) : 0;
                const periodColor =
                  c.period === 'weekly'
                    ? VAULT_COLORS.lime
                    : c.period === 'monthly'
                    ? VAULT_COLORS.orange
                    : VAULT_COLORS.yellow;
                return (
                  <View key={c.id} style={{ width: 260 }}>
                    <GradientCard accent={periodColor} accent2={accent}>
                      <View style={styles.challHead}>
                        <View style={[styles.ongoingBadge, { backgroundColor: periodColor + '33', borderColor: periodColor }]}>
                          <View style={[styles.dot, { backgroundColor: periodColor }]} />
                          <Text style={[styles.ongoingText, { color: periodColor }]}>ONGOING</Text>
                        </View>
                        <ColoredPill label={c.period} color={VAULT_COLORS.neutral} small />
                      </View>
                      <Text style={styles.challTitle} numberOfLines={1}>{c.title}</Text>
                      <Text style={styles.challDesc} numberOfLines={2}>{c.description}</Text>
                      <View style={{ marginTop: 10 }}>
                        <GradientProgress value={pct} accent={periodColor} accent2={accent} height={6} />
                      </View>
                      <View style={styles.challFoot}>
                        <Text style={styles.challProgress}>
                          {c.progress}/{c.target}
                        </Text>
                        <View style={[styles.xpChip, { borderColor: accent, backgroundColor: accent + '22' }]}>
                          <Ionicons name="flash" size={11} color={accent} />
                          <Text style={[styles.xpChipText, { color: accent }]}>+{c.xpReward} XP</Text>
                        </View>
                        <Pressable
                          onPress={() => completeChallenge.mutate(c.id)}
                          style={[styles.doneBtn, { borderColor: VAULT_COLORS.green, backgroundColor: VAULT_COLORS.green + '22' }]}>
                          <Ionicons name="checkmark" size={12} color={VAULT_COLORS.green} />
                          <Text style={[styles.doneBtnText, { color: VAULT_COLORS.green }]}>Done</Text>
                        </Pressable>
                      </View>
                    </GradientCard>
                  </View>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* Aggregate row */}
        <SectionTitle title="At a glance" accent={accent} />
        <View style={styles.aggregateRow}>
          <Pressable onPress={() => router.push('/vault/accounts')} style={{ flex: 1 }}>
            <GradientCard accent={VAULT_COLORS.lime}>
              <IconTile icon="card" accent={VAULT_COLORS.lime} size={32} iconSize={14} />
              <Text style={styles.aggLabel}>Accounts</Text>
              <Text style={[styles.aggVal, { color: VAULT_COLORS.lime }]}>{fmtINR(totalAccountsBalance)}</Text>
            </GradientCard>
          </Pressable>
          <Pressable onPress={() => router.push('/vault/debts')} style={{ flex: 1 }}>
            <GradientCard accent={VAULT_COLORS.red}>
              <IconTile icon="trending-down" accent={VAULT_COLORS.red} size={32} iconSize={14} />
              <Text style={styles.aggLabel}>Debts</Text>
              <Text style={[styles.aggVal, { color: VAULT_COLORS.red }]}>{fmtINR(totalDebt)}</Text>
            </GradientCard>
          </Pressable>
          <Pressable onPress={() => router.push('/vault/goals')} style={{ flex: 1 }}>
            <GradientCard accent={VAULT_COLORS.green}>
              <IconTile icon="flag" accent={VAULT_COLORS.green} size={32} iconSize={14} />
              <Text style={styles.aggLabel}>Goals</Text>
              <Text style={[styles.aggVal, { color: VAULT_COLORS.green }]}>
                {(goals.data?.goals ?? []).length}
              </Text>
            </GradientCard>
          </Pressable>
        </View>

        {/* Hub tiles */}
        <SectionTitle title="Vault tools" accent={accent} />
        <View style={styles.tileGrid}>
          {HUB_TILES.map((t) => {
            const badge =
              t.key === 'recurring' && dueRecurring > 0
                ? dueRecurring
                : t.key === 'challenges' && activeChallenges.length > 0
                ? activeChallenges.length
                : 0;
            return (
              <Pressable
                key={t.key}
                onPress={() => router.push(t.path as any)}
                style={({ pressed }) => [{ width: '23%', margin: '1%' }, pressed && { opacity: 0.7 }]}>
                <View style={[styles.tile, { borderColor: t.color + '55' }]}>
                  <LinearGradient
                    colors={[t.color + '22', 'transparent']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <IconTile icon={t.icon} accent={t.color} size={36} iconSize={16} />
                  <Text style={styles.tileLabel}>{t.label}</Text>
                  {badge > 0 && (
                    <View style={[styles.tileBadge, { backgroundColor: t.color }]}>
                      <Text style={styles.tileBadgeText}>{badge}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Donut breakdown */}
        <SectionTitle title="Where it goes" accent={accent} />
        <View style={{ marginHorizontal: 20 }}>
          <GradientCard accent={accent}>
            <View style={styles.donutRow}>
              <DonutChart
                slices={slices}
                size={170}
                centerValue={fmtINR(totalExp)}
                centerLabel="Spent"
              />
              <View style={{ flex: 1, gap: 8 }}>
                {slices.length === 0 ? (
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>No expenses yet</Text>
                ) : (
                  slices.slice(0, 6).map((s) => (
                    <View key={s.label} style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                      <Text style={styles.legendLabel}>{s.label}</Text>
                      <Text style={styles.legendVal}>{fmtINR(s.value)}</Text>
                    </View>
                  ))
                )}
              </View>
            </View>
          </GradientCard>
        </View>

        {/* Quick-add templates */}
        {(templates.data?.templates ?? []).length > 0 && (
          <>
            <SectionTitle title="Quick add" accent={accent} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
              {(templates.data?.templates ?? []).map((t) => (
                <Pressable key={t.id} onPress={() => useTpl.mutate(t.id)}>
                  <View style={[styles.tplChip, { borderColor: accent + '55' }]}>
                    <LinearGradient
                      colors={[accent + '22', 'transparent']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Text style={{ fontSize: 16 }}>{t.emoji ?? '⚡'}</Text>
                    <Text style={styles.tplName}>{t.name}</Text>
                    <Text style={[styles.tplAmount, { color: accent }]}>{fmtINR(t.amount)}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        {/* Recent transactions */}
        <SectionTitle
          title="Recent"
          accent={accent}
          right={
            <Pressable onPress={() => router.push('/vault/search')} hitSlop={8}>
              <Text style={[styles.linkText, { color: accent }]}>View all</Text>
            </Pressable>
          }
        />
        {transactions.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="cash"
              title="No transactions yet"
              message="Tap + to add your first one."
              accent={accent}
            />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {transactions.slice(0, 12).map((t) => {
              const c = CATEGORY_COLORS[t.category] ?? VAULT_COLORS.neutral;
              return (
                <View key={t.id} style={styles.txRow}>
                  <View style={[styles.txStripe, { backgroundColor: c }]} />
                  <IconTile
                    icon={t.type === 'Income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                    accent={t.type === 'Income' ? VAULT_COLORS.green : c}
                    size={32}
                    iconSize={14}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txDesc} numberOfLines={1}>
                      {t.description ?? t.merchant ?? t.category}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 2, alignItems: 'center' }}>
                      <ColoredPill label={t.category} color={c} small />
                      <Text style={styles.txDate}>{t.date}</Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.txAmt,
                      { color: t.type === 'Income' ? VAULT_COLORS.green : VAULT_COLORS.softRed },
                    ]}>
                    {t.type === 'Income' ? '+' : '-'}
                    {fmtINR(t.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      <Pressable
        onPress={() => setSheetOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          { shadowColor: accent },
          pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        ]}>
        <LinearGradient
          colors={[accent, accent2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name="add" size={28} color="#0b0b14" />
      </Pressable>

      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Add Transaction">
        <ScrollView style={{ maxHeight: 560 }}>
          <Text style={styles.fieldLabel}>Date</Text>
          <DatePicker value={txDate} onChange={setTxDate} accent={accent} />

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
                <Ionicons
                  name={t === 'Income' ? 'arrow-down' : 'arrow-up'}
                  size={14}
                  color={type === t ? accent : 'rgba(255,255,255,0.6)'}
                />
                <Text style={[styles.typeTabText, type === t && { color: accent }]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Amount · supports math (e.g. 200+150)</Text>
          <View style={styles.amountRow}>
            <TextInput
              value={amount}
              onChangeText={(v) => {
                setAmount(v);
                if (/[+\-*/()]/.test(v)) setCalcUsedThisOpen(true);
              }}
              keyboardType="default"
              style={[styles.input, { flex: 1, fontSize: 18, fontWeight: '800' }]}
              placeholderTextColor={palette.textDim}
              placeholder="0"
            />
            <View style={[styles.amountPreview, { borderColor: accent + '66' }]}>
              <Text style={{ color: accent, fontWeight: '900', fontSize: 14 }}>
                {(() => {
                  const v = parseAmount(amount);
                  return v ? fmtINR(v) : '—';
                })()}
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {CATEGORIES.map((c) => {
                const active = category === c;
                const cColor = CATEGORY_COLORS[c] ?? VAULT_COLORS.neutral;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[
                      styles.catChip,
                      active && { backgroundColor: cColor + '22', borderColor: cColor },
                    ]}>
                    <View style={[styles.catDot, { backgroundColor: cColor }]} />
                    <Text style={[styles.catChipText, active && { color: cColor }]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <Text style={styles.fieldLabel}>Merchant (optional)</Text>
          <TextInput
            value={merchant}
            onChangeText={setMerchant}
            style={styles.input}
            placeholderTextColor={palette.textDim}
            placeholder="Swiggy, Amazon, etc."
          />

          <Text style={styles.fieldLabel}>Description (optional)</Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            style={styles.input}
            placeholderTextColor={palette.textDim}
          />
          <View style={{ height: 14 }} />
          <GlowButton title="Save" color={accent} loading={createTx.isPending} onPress={submitTx} />
        </ScrollView>
      </BottomSheet>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rankLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  rankTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  rankXp: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '700', marginTop: 4 },
  streakOrb: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNum: { fontSize: 20, fontWeight: '900', marginTop: 1 },
  streakLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  cardTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, gap: 12 },
  miniBlocks: { gap: 6 },
  miniBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 110,
  },
  miniBlockVal: { fontSize: 12, fontWeight: '900', flex: 1, textAlign: 'right' },
  miniBlockLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  budgetMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  budgetCaption: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' },
  aggregateRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20 },
  aggLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8 },
  aggVal: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3, marginTop: 2 },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  tile: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: palette.card,
  },
  tileLabel: { color: '#ffffff', fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  tileBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBadgeText: { color: '#0b0b14', fontWeight: '900', fontSize: 10 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { color: '#ffffff', fontSize: 12, flex: 1, fontWeight: '700' },
  legendVal: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '800' },
  tplChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: palette.card,
  },
  tplName: { color: '#ffffff', fontWeight: '800', fontSize: 12 },
  tplAmount: { fontWeight: '900', fontSize: 12 },
  linkText: { fontWeight: '800', fontSize: 12 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingLeft: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    gap: 10,
  },
  txStripe: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  txDesc: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  txDate: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },
  txAmt: { fontWeight: '900', fontSize: 14, letterSpacing: -0.3 },
  challHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ongoingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  ongoingText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  challTitle: { color: '#ffffff', fontWeight: '900', fontSize: 14, marginTop: 8 },
  challDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600', marginTop: 4 },
  challFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  challProgress: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '900' },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  xpChipText: { fontWeight: '900', fontSize: 11 },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  doneBtnText: { fontWeight: '900', fontSize: 11 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  fieldLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '800', marginTop: 12, marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' },
  input: {
    backgroundColor: palette.cardAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    color: '#ffffff',
    padding: 12,
    fontSize: 14,
  },
  amountRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  amountPreview: {
    minWidth: 90,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: palette.cardAlt,
    alignItems: 'center',
  },
  tabRow: { flexDirection: 'row', gap: 8 },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cardAlt,
  },
  typeTabText: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 13 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: palette.cardAlt,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catChipText: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 12 },
});
