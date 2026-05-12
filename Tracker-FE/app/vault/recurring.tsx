import React, { useState } from 'react';
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
  useRecurring,
  useCreateRecurring,
  useUpdateRecurring,
  useConfirmRecurring,
  useCancelRecurring,
  useDeleteRecurring,
  useProcessDueRecurring,
} from '@/hooks/useFinance';
import { todayISO } from '@/components/ui/DatePicker';
import type { RecurringTransaction, RecurringFrequency, TxType } from '@/types';
import { CATEGORIES, FREQUENCIES, fmtINR, parseAmount } from './_shared';
import { GradientCard, HeroMetric, IconTile, ColoredPill } from './_components';

export default function RecurringScreen() {
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const recurring = useRecurring();
  const create = useCreateRecurring();
  const update = useUpdateRecurring();
  const confirm = useConfirmRecurring();
  const cancel = useCancelRecurring();
  const del = useDeleteRecurring();
  const processDue = useProcessDueRecurring();

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxType>('Expense');
  const [category, setCategory] = useState('Bills');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [interval, setInterval] = useState('1');
  const [startDate, setStartDate] = useState(todayISO());
  const [isSub, setIsSub] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setAmount('');
    setType('Expense');
    setCategory('Bills');
    setFrequency('monthly');
    setInterval('1');
    setStartDate(todayISO());
    setIsSub(false);
    setEditOpen(true);
  };

  const openEdit = (r: RecurringTransaction) => {
    setEditing(r);
    setName(r.name);
    setAmount(String(r.amount));
    setType(r.type);
    setCategory(r.category);
    setFrequency(r.frequency);
    setInterval(String(r.interval));
    setStartDate(r.startDate);
    setIsSub(r.isSubscription);
    setEditOpen(true);
  };

  const submit = async () => {
    const a = parseAmount(amount);
    if (!a || !name) return;
    const body = {
      name,
      amount: a,
      type,
      category,
      frequency,
      interval: Number(interval) || 1,
      startDate,
      nextDue: startDate,
      isSubscription: isSub,
    };
    if (editing) await update.mutateAsync({ id: editing.id, body });
    else await create.mutateAsync(body);
    setEditOpen(false);
  };

  const active = (recurring.data?.recurring ?? []).filter((r) => !r.cancelled);
  const due = active.filter((r) => !r.paused && r.nextDue <= todayISO());
  const monthlyTotal = active.reduce((s, r) => {
    if (r.type !== 'Expense') return s;
    const mult = r.frequency === 'monthly' ? 1 : r.frequency === 'yearly' ? 1 / 12 : r.frequency === 'weekly' ? 52 / 12 : 30;
    return s + r.amount * mult;
  }, 0);

  return (
    <ThemedScene scene="vault">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={recurring.isFetching} onRefresh={() => recurring.refetch()} />}>
        <PageHeader
          title="Recurring"
          subtitle={`${active.length} active · ${due.length} due now`}
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
          <GradientCard accent="#f59e0b" accent2={accent} intensity={0.18}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconTile icon="repeat" accent="#f59e0b" size={48} iconSize={24} />
              <View style={{ flex: 1 }}>
                <HeroMetric
                  label="MONTHLY OUTGO"
                  value={fmtINR(monthlyTotal)}
                  accent="#f59e0b"
                  caption={`Across ${active.length} recurring${active.length === 1 ? '' : 's'}`}
                />
              </View>
            </View>
          </GradientCard>
        </View>

        <View style={{ paddingHorizontal: 20, flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <Pressable onPress={openCreate} style={[styles.btn, { borderColor: accent + '99', backgroundColor: accent + '14' }]}>
            <Ionicons name="add-circle" size={14} color={accent} />
            <Text style={[styles.btnText, { color: accent }]}>New recurring</Text>
          </Pressable>
          {due.length > 0 && (
            <Pressable onPress={() => processDue.mutate()} style={[styles.btn, { borderColor: '#fb923c', backgroundColor: '#fb923c22' }]}>
              <Ionicons name="flash" size={14} color="#fb923c" />
              <Text style={[styles.btnText, { color: '#fb923c' }]}>Process all ({due.length})</Text>
            </Pressable>
          )}
        </View>

        {due.length > 0 && (
          <>
            <SectionTitle title="Due now" accent="#fb923c" />
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {due.map((r) => (
                <View key={r.id} style={styles.cardWrap}>
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#10101c', borderRadius: 18 }]} />
                  <LinearGradient
                    colors={['#fb923c1a', '#10101cf2', '#fb923c14']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={[StyleSheet.absoluteFillObject, { borderRadius: 18, borderWidth: 1, borderColor: '#fb923c88' }]} />
                  <View style={{ padding: 14, gap: 8 }}>
                    <View style={styles.headRow}>
                      <IconTile icon="alarm" accent="#fb923c" size={40} iconSize={18} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.name}>{r.name}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                          <ColoredPill label={r.frequency} color="#fb923c" small />
                          <ColoredPill label={`due ${r.nextDue}`} color="#fbbf24" icon="time" small />
                        </View>
                      </View>
                      <Text style={[styles.amt, { color: r.type === 'Income' ? '#4ade80' : palette.danger }]}>{fmtINR(r.amount)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Pressable
                        onPress={() => confirm.mutate({ id: r.id, body: {} })}
                        style={[styles.miniBtn, { backgroundColor: accent + '22', borderColor: accent }]}>
                        <Ionicons name="checkmark" size={12} color={accent} />
                        <Text style={[styles.miniBtnText, { color: accent }]}>Confirm</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => openEdit(r)}
                        style={[styles.miniBtn, { backgroundColor: '#10101c', borderColor: 'rgba(255,255,255,0.14)' }]}>
                        <Ionicons name="create" size={12} color={palette.text} />
                        <Text style={[styles.miniBtnText, { color: palette.text }]}>Edit</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => cancel.mutate(r.id)}
                        style={[styles.miniBtn, { backgroundColor: palette.danger + '14', borderColor: palette.danger + '99' }]}>
                        <Ionicons name="close" size={12} color={palette.danger} />
                        <Text style={[styles.miniBtnText, { color: palette.danger }]}>Cancel</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <SectionTitle title="All recurring" accent="#f59e0b" />
        {active.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="repeat" title="Nothing recurring" message="Add rent, salary, subs to track them automatically." accent={accent} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {active.map((r) => {
              const stripeColor = r.type === 'Income' ? '#4ade80' : r.isSubscription ? '#fb923c' : '#f59e0b';
              return (
                <Pressable key={r.id} onPress={() => openEdit(r)}>
                  <View style={styles.cardWrap}>
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#10101c', borderRadius: 18 }]} />
                    <LinearGradient
                      colors={[stripeColor + '14', '#10101cf2', stripeColor + '10']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={[StyleSheet.absoluteFillObject, { borderRadius: 18, borderWidth: 1, borderColor: stripeColor + '55' }]} />
                    <View style={{ padding: 12 }}>
                      <View style={styles.headRow}>
                        <IconTile icon={r.isSubscription ? 'sync' : 'repeat'} accent={stripeColor} size={40} iconSize={18} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>{r.name}</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                            <ColoredPill label={r.category} color={stripeColor} small />
                            <ColoredPill label={`${r.interval}× ${r.frequency}`} color="#94a3b8" small />
                            {r.isSubscription && <ColoredPill label="SUB" color="#fb923c" small />}
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.amt, { color: r.type === 'Income' ? '#4ade80' : palette.danger }]}>{fmtINR(r.amount)}</Text>
                          <Text style={styles.dueCap}>next {r.nextDue}</Text>
                        </View>
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

      <BottomSheet visible={editOpen} onClose={() => setEditOpen(false)} title={editing ? 'Edit recurring' : 'New recurring'}>
        <ScrollView style={{ maxHeight: 520 }}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['Expense', 'Income'] as TxType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.chip, type === t && { backgroundColor: accent + '22', borderColor: accent }]}>
                <Ionicons name={t === 'Income' ? 'arrow-down' : 'arrow-up'} size={12} color={type === t ? accent : palette.textMuted} />
                <Text style={[styles.chipText, type === t && { color: accent }]}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Amount</Text>
          <TextInput value={amount} onChangeText={setAmount} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.chip, category === c && { backgroundColor: accent + '22', borderColor: accent }]}>
                  <Text style={[styles.chipText, category === c && { color: accent }]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Text style={styles.fieldLabel}>Frequency</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {FREQUENCIES.map((f) => (
              <Pressable
                key={f}
                onPress={() => setFrequency(f)}
                style={[styles.chip, frequency === f && { backgroundColor: accent + '22', borderColor: accent }]}>
                <Text style={[styles.chipText, frequency === f && { color: accent }]}>{f}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Interval</Text>
          <TextInput value={interval} onChangeText={setInterval} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>Start date (YYYY-MM-DD)</Text>
          <TextInput value={startDate} onChangeText={setStartDate} style={styles.input} placeholderTextColor={palette.textDim} />
          <Pressable onPress={() => setIsSub((v) => !v)} style={styles.toggleRow}>
            <Ionicons name={isSub ? 'checkbox' : 'square-outline'} size={20} color="#fb923c" />
            <Text style={{ color: palette.text, fontWeight: '800' }}>Is a subscription</Text>
          </Pressable>
          <View style={{ height: 14 }} />
          <GlowButton title={editing ? 'Save' : 'Create'} color={accent} onPress={submit} loading={create.isPending || update.isPending} />
          {editing && (
            <Pressable
              onPress={async () => {
                if (!editing) return;
                await del.mutateAsync(editing.id);
                setEditOpen(false);
              }}
              style={[styles.deleteBtn, { borderColor: palette.danger + '99', backgroundColor: palette.danger + '14' }]}>
              <Ionicons name="trash" size={14} color={palette.danger} />
              <Text style={{ color: palette.danger, fontWeight: '900' }}>Delete recurring</Text>
            </Pressable>
          )}
        </ScrollView>
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
  },
  btnText: { fontWeight: '900', fontSize: 12 },
  cardWrap: { borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: palette.text, fontWeight: '900', fontSize: 14, letterSpacing: -0.2 },
  amt: { fontSize: 14, fontWeight: '900' },
  dueCap: { color: palette.textDim, fontSize: 10, fontWeight: '700', marginTop: 1 },
  miniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  miniBtnText: { fontWeight: '800', fontSize: 11 },
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
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
