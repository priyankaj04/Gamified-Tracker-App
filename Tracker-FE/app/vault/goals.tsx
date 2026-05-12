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
  useGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useContributeGoal,
} from '@/hooks/useFinance';
import type { SavingsGoal } from '@/types';
import { fmtINR, parseAmount } from './_shared';
import { GradientCard, GradientProgress, HeroMetric, IconTile, ColoredPill } from './_components';

export default function GoalsScreen() {
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const goals = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const contribute = useContributeGoal();

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#4ade80');

  const [contribOpen, setContribOpen] = useState(false);
  const [contribGoal, setContribGoal] = useState<SavingsGoal | null>(null);
  const [contribAmt, setContribAmt] = useState('');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setEmoji('🎯');
    setTarget('');
    setDeadline('');
    setColor('#4ade80');
    setEditOpen(true);
  };

  const openEdit = (g: SavingsGoal) => {
    setEditing(g);
    setName(g.name);
    setEmoji(g.emoji);
    setTarget(String(g.targetAmount));
    setDeadline(g.deadline ?? '');
    setColor(g.color);
    setEditOpen(true);
  };

  const submit = async () => {
    const t = parseAmount(target);
    if (!name || !t) return;
    if (editing) {
      await updateGoal.mutateAsync({
        id: editing.id,
        body: { name, emoji, targetAmount: t, deadline: deadline || null, color },
      });
    } else {
      await createGoal.mutateAsync({ name, emoji, targetAmount: t, deadline: deadline || null, color });
    }
    setEditOpen(false);
  };

  const submitContrib = async () => {
    const a = parseAmount(contribAmt);
    if (!a || !contribGoal) return;
    await contribute.mutateAsync({ id: contribGoal.id, body: { amount: a } });
    setContribOpen(false);
    setContribAmt('');
  };

  const list = goals.data?.goals ?? [];
  const active = list.filter((g) => !g.completed);
  const done = list.filter((g) => g.completed);
  const totalTarget = list.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = list.reduce((s, g) => s + g.currentAmount, 0);
  const overallPct = totalTarget > 0 ? Math.min(1, totalSaved / totalTarget) : 0;

  return (
    <ThemedScene scene="vault">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={goals.isFetching} onRefresh={() => goals.refetch()} />}>
        <PageHeader
          title="Goals"
          subtitle={`${active.length} active · ${done.length} crushed`}
          accent={accent}
          accent2={accent2}
          right={
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        {/* Hero progress */}
        <View style={{ marginHorizontal: 20 }}>
          <GradientCard accent="#4ade80" accent2={accent} intensity={0.18}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconTile icon="flag" accent="#4ade80" size={48} iconSize={24} />
              <View style={{ flex: 1 }}>
                <HeroMetric
                  label="SAVED ACROSS GOALS"
                  value={fmtINR(totalSaved)}
                  accent="#4ade80"
                  caption={`of ${fmtINR(totalTarget)} total · ${Math.round(overallPct * 100)}%`}
                />
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <GradientProgress value={overallPct} accent="#4ade80" accent2={accent} height={10} />
            </View>
          </GradientCard>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <Pressable onPress={openCreate} style={[styles.btn, { borderColor: accent + '99', backgroundColor: accent + '14' }]}>
            <Ionicons name="add-circle" size={14} color={accent} />
            <Text style={[styles.btnText, { color: accent }]}>New goal</Text>
          </Pressable>
        </View>

        <SectionTitle title="Active" accent="#4ade80" />
        {active.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="flag" title="No goals yet" message="Create one to start saving with intent." accent={accent} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {active.map((g) => {
              const pct = g.targetAmount > 0 ? Math.min(1, g.currentAmount / g.targetAmount) : 0;
              const days = g.deadline
                ? Math.max(0, Math.round((new Date(g.deadline).getTime() - Date.now()) / 86400000))
                : null;
              return (
                <Pressable key={g.id} onPress={() => openEdit(g)}>
                  <View style={styles.cardWrap}>
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#10101c', borderRadius: 18 }]} />
                    <LinearGradient
                      colors={[g.color + '14', '#10101cf2', g.color + '14']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={[StyleSheet.absoluteFillObject, { borderRadius: 18, borderWidth: 1, borderColor: g.color + '66' }]} />
                    <View style={{ padding: 14, gap: 10 }}>
                      <View style={styles.headRow}>
                        <View style={[styles.emojiBubble, { backgroundColor: g.color + '22', borderColor: g.color + '55' }]}>
                          <Text style={{ fontSize: 22 }}>{g.emoji}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.name}>{g.name}</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                            <ColoredPill label={`${Math.round(pct * 100)}%`} color={g.color} small />
                            {days !== null && (
                              <ColoredPill label={`${days}d left`} color={days < 30 ? '#fb923c' : palette.textMuted} icon="time" small />
                            )}
                          </View>
                        </View>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            setContribGoal(g);
                            setContribAmt('');
                            setContribOpen(true);
                          }}
                          style={[styles.addBtn, { borderColor: g.color, backgroundColor: g.color + '22' }]}>
                          <Ionicons name="add" size={14} color={g.color} />
                          <Text style={[styles.btnText, { color: g.color }]}>Add</Text>
                        </Pressable>
                      </View>
                      <View>
                        <GradientProgress value={pct} accent={g.color} height={10} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                          <Text style={styles.amt}>{fmtINR(g.currentAmount)}</Text>
                          <Text style={[styles.amt, { color: palette.textMuted }]}>{fmtINR(g.targetAmount)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {done.length > 0 && (
          <>
            <SectionTitle title="Crushed 🎉" accent="#fbbf24" />
            <View style={{ paddingHorizontal: 20, gap: 8 }}>
              {done.map((g) => (
                <View key={g.id} style={[styles.doneRow, { borderColor: g.color + '44' }]}>
                  <Text style={{ fontSize: 22 }}>{g.emoji}</Text>
                  <Text style={[styles.name, { flex: 1 }]}>{g.name}</Text>
                  <ColoredPill label="DONE" color="#4ade80" icon="checkmark-circle" small />
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomSheet visible={editOpen} onClose={() => setEditOpen(false)} title={editing ? 'Edit goal' : 'New goal'}>
        <ScrollView style={{ maxHeight: 520 }}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor={palette.textDim} placeholder="e.g. Tokyo trip" />
          <Text style={styles.fieldLabel}>Emoji</Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {['🎯', '🏖️', '📱', '🏠', '🚗', '💍', '🎓', '✈️', '🎮', '💻', '👶', '🐶'].map((e) => (
              <Pressable
                key={e}
                onPress={() => setEmoji(e)}
                style={[styles.emojiChip, emoji === e && { backgroundColor: color + '22', borderColor: color }]}>
                <Text style={{ fontSize: 20 }}>{e}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Target amount</Text>
          <TextInput value={target} onChangeText={setTarget} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>Deadline (YYYY-MM-DD, optional)</Text>
          <TextInput value={deadline} onChangeText={setDeadline} style={styles.input} placeholder="2026-12-31" placeholderTextColor={palette.textDim} />
          <Text style={styles.fieldLabel}>Color</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['#4ade80', '#fbbf24', '#a3e635', '#f59e0b', '#f97316', '#ef4444', '#fbbf24', '#fb923c'].map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.swatch, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: palette.text }]}>
                {color === c && <Ionicons name="checkmark" size={14} color="#0b0b14" />}
              </Pressable>
            ))}
          </View>
          <View style={{ height: 14 }} />
          <GlowButton title={editing ? 'Save' : 'Create'} color={color} onPress={submit} loading={createGoal.isPending || updateGoal.isPending} />
          {editing && (
            <Pressable
              onPress={async () => {
                if (!editing) return;
                await deleteGoal.mutateAsync(editing.id);
                setEditOpen(false);
              }}
              style={[styles.deleteBtn, { borderColor: palette.danger + '99', backgroundColor: palette.danger + '14' }]}>
              <Ionicons name="trash" size={14} color={palette.danger} />
              <Text style={{ color: palette.danger, fontWeight: '900' }}>Delete goal</Text>
            </Pressable>
          )}
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={contribOpen} onClose={() => setContribOpen(false)} title={`Add to ${contribGoal?.name ?? ''}`}>
        <Text style={styles.fieldLabel}>Amount</Text>
        <TextInput value={contribAmt} onChangeText={setContribAmt} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} placeholder="0" />
        <View style={{ height: 14 }} />
        <GlowButton title="Save" color={contribGoal?.color ?? accent} onPress={submitContrib} loading={contribute.isPending} />
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
  emojiBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: palette.text, fontWeight: '900', fontSize: 15, letterSpacing: -0.2 },
  amt: { color: palette.text, fontWeight: '900', fontSize: 13 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#10101c',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
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
  emojiChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: '#10101c',
  },
  swatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
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
