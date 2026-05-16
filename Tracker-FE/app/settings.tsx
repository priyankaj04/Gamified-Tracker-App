import React from 'react';
import { ScrollView, View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { palette } from '@/lib/themes';
import { API_BASE_URL, APP_NAME } from '@/constants';
import { useAppStore } from '@/store/useAppStore';
import { useSettings, useUpdateSettings, type UserSettings } from '@/hooks/useSettings';
import {
  syncDojoReminders,
  syncForgeReminders,
  syncSpiritReminders,
  syncVaultReminders,
  syncQuestReminders,
} from '@/lib/notifications';

export default function SettingsScreen() {
  const haptics = useAppStore((s) => s.hapticsEnabled);
  const setHaptics = useAppStore((s) => s.setHapticsEnabled);
  const bgm = useAppStore((s) => s.bgmEnabled);
  const setBgm = useAppStore((s) => s.setBgmEnabled);
  const bgmVolume = useAppStore((s) => s.bgmVolume);
  const setVolume = useAppStore((s) => s.setBgmVolume);

  const { data: settings } = useSettings();
  const update = useUpdateSettings();

  // Save + re-sync the affected module's reminders so changes take effect immediately.
  const save = (patch: Partial<UserSettings>, module?: 'dojo' | 'forge' | 'spirit' | 'vault' | 'quest') => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    update.mutate(patch, {
      onSuccess: () => {
        if (module === 'dojo') void syncDojoReminders(next);
        if (module === 'forge') {
          void syncForgeReminders({
            codeReminderEnabled: next.forgeCodeReminderEnabled,
            codeReminderHour: next.forgeCodeReminderHour,
            codeReminderMinute: next.forgeCodeReminderMinute,
            streakAtRiskEnabled: next.forgeStreakAtRiskEnabled,
            weeklySummaryEnabled: next.forgeWeeklySummaryEnabled,
          });
        }
        if (module === 'spirit') {
          void syncSpiritReminders({
            mealRemindersEnabled: next.spiritMealRemindersEnabled,
            breakfastHour: next.spiritBreakfastHour,
            lunchHour: next.spiritLunchHour,
            dinnerHour: next.spiritDinnerHour,
            hydrationEnabled: next.spiritHydrationEnabled,
            hydrationStartHour: next.spiritHydrationStartHour,
            hydrationEndHour: next.spiritHydrationEndHour,
            hydrationIntervalHours: next.spiritHydrationIntervalHours,
            windDownEnabled: next.spiritWindDownEnabled,
            bedtimeHour: next.spiritBedtimeHour,
            bedtimeMinute: next.spiritBedtimeMinute,
            habitStreakAtRiskEnabled: next.spiritHabitStreakAtRiskEnabled,
          });
        }
        if (module === 'vault') {
          void syncVaultReminders({
            weeklyReviewEnabled: next.vaultWeeklyReviewEnabled,
            weeklyReviewWeekday: next.vaultWeeklyReviewWeekday,
            weeklyReviewHour: next.vaultWeeklyReviewHour,
            subscriptionAlertsEnabled: next.vaultSubscriptionAlertsEnabled,
          });
        }
        if (module === 'quest') {
          void syncQuestReminders({
            dailySummaryEnabled: next.questDailySummaryEnabled,
            dailySummaryHour: next.questDailySummaryHour,
          });
        }
      },
    });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text style={styles.section}>App</Text>
      <View style={styles.card}>
        <Row label="Name" value={APP_NAME} />
        <Row label="API" value={API_BASE_URL} />
      </View>

      <Text style={styles.section}>Preferences</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Haptics</Text>
          <Switch value={haptics} onValueChange={setHaptics} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Background Music</Text>
          <Switch value={bgm} onValueChange={setBgm} />
        </View>
        {bgm && (
          <View style={{ gap: 8 }}>
            <View style={styles.row}>
              <Text style={styles.label}>Volume</Text>
              <Text style={styles.value}>{Math.round(bgmVolume * 100)}%</Text>
            </View>
            <View style={styles.volumeRow}>
              {[0.05, 0.1, 0.2, 0.3, 0.5, 0.75].map((v) => {
                const active = Math.abs(bgmVolume - v) < 0.01;
                return (
                  <Text
                    key={v}
                    onPress={() => setVolume(v)}
                    style={[styles.volumeChip, active && styles.volumeChipActive]}>
                    {Math.round(v * 100)}
                  </Text>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {settings && (
        <>
          <Text style={styles.section}>Notifications · Dojo</Text>
          <View style={styles.card}>
            <SwitchRow
              label="Daily workout reminder"
              value={settings.workoutReminderEnabled}
              onChange={(v) => save({ workoutReminderEnabled: v }, 'dojo')}
            />
            {settings.workoutReminderEnabled && (
              <HourPicker
                label="At"
                hour={settings.reminderHour}
                onChange={(h) => save({ reminderHour: h }, 'dojo')}
              />
            )}
            <SwitchRow
              label="Streak-at-risk (8pm)"
              value={settings.streakAtRiskEnabled}
              onChange={(v) => save({ streakAtRiskEnabled: v }, 'dojo')}
            />
            <SwitchRow
              label="Weekly summary (Sun 7pm)"
              value={settings.weeklySummaryEnabled}
              onChange={(v) => save({ weeklySummaryEnabled: v }, 'dojo')}
            />
          </View>

          <Text style={styles.section}>Notifications · Forge</Text>
          <View style={styles.card}>
            <SwitchRow
              label="Daily code reminder"
              value={settings.forgeCodeReminderEnabled}
              onChange={(v) => save({ forgeCodeReminderEnabled: v }, 'forge')}
            />
            {settings.forgeCodeReminderEnabled && (
              <HourPicker
                label="At"
                hour={settings.forgeCodeReminderHour}
                onChange={(h) => save({ forgeCodeReminderHour: h }, 'forge')}
              />
            )}
            <SwitchRow
              label="Streak-at-risk (9pm)"
              value={settings.forgeStreakAtRiskEnabled}
              onChange={(v) => save({ forgeStreakAtRiskEnabled: v }, 'forge')}
            />
            <SwitchRow
              label="Weekly shipping summary"
              value={settings.forgeWeeklySummaryEnabled}
              onChange={(v) => save({ forgeWeeklySummaryEnabled: v }, 'forge')}
            />
          </View>

          <Text style={styles.section}>Notifications · Spirit</Text>
          <View style={styles.card}>
            <SwitchRow
              label="Meal reminders"
              value={settings.spiritMealRemindersEnabled}
              onChange={(v) => save({ spiritMealRemindersEnabled: v }, 'spirit')}
            />
            {settings.spiritMealRemindersEnabled && (
              <>
                <HourPicker
                  label="Breakfast"
                  hour={settings.spiritBreakfastHour}
                  onChange={(h) => save({ spiritBreakfastHour: h }, 'spirit')}
                />
                <HourPicker
                  label="Lunch"
                  hour={settings.spiritLunchHour}
                  onChange={(h) => save({ spiritLunchHour: h }, 'spirit')}
                />
                <HourPicker
                  label="Dinner"
                  hour={settings.spiritDinnerHour}
                  onChange={(h) => save({ spiritDinnerHour: h }, 'spirit')}
                />
              </>
            )}
            <SwitchRow
              label="Hydration cycle"
              value={settings.spiritHydrationEnabled}
              onChange={(v) => save({ spiritHydrationEnabled: v }, 'spirit')}
            />
            {settings.spiritHydrationEnabled && (
              <Row
                label="Every"
                value={`${settings.spiritHydrationIntervalHours}h, ${settings.spiritHydrationStartHour}:00–${settings.spiritHydrationEndHour}:00`}
              />
            )}
            <SwitchRow
              label="Wind down before bed"
              value={settings.spiritWindDownEnabled}
              onChange={(v) => save({ spiritWindDownEnabled: v }, 'spirit')}
            />
            <SwitchRow
              label="Habit streak-at-risk"
              value={settings.spiritHabitStreakAtRiskEnabled}
              onChange={(v) => save({ spiritHabitStreakAtRiskEnabled: v }, 'spirit')}
            />
          </View>

          <Text style={styles.section}>Notifications · Vault</Text>
          <View style={styles.card}>
            <SwitchRow
              label="Weekly money review"
              value={settings.vaultWeeklyReviewEnabled}
              onChange={(v) => save({ vaultWeeklyReviewEnabled: v }, 'vault')}
            />
            {settings.vaultWeeklyReviewEnabled && (
              <HourPicker
                label="At"
                hour={settings.vaultWeeklyReviewHour}
                onChange={(h) => save({ vaultWeeklyReviewHour: h }, 'vault')}
              />
            )}
            <SwitchRow
              label="Subscription renewals"
              value={settings.vaultSubscriptionAlertsEnabled}
              onChange={(v) => save({ vaultSubscriptionAlertsEnabled: v }, 'vault')}
            />
          </View>

          <Text style={styles.section}>Notifications · Quests</Text>
          <View style={styles.card}>
            <SwitchRow
              label="Daily open-quest summary"
              value={settings.questDailySummaryEnabled}
              onChange={(v) => save({ questDailySummaryEnabled: v }, 'quest')}
            />
            {settings.questDailySummaryEnabled && (
              <HourPicker
                label="At"
                hour={settings.questDailySummaryHour}
                onChange={(h) => save({ questDailySummaryHour: h }, 'quest')}
              />
            )}
          </View>

          <Text style={styles.section}>Gamification</Text>
          <View style={styles.card}>
            <SwitchRow
              label="Consistency penalties (lose XP for missed days)"
              value={settings.penaltiesEnabled}
              onChange={(v) => save({ penaltiesEnabled: v })}
            />
            <Text style={styles.help}>
              Logs &lt; 5 of any 7 days in an active module → XP penalty scaled by level. Passive
              modules (fasting, sleep, cycle) are exempt.
            </Text>
          </View>
        </>
      )}

      <Text style={styles.section}>About</Text>
      <View style={styles.card}>
        <Text style={styles.about}>
          KaizenArc — anime-styled goal tracker. Show up every day, level up.
        </Text>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

// Simple hour picker — chips for common slots + the current value. Avoids pulling
// in a date-picker dependency for a one-axis input.
function HourPicker({
  label,
  hour,
  onChange,
}: {
  label: string;
  hour: number;
  onChange: (h: number) => void;
}) {
  const fmt = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display} ${period}`;
  };
  const slots = [6, 7, 8, 9, 12, 13, 17, 18, 19, 20, 21, 22];
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{fmt(hour)}</Text>
      </View>
      <View style={styles.volumeRow}>
        {slots.map((h) => {
          const active = hour === h;
          return (
            <Pressable
              key={h}
              onPress={() => onChange(h)}
              style={[styles.volumeChipWrap, active && styles.volumeChipActiveWrap]}>
              <Text style={[styles.volumeChip, active && styles.volumeChipActive]}>{fmt(h)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { color: palette.text, fontWeight: '700', fontSize: 14, flexShrink: 1 },
  value: { color: palette.textMuted, fontSize: 13, flexShrink: 1, textAlign: 'right' },
  help: { color: palette.textMuted, fontSize: 12, lineHeight: 18 },
  about: { color: palette.textMuted, lineHeight: 20, fontSize: 13 },
  volumeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  volumeChipWrap: {},
  volumeChipActiveWrap: {},
  volumeChip: {
    color: palette.textMuted,
    backgroundColor: palette.bgElevated,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  volumeChipActive: {
    color: '#fff',
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
});
