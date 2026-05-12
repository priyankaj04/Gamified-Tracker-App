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
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useTransfer,
} from '@/hooks/useFinance';
import type { Account, AccountType } from '@/types';
import { ACCOUNT_TYPES, fmtINR, parseAmount } from './_shared';
import { GradientCard, HeroMetric, IconTile, ColoredPill } from './_components';

const TYPE_ICON: Record<AccountType, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  Cash: 'cash',
  Bank: 'business',
  'Credit Card': 'card',
  'UPI Wallet': 'phone-portrait',
  Investment: 'trending-up',
  Other: 'wallet',
};

export default function AccountsScreen() {
  const accent = screenTheme.vault.accent;
  const accent2 = screenTheme.vault.accent2;
  const accounts = useAccounts();
  const createAcc = useCreateAccount();
  const updateAcc = useUpdateAccount();
  const deleteAcc = useDeleteAccount();
  const transfer = useTransfer();

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('Bank');
  const [opening, setOpening] = useState('');
  const [color, setColor] = useState('#a3e635');
  const [includeNW, setIncludeNW] = useState(true);

  const [xferOpen, setXferOpen] = useState(false);
  const [fromId, setFromId] = useState<string | null>(null);
  const [toId, setToId] = useState<string | null>(null);
  const [xferAmt, setXferAmt] = useState('');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setType('Bank');
    setOpening('');
    setColor('#a3e635');
    setIncludeNW(true);
    setEditOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setName(a.name);
    setType(a.type);
    setOpening(String(a.openingBalance));
    setColor(a.color);
    setIncludeNW(a.includeInNetWorth);
    setEditOpen(true);
  };

  const submit = async () => {
    const opn = parseAmount(opening) ?? 0;
    if (!name) return;
    const body = { name, type, openingBalance: opn, color, includeInNetWorth: includeNW };
    if (editing) await updateAcc.mutateAsync({ id: editing.id, body });
    else await createAcc.mutateAsync(body);
    setEditOpen(false);
  };

  const totalNW = (accounts.data?.accounts ?? [])
    .filter((a) => a.includeInNetWorth)
    .reduce((s, a) => s + (a.balance ?? a.openingBalance), 0);
  const totalBalance = (accounts.data?.accounts ?? []).reduce(
    (s, a) => s + (a.balance ?? a.openingBalance),
    0,
  );

  return (
    <ThemedScene scene="vault">
      <ScrollView
        refreshControl={
          <RefreshControl tintColor={accent} refreshing={accounts.isFetching} onRefresh={() => accounts.refetch()} />
        }>
        <PageHeader
          title="Accounts"
          subtitle={`${(accounts.data?.accounts ?? []).length} tracked`}
          accent={accent}
          accent2={accent2}
          right={
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        {/* Hero card */}
        <View style={{ marginHorizontal: 20, marginBottom: 6 }}>
          <GradientCard accent="#a3e635" accent2={accent} intensity={0.18}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <IconTile icon="card" accent="#a3e635" size={48} iconSize={24} />
              <View style={{ flex: 1 }}>
                <HeroMetric label="NET WORTH" value={fmtINR(totalNW)} accent="#a3e635" caption={`Total balance · ${fmtINR(totalBalance)}`} />
              </View>
            </View>
          </GradientCard>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={openCreate} style={[styles.btn, { borderColor: accent + '99', backgroundColor: accent + '14' }]}>
            <Ionicons name="add-circle" size={14} color={accent} />
            <Text style={[styles.btnText, { color: accent }]}>New account</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setFromId(null);
              setToId(null);
              setXferAmt('');
              setXferOpen(true);
            }}
            style={[styles.btn, { borderColor: accent2 + '99', backgroundColor: accent2 + '14' }]}>
            <Ionicons name="swap-horizontal" size={14} color={accent2} />
            <Text style={[styles.btnText, { color: accent2 }]}>Transfer</Text>
          </Pressable>
        </View>

        <SectionTitle title="My accounts" accent="#a3e635" />
        {(accounts.data?.accounts ?? []).length === 0 ? (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState
              icon="card"
              title="No accounts yet"
              message="Track multiple accounts to see real balances and net worth."
              accent={accent}
            />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {(accounts.data?.accounts ?? []).map((a) => {
              const bal = a.balance ?? a.openingBalance;
              return (
                <Pressable key={a.id} onPress={() => openEdit(a)}>
                  <View style={styles.cardWrap}>
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#10101c', borderRadius: 18 }]} />
                    <LinearGradient
                      colors={[a.color + '14', '#10101cf2', a.color + '14']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={[StyleSheet.absoluteFillObject, { borderRadius: 18, borderWidth: 1, borderColor: a.color + '66' }]} />
                    <View style={styles.cardBody}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <IconTile icon={TYPE_ICON[a.type] ?? 'wallet'} accent={a.color} size={44} iconSize={20} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardName}>{a.name}</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                            <ColoredPill label={a.type} color={a.color} small />
                            {!a.includeInNetWorth && <ColoredPill label="excluded" color={palette.textDim} small />}
                          </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.cardBal, { color: bal >= 0 ? a.color : palette.danger }]}>
                            {fmtINR(bal)}
                          </Text>
                          <Text style={styles.cardCap}>{a.currency}</Text>
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

      <BottomSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        title={editing ? 'Edit account' : 'New account'}>
        <ScrollView style={{ maxHeight: 520 }}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor={palette.textDim} placeholder="e.g. HDFC Savings" />
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {ACCOUNT_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.chip, type === t && { backgroundColor: color + '22', borderColor: color }]}>
                <Ionicons name={TYPE_ICON[t]} size={12} color={type === t ? color : palette.textMuted} />
                <Text style={[styles.chipText, type === t && { color }]}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Opening balance</Text>
          <TextInput value={opening} onChangeText={setOpening} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} placeholder="0" />
          <Text style={styles.fieldLabel}>Color</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['#a3e635', '#4ade80', '#fbbf24', '#f59e0b', '#f97316', '#ef4444', '#fbbf24', '#fb923c'].map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.swatch, { backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: palette.text }]}>
                {color === c && <Ionicons name="checkmark" size={14} color="#0b0b14" />}
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.toggleRow} onPress={() => setIncludeNW((v) => !v)}>
            <Ionicons name={includeNW ? 'checkbox' : 'square-outline'} size={20} color={color} />
            <Text style={{ color: palette.text, fontWeight: '700' }}>Include in net worth</Text>
          </Pressable>
          <View style={{ height: 14 }} />
          <GlowButton title={editing ? 'Save' : 'Create'} color={color} onPress={submit} loading={createAcc.isPending || updateAcc.isPending} />
          {editing && (
            <Pressable
              onPress={async () => {
                if (!editing) return;
                await deleteAcc.mutateAsync(editing.id);
                setEditOpen(false);
              }}
              style={[styles.deleteBtn, { borderColor: palette.danger + '99', backgroundColor: palette.danger + '14' }]}>
              <Ionicons name="trash" size={14} color={palette.danger} />
              <Text style={{ color: palette.danger, fontWeight: '900' }}>Delete account</Text>
            </Pressable>
          )}
        </ScrollView>
      </BottomSheet>

      <BottomSheet visible={xferOpen} onClose={() => setXferOpen(false)} title="Transfer">
        <Text style={styles.fieldLabel}>From</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(accounts.data?.accounts ?? []).map((a) => (
              <Pressable
                key={a.id}
                onPress={() => setFromId(a.id)}
                style={[styles.chip, fromId === a.id && { backgroundColor: a.color + '22', borderColor: a.color }]}>
                <View style={[styles.miniDot, { backgroundColor: a.color }]} />
                <Text style={[styles.chipText, fromId === a.id && { color: a.color }]}>{a.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.fieldLabel}>To</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(accounts.data?.accounts ?? []).filter((a) => a.id !== fromId).map((a) => (
              <Pressable
                key={a.id}
                onPress={() => setToId(a.id)}
                style={[styles.chip, toId === a.id && { backgroundColor: a.color + '22', borderColor: a.color }]}>
                <View style={[styles.miniDot, { backgroundColor: a.color }]} />
                <Text style={[styles.chipText, toId === a.id && { color: a.color }]}>{a.name}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <Text style={styles.fieldLabel}>Amount</Text>
        <TextInput value={xferAmt} onChangeText={setXferAmt} style={styles.input} keyboardType="numeric" placeholderTextColor={palette.textDim} />
        <View style={{ height: 14 }} />
        <GlowButton
          title="Transfer"
          color={accent}
          loading={transfer.isPending}
          onPress={async () => {
            const a = parseAmount(xferAmt);
            if (!a || !fromId || !toId) return;
            await transfer.mutateAsync({ fromId, toId, amount: a });
            setXferOpen(false);
          }}
        />
      </BottomSheet>
    </ThemedScene>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 14 },
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
  cardBody: { padding: 14 },
  cardName: { color: palette.text, fontWeight: '900', fontSize: 15, letterSpacing: -0.2 },
  cardBal: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
  cardCap: { color: palette.textDim, fontSize: 10, fontWeight: '800', marginTop: 1 },
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
  miniDot: { width: 8, height: 8, borderRadius: 4 },
  swatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
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
