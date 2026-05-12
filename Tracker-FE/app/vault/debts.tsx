import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { EmptyState } from '@/components/layout/EmptyState';
import {
  useDebts,
  useCreateDebt,
  useUpdateDebt,
  useDeleteDebt,
  usePayDebt,
} from '@/hooks/useFinance';
import type { Debt } from '@/types';
import { DEBT_TYPES, fmtINR, parseAmount } from './_shared';
import { GradientCard, GradientProgress, HeroMetric, IconTile, ColoredPill } from './_components';

const DEBT_ICON: Record<string, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  Loan: 'cash',
  'Credit Card': 'card',
  Personal: 'people',
  Mortgage: 'home',
  Other: 'wallet',
};

export default function DebtsScreen() {
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const debts = useDebts();
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();
  const payDebt = usePayDebt();

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('Loan');
  const [principal, setPrincipal] = useState('');
  const [balance, setBalance] = useState('');
  const [rate, setRate] = useState('');
  const [emi, setEmi] = useState('');

  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Debt | null>(null);
  const [payAmt, setPayAmt] = useState('');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setType('Loan');
    setPrincipal('');
    setBalance('');
    setRate('');
    setEmi('');
    setEditOpen(true);
  };

  const openEdit = (d: Debt) => {
    setEditing(d);
    setName(d.name);
    setType(d.type);
    setPrincipal(String(d.principal));
    setBalance(String(d.balance));
    setRate(d.interestRate ? String(d.interestRate) : '');
    setEmi(d.emi ? String(d.emi) : '');
    setEditOpen(true);
  };

  const submit = async () => {
    const p = parseAmount(principal);
    const b = parseAmount(balance) ?? p;
    if (!name || !p) return;
    const body = {
      name,
      type,
      principal: p,
      balance: b ?? p,
      interestRate: rate ? Number(rate) : undefined,
      emi: emi ? Number(emi) : undefined,
    };
    if (editing) await updateDebt.mutateAsync({ id: editing.id, body });
    else await createDebt.mutateAsync(body);
    setEditOpen(false);
  };

  const submitPay = async () => {
    const a = parseAmount(payAmt);
    if (!a || !payTarget) return;
    await payDebt.mutateAsync({ id: payTarget.id, body: { amount: a } });
    setPayOpen(false);
  };

  const list = useMemo(() => debts.data?.debts ?? [], [debts.data]);
  const totalDebt = list.filter((d) => !d.cleared).reduce((s, d) => s + d.balance, 0);
  const totalPrincipal = list.reduce((s, d) => s + d.principal, 0);
  const totalPaid = list.reduce((s, d) => s + (d.principal - d.balance), 0);
  const overallProgress = totalPrincipal > 0 ? totalPaid / totalPrincipal : 0;

  const snowball = useMemo(
    () => list.filter((d) => !d.cleared).sort((a, b) => a.balance - b.balance).map((d) => d.name),
    [list],
  );
  const avalanche = useMemo(
    () => list.filter((d) => !d.cleared).sort((a, b) => (b.interestRate ?? 0) - (a.interestRate ?? 0)).map((d) => d.name),
    [list],
  );

  return (
    <ThemedScene scene="vault">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={debts.isFetching} onRefresh={() => debts.refetch()} />}>
        <PageHeader
          title="Debts"
          subtitle={`${list.filter((d) => !d.cleared).length} active · ${list.filter((d) => d.cleared).length} cleared`}
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
          <GradientCard accent={palette.danger} accent2="#fb923c" intensity={0.18}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconTile icon="trending-down" accent={palette.danger} size={48} iconSize={24} />
              <View style={{ flex: 1 }}>
                <HeroMetric
                  label="OUTSTANDING"
                  value={fmtINR(totalDebt)}
                  accent={palette.danger}
                  caption={`${fmtINR(totalPaid)} paid · ${Math.round(overallProgress * 100)}% done`}
                />
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <GradientProgress value={overallProgress} accent="#4ade80" accent2={accent} height={10} />
            </View>
          </GradientCard>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <Pressable onPress={openCreate} style={[styles.btn, { borderColor: accent + '99', backgroundColor: accent + '14' }]}>
            <Ionicons name="add-circle" size={14} color={accent} />
            <Text style={[styles.btnText, { color: accent }]}>New debt</Text>
          </Pressable>
        </View>

        {snowball.length > 0 && (
          <>
            <SectionTitle title="Payoff strategies" accent="#f59e0b" />
            <View style={styles.strategyRow}>
              <View style={{ flex: 1 }}>
                <GradientCard accent="#a3e635" intensity={0.12}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="snow" size={14} color="#a3e635" />
                    <Text style={styles.stratHead}>SNOWBALL</Text>
                  </View>
                  <Text style={styles.stratSub}>Smallest first</Text>
                  <Text style={styles.stratList} numberOfLines={4}>{snowball.join('  →  ')}</Text>
                </GradientCard>
              </View>
              <View style={{ flex: 1 }}>
                <GradientCard accent={palette.danger} intensity={0.12}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="flame" size={14} color={palette.danger} />
                    <Text style={styles.stratHead}>AVALANCHE</Text>
                  </View>
                  <Text style={styles.stratSub}>Highest rate first</Text>
                  <Text style={styles.stratList} numberOfLines={4}>{avalanche.join('  →  ')}</Text>
                </GradientCard>
              </View>
            </View>
          </>
        )}

        <SectionTitle title="All debts" accent={palette.danger} />
        {list.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="trending-down" title="No debts tracked" message="Add loans/cards to track payoff and earn XP." accent={accent} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {list.map((d) => {
              const pct = d.principal > 0 ? 1 - d.balance / d.principal : 0;
              const stripeColor = d.cleared ? '#4ade80' : palette.danger;
              return (
                <Pressable key={d.id} onPress={() => openEdit(d)}>
                  <View style={styles.cardWrap}>
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#10101c', borderRadius: 18 }]} />
                    <LinearGradient
                      colors={[stripeColor + '18', '#10101cf2', stripeColor + '16']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={[StyleSheet.absoluteFillObject, { borderRadius: 18, borderWidth: 1, borderColor: stripeColor + '66' }]} />
                    <View style={{ padding: 14, gap: 10 }}>
                      <View style={styles.headRow}>
                        <IconTile icon={DEBT_ICON[d.type] ?? 'wallet'} accent={stripeColor} size={42} iconSize={20} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>{d.name}</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                            <ColoredPill label={d.type} color={stripeColor} small />
                            {d.interestRate != null && <ColoredPill label={`${d.interestRate}%`} color="#fbbf24" small />}
                            {d.emi != null && <ColoredPill label={`EMI ${fmtINR(d.emi)}`} color="#f59e0b" small />}
                            {d.cleared && <ColoredPill label="CLEARED" color="#4ade80" icon="checkmark-circle" small />}
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.balance, { color: d.cleared ? '#4ade80' : palette.danger }]}>
                            {fmtINR(d.balance)}
                          </Text>
                          <Text style={styles.balanceCap}>of {fmtINR(d.principal)}</Text>
                        </View>
                      </View>
                      {!d.cleared && (
                        <>
                          <GradientProgress value={pct} accent="#4ade80" accent2={accent} height={8} />
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.cap}>{Math.round(pct * 100)}% paid</Text>
                            <View style={{ flex: 1 }} />
                            <Pressable
                              onPress={(e) => {
                                e.stopPropagation();
                                setPayTarget(d);
                                setPayAmt(d.emi ? String(d.emi) : '');
                                setPayOpen(true);
                              }}
                              style={[styles.payBtn, { borderColor: accent, backgroundColor: accent + '22' }]}>
                              <Ionicons name="card" size={12} color={accent} />
                              <Text style={[styles.btnText, { color: accent }]}>Pay</Text>
                            </Pressable>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomSheet visible={editOpen} onClose={() => setEditOpen(false)} title={editing ? 'Edit debt' : 'New debt'}>
        <ScrollView style={{ maxHeight: 520 }}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {DEBT_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.chip, type === t && { backgroundColor: accent + '22', borderColor: accent }]}>
                <Ionicons name={DEBT_ICON[t] ?? 'wallet'} size={12} color={type === t ? accent : palette.textMuted} />
                <Text style={[styles.chipText, type === t && { color: accent }]}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Principal</Text>
          <TextInput value={principal} onChangeText={setPrincipal} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>Current balance</Text>
          <TextInput value={balance} onChangeText={setBalance} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>Interest rate %</Text>
          <TextInput value={rate} onChangeText={setRate} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>EMI</Text>
          <TextInput value={emi} onChangeText={setEmi} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
          <View style={{ height: 14 }} />
          <GlowButton title={editing ? 'Save' : 'Create'} color={accent} onPress={submit} loading={createDebt.isPending || updateDebt.isPending} />
          {editing && (
            <Pressable
              onPress={async () => {
                if (!editing) return;
                await deleteDebt.mutateAsync(editing.id);
                setEditOpen(false);
              }}
              style={[styles.deleteBtn, { borderColor: palette.danger + '99', backgroundColor: palette.danger + '14' }]}>
              <Ionicons name="trash" size={14} color={palette.danger} />
              <Text style={{ color: palette.danger, fontWeight: '900' }}>Delete debt</Text>
            </Pressable>
          )}
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={payOpen} onClose={() => setPayOpen(false)} title={`Pay ${payTarget?.name ?? ''}`}>
        <Text style={styles.fieldLabel}>Amount</Text>
        <TextInput value={payAmt} onChangeText={setPayAmt} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
        <View style={{ height: 14 }} />
        <GlowButton title="Record payment" color={accent} onPress={submitPay} loading={payDebt.isPending} />
      </BottomSheet>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  btnText: { fontWeight: '900', fontSize: 12 },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  strategyRow: { paddingHorizontal: 20, flexDirection: 'row', gap: 10 },
  stratHead: { color: palette.text, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  stratSub: { color: palette.textDim, fontSize: 10, fontWeight: '700', marginTop: 2 },
  stratList: { color: palette.text, fontSize: 12, fontWeight: '800', marginTop: 6 },
  cardWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: palette.text, fontWeight: '900', fontSize: 15, letterSpacing: -0.2 },
  balance: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  balanceCap: { color: palette.textDim, fontSize: 10, fontWeight: '700', marginTop: 1 },
  cap: { color: palette.textMuted, fontSize: 11, fontWeight: '800' },
  fieldLabel: { color: palette.textMuted, fontSize: 11, fontWeight: '800', marginTop: 12, marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#10101c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    color: palette.text,
    padding: 12,
    fontSize: 14,
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
  deleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
