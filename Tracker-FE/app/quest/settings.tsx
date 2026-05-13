import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { palette, priorityColor, screenTheme } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { GlowButton } from '@/components/ui/GlowButton';
import { useQuestSettings, useUpdateQuestSettings } from '@/hooks/useQuests';
import type { Priority } from '@/types';

const PRIORITIES: Priority[] = ['S', 'A', 'B', 'C'];

export default function QuestSettingsScreen() {
  const router = useRouter();
  const accent = screenTheme.quests.accent;
  const accent2 = screenTheme.quests.accent2;
  const settingsQ = useQuestSettings();
  const update = useUpdateQuestSettings();

  const [defaultPriority, setDefaultPriority] = useState<Priority>('C');
  const [autoArchiveDays, setAutoArchiveDays] = useState('30');
  const [reminderOffset, setReminderOffset] = useState('60');
  const [sounds, setSounds] = useState(true);
  const [combo, setCombo] = useState(true);
  const [penalty, setPenalty] = useState(false);

  useEffect(() => {
    const s = settingsQ.data;
    if (!s) return;
    setDefaultPriority(s.defaultPriority);
    setAutoArchiveDays(String(s.autoArchiveDays));
    setReminderOffset(String(s.reminderOffsetMinutes));
    setSounds(s.soundsEnabled);
    setCombo(s.comboEnabled);
    setPenalty(s.penaltyEnabled);
  }, [settingsQ.data]);

  const save = () => {
    update.mutate({
      defaultPriority,
      autoArchiveDays: Number(autoArchiveDays) || 30,
      reminderOffsetMinutes: Number(reminderOffset) || 60,
      soundsEnabled: sounds,
      comboEnabled: combo,
      penaltyEnabled: penalty,
    });
  };

  return (
    <ThemedScene scene="quests">
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        <PageHeader
          title="Settings"
          subtitle="Hunter Preferences"
          accent={accent}
          accent2={accent2}
          right={
            <Pressable hitSlop={8} onPress={() => router.back()}>
              <Ionicons name="close" size={26} color={accent} />
            </Pressable>
          }
        />

        <SectionTitle title="Defaults" accent={accent} />
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <View>
            <Text style={styles.label}>Default priority</Text>
            <View style={styles.row}>
              {PRIORITIES.map((p) => {
                const active = defaultPriority === p;
                const c = priorityColor[p];
                return (
                  <Pressable
                    key={p}
                    onPress={() => setDefaultPriority(p)}
                    style={[
                      styles.prioBtn,
                      active && { backgroundColor: c + '22', borderColor: c },
                    ]}>
                    <Text style={[styles.prioTxt, active && { color: c }]}>{p}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View>
            <Text style={styles.label}>Auto-archive after (days)</Text>
            <TextInput
              value={autoArchiveDays}
              onChangeText={(v) => setAutoArchiveDays(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>

          <View>
            <Text style={styles.label}>Reminder lead time (minutes)</Text>
            <TextInput
              value={reminderOffset}
              onChangeText={(v) => setReminderOffset(v.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              style={styles.input}
            />
          </View>
        </View>

        <SectionTitle title="Flair" accent={accent} />
        <View style={{ paddingHorizontal: 20, gap: 6 }}>
          <Toggle label="Completion sounds & haptics" value={sounds} onChange={setSounds} accent={accent} />
          <Toggle label="Combo multiplier (3 in 60m)" value={combo} onChange={setCombo} accent={accent} />
          <Toggle
            label="Daily miss penalty (XP fatigue)"
            value={penalty}
            onChange={setPenalty}
            accent={palette.danger}
          />
        </View>

        <View style={{ padding: 20, marginTop: 12 }}>
          <GlowButton title="Save" color={accent} loading={update.isPending} onPress={save} />
        </View>
      </ScrollView>
    </ThemedScene>
  );
}

function Toggle({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accent: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLbl}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={value ? accent : palette.textMuted}
        trackColor={{ false: palette.border, true: accent + '88' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  row: { flexDirection: 'row', gap: 6 },
  prioBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  prioTxt: { color: palette.textMuted, fontWeight: '900', fontSize: 14 },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  toggleLbl: { color: palette.text, fontWeight: '700', fontSize: 13, flex: 1 },
});
