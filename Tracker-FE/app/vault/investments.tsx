import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { DonutChart } from '@/components/charts/DonutChart';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { EmptyState } from '@/components/layout/EmptyState';
import {
  useInvestments,
  useCreateInvestment,
  useUpdateInvestment,
  useDeleteInvestment,
  useLogInvestmentTxn,
} from '@/hooks/useFinance';
import type { Investment, InvestmentAction, InvestmentType } from '@/types';
import { INVESTMENT_TYPES, fmtINR, parseAmount } from './_shared';
import { GradientCard, HeroMetric, IconTile, ColoredPill } from './_components';

const TYPE_META: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  Stock: { color: '#a3e635', icon: 'bar-chart' },
  MF: { color: '#f59e0b', icon: 'analytics' },
  FD: { color: '#4ade80', icon: 'lock-closed' },
  Gold: { color: '#fbbf24', icon: 'sparkles' },
  Crypto: { color: '#f97316', icon: 'logo-bitcoin' },
  Bond: { color: '#f59e0b', icon: 'shield' },
  Other: { color: '#94a3b8', icon: 'cube' },
};

export default function InvestmentsScreen() {
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const investments = useInvestments();
  const createInv = useCreateInvestment();
  const updateInv = useUpdateInvestment();
  const deleteInv = useDeleteInvestment();
  const logTxn = useLogInvestmentTxn();

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<InvestmentType>('Stock');
  const [symbol, setSymbol] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [platform, setPlatform] = useState('');

  const [logOpen, setLogOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<Investment | null>(null);
  const [logAction, setLogAction] = useState<InvestmentAction>('Buy');
  const [logQty, setLogQty] = useState('');
  const [logAmt, setLogAmt] = useState('');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setType('Stock');
    setSymbol('');
    setCostBasis('');
    setCurrentValue('');
    setPlatform('');
    setEditOpen(true);
  };

  const openEdit = (inv: Investment) => {
    setEditing(inv);
    setName(inv.name);
    setType((inv.type as InvestmentType) ?? 'Stock');
    setSymbol(inv.symbol ?? '');
    setCostBasis(String(inv.costBasis));
    setCurrentValue(String(inv.currentValue));
    setPlatform(inv.platform ?? '');
    setEditOpen(true);
  };

  const submit = async () => {
    const cb = parseAmount(costBasis) ?? 0;
    const cv = parseAmount(currentValue) ?? cb;
    if (!name) return;
    const body = {
      name,
      type,
      symbol: symbol || undefined,
      costBasis: cb,
      currentValue: cv,
      platform: platform || undefined,
    };
    if (editing) await updateInv.mutateAsync({ id: editing.id, body });
    else await createInv.mutateAsync(body);
    setEditOpen(false);
  };

  const submitLog = async () => {
    const a = parseAmount(logAmt);
    if (!a || !logTarget) return;
    await logTxn.mutateAsync({
      id: logTarget.id,
      body: { action: logAction, amount: a, quantity: logQty ? Number(logQty) : undefined },
    });
    setLogOpen(false);
  };

  const list = useMemo(() => investments.data?.investments ?? [], [investments.data]);
  const portfolio = useMemo(() => list.reduce((s, i) => s + i.currentValue, 0), [list]);
  const costBasisTotal = useMemo(() => list.reduce((s, i) => s + i.costBasis, 0), [list]);
  const gains = portfolio - costBasisTotal;
  const gainsPct = costBasisTotal > 0 ? (gains / costBasisTotal) * 100 : 0;
  const heroColor = gains >= 0 ? '#4ade80' : palette.danger;

  const allocation = useMemo(() => {
    const byType: Record<string, number> = {};
    list.forEach((i) => {
      byType[i.type] = (byType[i.type] ?? 0) + i.currentValue;
    });
    return Object.entries(byType).map(([label, value]) => ({
      label,
      value,
      color: TYPE_META[label]?.color ?? '#94a3b8',
    }));
  }, [list]);

  return (
    <ThemedScene scene="vault">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={investments.isFetching} onRefresh={() => investments.refetch()} />}>
        <PageHeader
          title="Investments"
          subtitle={`${list.length} holdings`}
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
          <GradientCard accent={heroColor} accent2={accent} intensity={0.18}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconTile icon="trending-up" accent={heroColor} size={48} iconSize={24} />
              <View style={{ flex: 1 }}>
                <HeroMetric
                  label="PORTFOLIO VALUE"
                  value={fmtINR(portfolio)}
                  accent={heroColor}
                  caption={`${gains >= 0 ? '+' : ''}${fmtINR(gains)} · ${gains >= 0 ? '+' : ''}${gainsPct.toFixed(1)}%`}
                />
              </View>
              <View style={[styles.deltaPill, { borderColor: heroColor + '99', backgroundColor: heroColor + '22' }]}>
                <Ionicons name={gains >= 0 ? 'arrow-up' : 'arrow-down'} size={14} color={heroColor} />
                <Text style={[styles.deltaText, { color: heroColor }]}>{Math.abs(gainsPct).toFixed(1)}%</Text>
              </View>
            </View>
          </GradientCard>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <Pressable onPress={openCreate} style={[styles.btn, { borderColor: accent + '99', backgroundColor: accent + '14' }]}>
            <Ionicons name="add-circle" size={14} color={accent} />
            <Text style={[styles.btnText, { color: accent }]}>New investment</Text>
          </Pressable>
        </View>

        {allocation.length > 0 && (
          <>
            <SectionTitle title="Allocation" accent={accent} />
            <View style={{ marginHorizontal: 20 }}>
              <GradientCard accent={accent} intensity={0.1}>
                <View style={styles.donutRow}>
                  <DonutChart slices={allocation} size={160} centerValue={fmtINR(portfolio)} centerLabel="Value" />
                  <View style={{ flex: 1, gap: 8 }}>
                    {allocation.map((a) => (
                      <View key={a.label} style={styles.legendRow}>
                        <View style={[styles.legendDot, { backgroundColor: a.color, shadowColor: a.color }]} />
                        <Text style={styles.legendLabel}>{a.label}</Text>
                        <Text style={styles.legendVal}>{fmtINR(a.value)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </GradientCard>
            </View>
          </>
        )}

        <SectionTitle title="Holdings" accent={accent2} />
        {list.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="trending-up" title="No investments yet" message="Track stocks, MFs, FDs, gold, crypto." accent={accent} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {list.map((inv) => {
              const ret = inv.currentValue - inv.costBasis;
              const retPct = inv.costBasis > 0 ? (ret / inv.costBasis) * 100 : 0;
              const meta = TYPE_META[inv.type] ?? TYPE_META.Other;
              const retColor = ret >= 0 ? '#4ade80' : palette.danger;
              return (
                <Pressable key={inv.id} onPress={() => openEdit(inv)}>
                  <View style={styles.cardWrap}>
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#10101c', borderRadius: 18 }]} />
                    <LinearGradient
                      colors={[meta.color + '18', '#10101cf2', meta.color + '14']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={[StyleSheet.absoluteFillObject, { borderRadius: 18, borderWidth: 1, borderColor: meta.color + '66' }]} />
                    <View style={{ padding: 14 }}>
                      <View style={styles.headRow}>
                        <IconTile icon={meta.icon} accent={meta.color} size={44} iconSize={20} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>{inv.name}</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                            <ColoredPill label={inv.type} color={meta.color} small />
                            {inv.symbol && <ColoredPill label={inv.symbol} color="#94a3b8" small />}
                            {inv.platform && <ColoredPill label={inv.platform} color="#f59e0b" small />}
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.value, { color: meta.color }]}>{fmtINR(inv.currentValue)}</Text>
                          <Text style={[styles.delta, { color: retColor }]}>
                            {ret >= 0 ? '+' : ''}
                            {retPct.toFixed(1)}%
                          </Text>
                        </View>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            setLogTarget(inv);
                            setLogAction('Buy');
                            setLogQty('');
                            setLogAmt('');
                            setLogOpen(true);
                          }}
                          style={[styles.logBtn, { borderColor: accent, backgroundColor: accent + '22' }]}>
                          <Ionicons name="add-circle" size={14} color={accent} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomSheet visible={editOpen} onClose={() => setEditOpen(false)} title={editing ? 'Edit investment' : 'New investment'}>
        <ScrollView style={{ maxHeight: 520 }}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {INVESTMENT_TYPES.map((t) => {
              const meta = TYPE_META[t];
              const active = type === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[styles.chip, active && { backgroundColor: meta.color + '22', borderColor: meta.color }]}>
                  <Ionicons name={meta.icon} size={12} color={active ? meta.color : palette.textMuted} />
                  <Text style={[styles.chipText, active && { color: meta.color }]}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.fieldLabel}>Symbol (optional)</Text>
          <TextInput value={symbol} onChangeText={setSymbol} style={styles.input} placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>Cost basis</Text>
          <TextInput value={costBasis} onChangeText={setCostBasis} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>Current value</Text>
          <TextInput value={currentValue} onChangeText={setCurrentValue} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>Platform</Text>
          <TextInput value={platform} onChangeText={setPlatform} style={styles.input} placeholder="Zerodha, etc." placeholderTextColor={palette.textDim} />
          <View style={{ height: 14 }} />
          <GlowButton title={editing ? 'Save' : 'Create'} color={accent} onPress={submit} loading={createInv.isPending || updateInv.isPending} />
          {editing && (
            <Pressable
              onPress={async () => {
                if (!editing) return;
                await deleteInv.mutateAsync(editing.id);
                setEditOpen(false);
              }}
              style={[styles.deleteBtn, { borderColor: palette.danger + '99', backgroundColor: palette.danger + '14' }]}>
              <Ionicons name="trash" size={14} color={palette.danger} />
              <Text style={{ color: palette.danger, fontWeight: '900' }}>Delete investment</Text>
            </Pressable>
          )}
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={logOpen} onClose={() => setLogOpen(false)} title={`Log · ${logTarget?.name ?? ''}`}>
        <Text style={styles.fieldLabel}>Action</Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {(['Buy', 'Sell', 'SIP', 'Dividend', 'Interest'] as InvestmentAction[]).map((a) => (
            <Pressable
              key={a}
              onPress={() => setLogAction(a)}
              style={[styles.chip, logAction === a && { backgroundColor: accent + '22', borderColor: accent }]}>
              <Text style={[styles.chipText, logAction === a && { color: accent }]}>{a}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.fieldLabel}>Quantity (optional)</Text>
        <TextInput value={logQty} onChangeText={setLogQty} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
        <Text style={styles.fieldLabel}>Amount</Text>
        <TextInput value={logAmt} onChangeText={setLogAmt} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
        <View style={{ height: 14 }} />
        <GlowButton title="Log" color={accent} onPress={submitLog} loading={logTxn.isPending} />
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
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  deltaText: { fontWeight: '900', fontSize: 12 },
  logBtn: { padding: 8, borderRadius: 999, borderWidth: 1, marginLeft: 4 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, shadowOpacity: 0.7, shadowRadius: 4 },
  legendLabel: { color: palette.text, fontSize: 12, flex: 1, fontWeight: '700' },
  legendVal: { color: palette.textMuted, fontSize: 12, fontWeight: '800' },
  cardWrap: { borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: palette.text, fontWeight: '900', fontSize: 14, letterSpacing: -0.2 },
  value: { fontSize: 14, fontWeight: '900' },
  delta: { fontSize: 11, fontWeight: '900', marginTop: 1 },
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
