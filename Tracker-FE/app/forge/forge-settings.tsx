import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { palette, screenTheme } from '@/lib/themes';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlowButton } from '@/components/ui/GlowButton';
import { useForgeSettings, useUpdateForgeSettings } from '@/hooks/useForgeStats';

export default function ForgeSettingsScreen() {
  const accent = screenTheme.forge.accent;
  const { data } = useForgeSettings();
  const update = useUpdateForgeSettings();

  const [goalMin, setGoalMin] = useState('120');
  const [pomWork, setPomWork] = useState('25');
  const [pomBreak, setPomBreak] = useState('5');
  const [github, setGithub] = useState('');
  const [billRate, setBillRate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [workStart, setWorkStart] = useState('9');
  const [workEnd, setWorkEnd] = useState('23');
  const [weekStart, setWeekStart] = useState(1);
  const [weeklyDsa, setWeeklyDsa] = useState('5');

  useEffect(() => {
    if (data) {
      setGoalMin(String(data.dailyCodingGoalMin));
      setPomWork(String(data.pomodoroWorkMin));
      setPomBreak(String(data.pomodoroBreakMin));
      setGithub(data.githubUsername ?? '');
      setBillRate(data.billableRate?.toString() ?? '');
      setCurrency(data.billableCurrency);
      setWorkStart(String(data.workStartHour));
      setWorkEnd(String(data.workEndHour));
      setWeekStart(data.weekStartDay);
      setWeeklyDsa(String(data.weeklyDsaGoal));
    }
  }, [data]);

  const onSave = async () => {
    try {
      await update.mutateAsync({
        dailyCodingGoalMin: Number(goalMin),
        pomodoroWorkMin: Number(pomWork),
        pomodoroBreakMin: Number(pomBreak),
        githubUsername: github || null,
        billableRate: billRate ? Number(billRate) : null,
        billableCurrency: currency,
        workStartHour: Number(workStart),
        workEndHour: Number(workEnd),
        weekStartDay: weekStart,
        weeklyDsaGoal: Number(weeklyDsa),
      });
      Alert.alert('Saved');
    } catch (e: any) {
      Alert.alert('Failed', e?.message ?? 'Could not save settings');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled">
        <PageHeader title="Forge Settings" subtitle="Configure" accent={accent} accent2={screenTheme.forge.accent2} />
        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          <Row label="Daily Coding Goal (min)">
            <TextInput value={goalMin} onChangeText={setGoalMin} keyboardType="numeric" style={styles.input} />
          </Row>
          <Row label="Pomodoro Work (min)">
            <TextInput value={pomWork} onChangeText={setPomWork} keyboardType="numeric" style={styles.input} />
          </Row>
          <Row label="Pomodoro Break (min)">
            <TextInput value={pomBreak} onChangeText={setPomBreak} keyboardType="numeric" style={styles.input} />
          </Row>
          <Row label="GitHub Username">
            <TextInput value={github} onChangeText={setGithub} autoCapitalize="none" style={styles.input} />
          </Row>
          <Row label="Billable Rate / hr">
            <TextInput value={billRate} onChangeText={setBillRate} keyboardType="numeric" style={styles.input} />
          </Row>
          <Row label="Currency">
            <TextInput value={currency} onChangeText={setCurrency} autoCapitalize="characters" style={styles.input} />
          </Row>
          <Row label="Work Start Hour">
            <TextInput value={workStart} onChangeText={setWorkStart} keyboardType="numeric" style={styles.input} />
          </Row>
          <Row label="Work End Hour">
            <TextInput value={workEnd} onChangeText={setWorkEnd} keyboardType="numeric" style={styles.input} />
          </Row>
          <Row label="Week Starts On">
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {[
                { label: 'Sun', val: 0 },
                { label: 'Mon', val: 1 },
              ].map((d) => (
                <Pressable
                  key={d.val}
                  onPress={() => setWeekStart(d.val)}
                  style={[styles.choice, weekStart === d.val && { borderColor: accent, backgroundColor: accent + '22' }]}>
                  <Text style={[styles.choiceText, weekStart === d.val && { color: accent }]}>{d.label}</Text>
                </Pressable>
              ))}
            </View>
          </Row>
          <Row label="Weekly DSA Goal">
            <TextInput value={weeklyDsa} onChangeText={setWeeklyDsa} keyboardType="numeric" style={styles.input} />
          </Row>

          <GlowButton title="Save Settings" color={accent} loading={update.isPending} onPress={onSave} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: palette.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  input: { backgroundColor: palette.card, borderRadius: 10, borderWidth: 1, borderColor: palette.border, color: palette.text, padding: 12, fontSize: 14 },
  choice: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card },
  choiceText: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
});
