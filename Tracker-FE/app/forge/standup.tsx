import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlowButton } from '@/components/ui/GlowButton';
import { DatePicker, todayISO } from '@/components/ui/DatePicker';
import { api } from '@/lib/api';
import {
  useStandups,
  useTodayStandup,
  useUpsertStandup,
} from '@/hooks/useStandup';

export default function StandupScreen() {
  const accent = screenTheme.forge.accent;
  const today = useTodayStandup();
  const history = useStandups();
  const upsert = useUpsertStandup();

  const [date, setDate] = useState(todayISO());
  const [yesterday, setYesterday] = useState('');
  const [todayTxt, setTodayTxt] = useState('');
  const [blockers, setBlockers] = useState('');

  // When the picked date matches today, hydrate from /standup/today.
  // For past dates, look up the entry in history if present.
  useEffect(() => {
    const isToday = date === todayISO();
    if (isToday && today.data?.standup) {
      setYesterday(today.data.standup.yesterday ?? '');
      setTodayTxt(today.data.standup.today ?? '');
      setBlockers(today.data.standup.blockers ?? '');
      return;
    }
    const past = history.data?.standups.find((s) => s.date === date);
    if (past) {
      setYesterday(past.yesterday ?? '');
      setTodayTxt(past.today ?? '');
      setBlockers(past.blockers ?? '');
    } else {
      setYesterday('');
      setTodayTxt('');
      setBlockers('');
    }
  }, [date, today.data, history.data]);

  const onSave = async () => {
    try {
      await upsert.mutateAsync({ date, yesterday, today: todayTxt, blockers });
      Alert.alert('Saved');
    } catch (e: any) {
      Alert.alert('Failed', e?.message ?? 'Could not save standup');
    }
  };

  const onExport = async () => {
    try {
      const res = await api.get<{ data: { text: string } }>('/standup/export');
      const text = res.data.data.text;
      const path = (FileSystem as any).cacheDirectory + 'standup-export.txt';
      await FileSystem.writeAsStringAsync(path, text);
      await Sharing.shareAsync(path);
    } catch (e: any) {
      Alert.alert('Export failed', e.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView>
        <PageHeader
          title="Daily Standup"
          subtitle="Forge"
          accent={accent}
          accent2={screenTheme.forge.accent2}
          right={
            <Pressable onPress={onExport} hitSlop={8}>
              <Ionicons name="share-outline" size={22} color={accent} />
            </Pressable>
          }
        />

        <View style={styles.todayCard}>
          <Text style={styles.cardTitle}>
            {date === todayISO() ? 'Today' : 'Backfill'} · {new Date(date).toLocaleDateString()}
          </Text>
          <Text style={styles.label}>Date</Text>
          <DatePicker value={date} onChange={setDate} accent={accent} />
          <Text style={styles.label}>Yesterday</Text>
          <TextInput value={yesterday} onChangeText={setYesterday} multiline style={[styles.input, { height: 70 }]} placeholderTextColor={palette.textDim} />
          <Text style={styles.label}>Today</Text>
          <TextInput value={todayTxt} onChangeText={setTodayTxt} multiline style={[styles.input, { height: 70 }]} placeholderTextColor={palette.textDim} />
          <Text style={styles.label}>Blockers</Text>
          <TextInput value={blockers} onChangeText={setBlockers} multiline style={[styles.input, { height: 60 }]} placeholderTextColor={palette.textDim} />
          <GlowButton title="Save" color={accent} loading={upsert.isPending} onPress={onSave} style={{ marginTop: 10 }} />
        </View>

        <Text style={styles.histTitle}>HISTORY</Text>
        <View style={{ paddingHorizontal: 20 }}>
          {(history.data?.standups ?? []).map((s) => (
            <View key={s.id} style={styles.histCard}>
              <View style={styles.histHead}>
                <Text style={styles.histDate}>{new Date(s.date).toLocaleDateString()}</Text>
                {s.blockers ? <Text style={styles.blocker}>🚫</Text> : null}
              </View>
              {s.yesterday && (
                <Text style={styles.histText} numberOfLines={2}>
                  <Text style={styles.histKey}>Y: </Text>
                  {s.yesterday}
                </Text>
              )}
              {s.today && (
                <Text style={styles.histText} numberOfLines={2}>
                  <Text style={styles.histKey}>T: </Text>
                  {s.today}
                </Text>
              )}
              {s.blockers && (
                <Text style={[styles.histText, { color: '#fbbf24' }]} numberOfLines={2}>
                  <Text style={styles.histKey}>B: </Text>
                  {s.blockers}
                </Text>
              )}
            </View>
          ))}
        </View>
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  todayCard: { backgroundColor: palette.card, borderRadius: 14, borderWidth: 1, borderColor: palette.border, padding: 14, gap: 6, marginHorizontal: 20 },
  cardTitle: { color: palette.text, fontWeight: '900', fontSize: 14, marginBottom: 4 },
  label: { color: palette.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', marginTop: 6 },
  input: { backgroundColor: palette.bg, borderRadius: 10, borderWidth: 1, borderColor: palette.border, color: palette.text, padding: 10, fontSize: 13, textAlignVertical: 'top' },
  histTitle: { color: palette.textMuted, fontWeight: '900', fontSize: 11, letterSpacing: 0.6, marginTop: 18, marginBottom: 8, paddingHorizontal: 20 },
  histCard: { backgroundColor: palette.card, borderRadius: 10, borderWidth: 1, borderColor: palette.border, padding: 10, gap: 4, marginBottom: 8 },
  histHead: { flexDirection: 'row', justifyContent: 'space-between' },
  histDate: { color: palette.text, fontWeight: '900', fontSize: 12 },
  blocker: { fontSize: 14 },
  histText: { color: palette.textMuted, fontSize: 12, lineHeight: 17 },
  histKey: { color: palette.text, fontWeight: '900' },
});
