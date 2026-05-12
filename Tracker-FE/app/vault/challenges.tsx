import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { EmptyState } from '@/components/layout/EmptyState';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import {
  useVaultChallenges,
  useCompleteChallenge,
  useCreateChallenge,
  useDeleteChallenge,
} from '@/hooks/useFinance';
import { GradientCard, GradientProgress, HeroMetric, IconTile, ColoredPill, VAULT_COLORS } from './_components';

export default function VaultChallengesScreen() {
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const challenges = useVaultChallenges();
  const complete = useCompleteChallenge();
  const createChallenge = useCreateChallenge();
  const del = useDeleteChallenge();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('1');
  const [xp, setXp] = useState('100');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'oneshot'>('weekly');

  const submit = async () => {
    if (!title) return;
    await createChallenge.mutateAsync({
      title,
      description: description || undefined,
      target: Number(target) || 1,
      xpReward: Number(xp) || 100,
      period,
    });
    setCreateOpen(false);
    setTitle('');
    setDescription('');
    setTarget('1');
    setXp('100');
    setPeriod('weekly');
  };

  const list = challenges.data?.challenges ?? [];
  const active = list.filter((c) => !c.completed);
  const done = list.filter((c) => c.completed);
  const totalRewardable = active.reduce((s, c) => s + c.xpReward, 0);

  return (
    <ThemedScene scene="vault">
      <ScrollView
        refreshControl={<RefreshControl tintColor={accent} refreshing={challenges.isFetching} onRefresh={() => challenges.refetch()} />}>
        <PageHeader
          title="Challenges"
          subtitle={`${active.length} ongoing · ${done.length} crushed`}
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
          <GradientCard accent={accent} accent2={accent2}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconTile icon="trophy" accent={accent} size={48} iconSize={24} />
              <View style={{ flex: 1 }}>
                <HeroMetric
                  label="UP FOR GRABS"
                  value={`+${totalRewardable.toLocaleString()} XP`}
                  accent={accent}
                  caption={active.length > 0 ? `${active.length} ongoing challenge${active.length === 1 ? '' : 's'}` : 'No active challenges yet'}
                />
              </View>
            </View>
          </GradientCard>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <Pressable onPress={() => setCreateOpen(true)} style={[styles.btn, { borderColor: accent, backgroundColor: accent + '22' }]}>
            <Ionicons name="add-circle" size={14} color={accent} />
            <Text style={[styles.btnText, { color: accent }]}>Create custom challenge</Text>
          </Pressable>
        </View>

        <SectionTitle title="Ongoing" accent={accent} />
        {active.length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="trophy" title="No ongoing challenges" message="Create your own or wait for the weekly rotation." accent={accent} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {active.map((c) => {
              const pct = c.target > 0 ? Math.min(1, c.progress / c.target) : 0;
              const periodColor =
                c.period === 'weekly'
                  ? VAULT_COLORS.lime
                  : c.period === 'monthly'
                  ? VAULT_COLORS.orange
                  : VAULT_COLORS.yellow;
              return (
                <GradientCard key={c.id} accent={periodColor} accent2={accent}>
                  <View style={styles.headRow}>
                    <View style={[styles.ongoingBadge, { backgroundColor: periodColor + '33', borderColor: periodColor }]}>
                      <View style={[styles.dot, { backgroundColor: periodColor }]} />
                      <Text style={[styles.ongoingText, { color: periodColor }]}>ONGOING</Text>
                    </View>
                    <ColoredPill label={c.period} color={VAULT_COLORS.neutral} small />
                    <View style={{ flex: 1 }} />
                    <Pressable onPress={() => del.mutate(c.id)} hitSlop={8}>
                      <Ionicons name="trash" size={14} color="rgba(255,255,255,0.5)" />
                    </Pressable>
                  </View>
                  <Text style={styles.title}>{c.title}</Text>
                  {!!c.description && <Text style={styles.desc} numberOfLines={3}>{c.description}</Text>}
                  <View style={{ marginTop: 10 }}>
                    <GradientProgress value={pct} accent={periodColor} accent2={accent} height={8} />
                  </View>
                  <View style={styles.footRow}>
                    <ColoredPill label={`${c.progress}/${c.target}`} color={periodColor} small />
                    <View style={[styles.xpChip, { borderColor: accent, backgroundColor: accent + '22' }]}>
                      <Ionicons name="flash" size={11} color={accent} />
                      <Text style={[styles.xpChipText, { color: accent }]}>+{c.xpReward} XP</Text>
                    </View>
                    <Text style={styles.endCap}>ends {c.endsOn}</Text>
                    <View style={{ flex: 1 }} />
                    <Pressable
                      onPress={() => complete.mutate(c.id)}
                      style={[styles.doneBtn, { borderColor: VAULT_COLORS.green, backgroundColor: VAULT_COLORS.green + '22' }]}>
                      <Ionicons name="checkmark-circle" size={14} color={VAULT_COLORS.green} />
                      <Text style={{ color: VAULT_COLORS.green, fontWeight: '900', fontSize: 12 }}>Mark done</Text>
                    </Pressable>
                  </View>
                </GradientCard>
              );
            })}
          </View>
        )}

        {done.length > 0 && (
          <>
            <SectionTitle title="Crushed 🎉" accent={VAULT_COLORS.green} />
            <View style={{ paddingHorizontal: 20, gap: 8 }}>
              {done.map((c) => (
                <View key={c.id} style={styles.doneRow}>
                  <View style={[styles.checkOrb, { backgroundColor: VAULT_COLORS.green + '22', borderColor: VAULT_COLORS.green + '88' }]}>
                    <Ionicons name="checkmark" size={14} color={VAULT_COLORS.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { fontSize: 13 }]}>{c.title}</Text>
                    <Text style={[styles.desc, { fontSize: 11 }]}>{c.description}</Text>
                  </View>
                  <ColoredPill label={`+${c.xpReward}`} color={accent} small icon="flash" />
                </View>
              ))}
            </View>
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      <BottomSheet visible={createOpen} onClose={() => setCreateOpen(false)} title="Create challenge">
        <ScrollView style={{ maxHeight: 520 }}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholderTextColor={palette.textDim} placeholder="e.g. No coffee for a week" />

          <Text style={styles.fieldLabel}>Description (optional)</Text>
          <TextInput value={description} onChangeText={setDescription} style={[styles.input, { minHeight: 60 }]} placeholderTextColor={palette.textDim} multiline placeholder="What does success look like?" />

          <Text style={styles.fieldLabel}>Period</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['weekly', 'monthly', 'oneshot'] as const).map((p) => {
              const color = p === 'weekly' ? VAULT_COLORS.lime : p === 'monthly' ? VAULT_COLORS.orange : VAULT_COLORS.yellow;
              return (
                <Pressable
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[
                    styles.chip,
                    period === p && { backgroundColor: color + '22', borderColor: color },
                  ]}>
                  <Text style={[styles.chipText, period === p && { color }]}>{p}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Target (count)</Text>
          <TextInput value={target} onChangeText={setTarget} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />

          <Text style={styles.fieldLabel}>XP reward</Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {[100, 200, 400, 800].map((v) => (
              <Pressable
                key={v}
                onPress={() => setXp(String(v))}
                style={[styles.chip, Number(xp) === v && { backgroundColor: accent + '22', borderColor: accent }]}>
                <Ionicons name="flash" size={11} color={Number(xp) === v ? accent : 'rgba(255,255,255,0.6)'} />
                <Text style={[styles.chipText, Number(xp) === v && { color: accent }]}>+{v}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput value={xp} onChangeText={setXp} style={[styles.input, { marginTop: 6 }]} keyboardType="numeric" placeholderTextColor={palette.textDim} />

          <View style={{ height: 14 }} />
          <GlowButton title="Create challenge" color={accent} onPress={submit} loading={createChallenge.isPending} />
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
    paddingVertical: 11,
    borderRadius: 999,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  btnText: { fontWeight: '900', fontSize: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#ffffff', fontWeight: '900', fontSize: 15, marginTop: 8, letterSpacing: -0.2 },
  desc: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '600', marginTop: 4, lineHeight: 17 },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  endCap: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '800' },
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
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.25)',
  },
  checkOrb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  chip: {
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
  chipText: { color: 'rgba(255,255,255,0.7)', fontWeight: '800', fontSize: 12 },
});
