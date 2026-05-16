import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AppState, Platform } from 'react-native';

// expo-notifications is unavailable in Expo Go (SDK 53+). Gate all calls so
// the app degrades gracefully — features still work, alerts just no-op.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const notificationsSupported = !isExpoGo;

if (notificationsSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const safe = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  if (!notificationsSupported) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
};

let permissionPromptInFlight = false;

export const ensurePermission = async (): Promise<boolean> => {
  if (!notificationsSupported) return false;
  if (permissionPromptInFlight) return false;
  return safe(async () => {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    permissionPromptInFlight = true;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } finally {
      permissionPromptInFlight = false;
    }
  }, false);
};

// Android channel — required for push categorisation. No-op on iOS.
export const setupChannels = async () => {
  if (!notificationsSupported) return;
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#f97316',
  });
  await Notifications.setNotificationChannelAsync('rest-timer', {
    name: 'Rest Timer',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#f97316',
  });
  // 'reminders' is kept for dojo to preserve existing scheduled IDs. New modules use
  // dedicated channels so the user can mute one module without losing the rest.
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Workout Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#f97316',
  });
  await Notifications.setNotificationChannelAsync('fasting', {
    name: 'Fasting',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4ade80',
  });
  await Notifications.setNotificationChannelAsync('forge', {
    name: 'Forge (Coding & Learning)',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#a855f7',
  });
  await Notifications.setNotificationChannelAsync('spirit-habits', {
    name: 'Spirit · Habits & Logging',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#4ade80',
  });
  await Notifications.setNotificationChannelAsync('spirit-hydration', {
    name: 'Spirit · Hydration',
    importance: Notifications.AndroidImportance.LOW,
    lightColor: '#38bdf8',
  });
  await Notifications.setNotificationChannelAsync('vault', {
    name: 'Vault (Finance)',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#facc15',
  });
  await Notifications.setNotificationChannelAsync('quest-daily', {
    name: 'Quest · Daily Summary',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#f472b6',
  });
  await Notifications.setNotificationChannelAsync('gamification', {
    name: 'Achievements & Penalties',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: '#facc15',
  });
};

export const scheduleFastTargetNotification = async (
  targetSeconds: number,
): Promise<string | null> => {
  if (targetSeconds <= 0) return null;
  const ok = await ensurePermission();
  if (!ok) return null;
  return safe(
    () =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Fast complete 🔥',
          body: 'You hit your target. Tap to end the fast and claim XP.',
          sound: 'default',
          data: { tag: 'kaizenarc:fast-target' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: targetSeconds,
          channelId: 'fasting',
        },
      }),
    null,
  );
};

export const cancelFastNotifications = async () => {
  await cancelByTag('kaizenarc:fast-target');
};

export const scheduleRestTimerNotification = async (
  seconds: number,
): Promise<string | null> => {
  if (seconds <= 0) return null;
  const ok = await ensurePermission();
  if (!ok) return null;
  return safe(
    () =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Rest complete',
          body: 'Time to crush your next set 💪',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          channelId: 'rest-timer',
        },
      }),
    null,
  );
};

export const cancelScheduledNotification = async (id: string | null) => {
  if (!id || !notificationsSupported) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    /* already fired */
  }
};

export interface DailyReminderInput {
  hour: number; // 0..23
  minute: number; // 0..59
  title: string;
  body: string;
}

export const scheduleDailyReminder = async (input: DailyReminderInput): Promise<string | null> => {
  const ok = await ensurePermission();
  if (!ok) return null;
  return safe(
    () =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: input.title,
          body: input.body,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: input.hour,
          minute: input.minute,
          channelId: 'reminders',
        },
      }),
    null,
  );
};

export const cancelAllReminders = async () => {
  if (!notificationsSupported) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    /* ignore */
  }
};

// Tag prefix so we can identify reminders we own (vs rest-timer one-shots).
const REMINDER_TAGS = {
  daily: 'kaizenarc:daily-workout',
  streak: 'kaizenarc:streak-at-risk',
  weekly: 'kaizenarc:weekly-summary',
} as const;

const cancelByTag = async (tag: string) => {
  if (!notificationsSupported) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => (n.content.data as any)?.tag === tag)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    /* ignore */
  }
};

// ─── Quest reminders ────────────────────────────────────────
const QUEST_TAG = 'kaizenarc:quest-reminder';

export const scheduleQuestReminder = async (
  questId: string,
  remindAt: string,
  title: string,
): Promise<string | null> => {
  const at = new Date(remindAt);
  const seconds = Math.floor((at.getTime() - Date.now()) / 1000);
  if (seconds <= 0) return null;
  const ok = await ensurePermission();
  if (!ok) return null;
  // Cancel any pre-existing reminder for this quest first
  await cancelQuestReminder(questId);
  return safe(
    () =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Quest waiting',
          body: title,
          sound: 'default',
          data: { tag: QUEST_TAG, questId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds,
          channelId: 'reminders',
        },
      }),
    null,
  );
};

export const cancelQuestReminder = async (questId: string) => {
  if (!notificationsSupported) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter(
          (n) =>
            (n.content.data as any)?.tag === QUEST_TAG &&
            (n.content.data as any)?.questId === questId,
        )
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    /* ignore */
  }
};

export interface ReminderSettings {
  workoutReminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  streakAtRiskEnabled: boolean;
  weeklySummaryEnabled: boolean;
}

// Idempotently sync all dojo-related recurring reminders to match settings.
// Safe to call on every settings save and on app start.
export const syncDojoReminders = async (settings: ReminderSettings): Promise<void> => {
  if (!notificationsSupported) return;
  const granted = await ensurePermission();
  await Promise.all([
    cancelByTag(REMINDER_TAGS.daily),
    cancelByTag(REMINDER_TAGS.streak),
    cancelByTag(REMINDER_TAGS.weekly),
  ]);
  if (!granted) return;

  if (settings.workoutReminderEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to train',
        body: 'Your dojo awaits — log today\'s workout to keep the streak.',
        sound: 'default',
        data: { tag: REMINDER_TAGS.daily },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.reminderHour,
        minute: settings.reminderMinute,
        channelId: 'reminders',
      },
    });
  }

  if (settings.streakAtRiskEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Streak at risk',
        body: 'Haven\'t logged a workout today? Tap to keep your streak alive.',
        sound: 'default',
        data: { tag: REMINDER_TAGS.streak },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
        channelId: 'reminders',
      },
    });
  }

  if (settings.weeklySummaryEnabled) {
    // Sunday in expo-notifications WEEKLY trigger: weekday 1 = Sunday.
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Week wrapped',
        body: 'See how this week stacked up in the Dojo.',
        sound: 'default',
        data: { tag: REMINDER_TAGS.weekly },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1,
        hour: 19,
        minute: 0,
        channelId: 'reminders',
      },
    });
  }
};

// ─── Forge reminders ────────────────────────────────────────
const FORGE_TAGS = {
  daily: 'kaizenarc:forge:daily-code',
  streak: 'kaizenarc:forge:streak-at-risk',
  weekly: 'kaizenarc:forge:weekly-summary',
} as const;

export interface ForgeReminderSettings {
  codeReminderEnabled: boolean;
  codeReminderHour: number;
  codeReminderMinute: number;
  streakAtRiskEnabled: boolean;
  weeklySummaryEnabled: boolean;
}

export const syncForgeReminders = async (settings: ForgeReminderSettings): Promise<void> => {
  if (!notificationsSupported) return;
  const granted = await ensurePermission();
  await Promise.all([
    cancelByTag(FORGE_TAGS.daily),
    cancelByTag(FORGE_TAGS.streak),
    cancelByTag(FORGE_TAGS.weekly),
  ]);
  if (!granted) return;

  if (settings.codeReminderEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time to forge',
        body: 'Open the editor — even 25 minutes counts.',
        sound: 'default',
        data: { tag: FORGE_TAGS.daily },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.codeReminderHour,
        minute: settings.codeReminderMinute,
        channelId: 'forge',
      },
    });
  }

  if (settings.streakAtRiskEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Coding streak at risk',
        body: 'A short session keeps the chain alive.',
        sound: 'default',
        data: { tag: FORGE_TAGS.streak },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 0,
        channelId: 'forge',
      },
    });
  }

  if (settings.weeklySummaryEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Forge weekly review',
        body: 'See what shipped and what slipped this week.',
        sound: 'default',
        data: { tag: FORGE_TAGS.weekly },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1,
        hour: 19,
        minute: 30,
        channelId: 'forge',
      },
    });
  }
};

// ─── Spirit reminders ───────────────────────────────────────
const SPIRIT_TAGS = {
  breakfast: 'kaizenarc:spirit:meal-breakfast',
  lunch: 'kaizenarc:spirit:meal-lunch',
  dinner: 'kaizenarc:spirit:meal-dinner',
  hydration: 'kaizenarc:spirit:hydration',
  windDown: 'kaizenarc:spirit:wind-down',
  habitStreak: 'kaizenarc:spirit:habit-streak',
} as const;

export interface SpiritReminderSettings {
  mealRemindersEnabled: boolean;
  breakfastHour: number;
  lunchHour: number;
  dinnerHour: number;
  hydrationEnabled: boolean;
  hydrationStartHour: number; // 0..23
  hydrationEndHour: number; // 0..23
  hydrationIntervalHours: number; // typically 2..4
  windDownEnabled: boolean;
  bedtimeHour: number; // wind-down fires 30 min before
  bedtimeMinute: number;
  habitStreakAtRiskEnabled: boolean;
}

// Schedules hydration pings at a fixed interval across the waking window.
// Picks discrete daily slots (not TIME_INTERVAL) so users get a predictable cadence.
const scheduleHydrationCycle = async (
  startHour: number,
  endHour: number,
  intervalHours: number,
): Promise<void> => {
  const hours: number[] = [];
  const step = Math.max(1, Math.floor(intervalHours));
  for (let h = startHour; h <= endHour; h += step) {
    if (h >= 0 && h <= 23) hours.push(h);
  }
  await Promise.all(
    hours.map((h) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hydrate',
          body: 'Glass of water — keep the body honest.',
          sound: 'default',
          data: { tag: SPIRIT_TAGS.hydration },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: h,
          minute: 0,
          channelId: 'spirit-hydration',
        },
      }),
    ),
  );
};

export const syncSpiritReminders = async (settings: SpiritReminderSettings): Promise<void> => {
  if (!notificationsSupported) return;
  const granted = await ensurePermission();
  await Promise.all([
    cancelByTag(SPIRIT_TAGS.breakfast),
    cancelByTag(SPIRIT_TAGS.lunch),
    cancelByTag(SPIRIT_TAGS.dinner),
    cancelByTag(SPIRIT_TAGS.hydration),
    cancelByTag(SPIRIT_TAGS.windDown),
    cancelByTag(SPIRIT_TAGS.habitStreak),
  ]);
  if (!granted) return;

  if (settings.mealRemindersEnabled) {
    const meals: { tag: string; hour: number; title: string; body: string }[] = [
      { tag: SPIRIT_TAGS.breakfast, hour: settings.breakfastHour, title: 'Log breakfast', body: 'Capture the first fuel of the day.' },
      { tag: SPIRIT_TAGS.lunch, hour: settings.lunchHour, title: 'Log lunch', body: 'Mid-day check-in — what did you eat?' },
      { tag: SPIRIT_TAGS.dinner, hour: settings.dinnerHour, title: 'Log dinner', body: 'Close the calorie loop.' },
    ];
    await Promise.all(
      meals.map((m) =>
        Notifications.scheduleNotificationAsync({
          content: {
            title: m.title,
            body: m.body,
            sound: 'default',
            data: { tag: m.tag },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: m.hour,
            minute: 0,
            channelId: 'spirit-habits',
          },
        }),
      ),
    );
  }

  if (settings.hydrationEnabled) {
    await scheduleHydrationCycle(
      settings.hydrationStartHour,
      settings.hydrationEndHour,
      settings.hydrationIntervalHours,
    );
  }

  if (settings.windDownEnabled) {
    let wdHour = settings.bedtimeHour;
    let wdMin = settings.bedtimeMinute - 30;
    if (wdMin < 0) {
      wdMin += 60;
      wdHour = (wdHour + 23) % 24;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Wind down',
        body: 'Dim the screens. Bed in 30.',
        sound: 'default',
        data: { tag: SPIRIT_TAGS.windDown },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: wdHour,
        minute: wdMin,
        channelId: 'spirit-habits',
      },
    });
  }

  if (settings.habitStreakAtRiskEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Habits unfinished',
        body: 'Check off today\'s habits before midnight.',
        sound: 'default',
        data: { tag: SPIRIT_TAGS.habitStreak },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 21,
        minute: 30,
        channelId: 'spirit-habits',
      },
    });
  }
};

// ─── Vault reminders ────────────────────────────────────────
const VAULT_TAGS = {
  bill: 'kaizenarc:vault:bill-due',
  weekly: 'kaizenarc:vault:weekly-review',
  subscription: 'kaizenarc:vault:subscription-renew',
} as const;

export interface VaultReminderSettings {
  weeklyReviewEnabled: boolean;
  weeklyReviewWeekday: number; // 1 = Sunday
  weeklyReviewHour: number;
  subscriptionAlertsEnabled: boolean;
}

export const syncVaultReminders = async (settings: VaultReminderSettings): Promise<void> => {
  if (!notificationsSupported) return;
  const granted = await ensurePermission();
  await cancelByTag(VAULT_TAGS.weekly);
  // Note: bill + subscription one-shots are managed by scheduleBillReminder /
  // scheduleSubscriptionAlert on row create — not swept here.
  if (!granted) return;

  if (settings.weeklyReviewEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly money review',
        body: 'Spend, save, invest — 2 minutes to scan.',
        sound: 'default',
        data: { tag: VAULT_TAGS.weekly },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: settings.weeklyReviewWeekday,
        hour: settings.weeklyReviewHour,
        minute: 0,
        channelId: 'vault',
      },
    });
  }
};

// Bill reminders: T-1 day (evening) + day-of (morning). Tagged by billId so they
// can be cancelled when the bill is paid or deleted.
export const scheduleBillReminder = async (
  billId: string,
  dueAt: string,
  label: string,
): Promise<void> => {
  if (!notificationsSupported) return;
  const granted = await ensurePermission();
  if (!granted) return;
  await cancelBillReminder(billId);

  const due = new Date(dueAt);
  const dayBefore = new Date(due);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(19, 0, 0, 0);
  const morningOf = new Date(due);
  morningOf.setHours(9, 0, 0, 0);

  const now = Date.now();
  const slots: { at: Date; title: string; body: string }[] = [
    { at: dayBefore, title: 'Bill due tomorrow', body: `${label} — pay it before it slips.` },
    { at: morningOf, title: 'Bill due today', body: `${label} is due. Settle up.` },
  ];

  await Promise.all(
    slots
      .filter((s) => s.at.getTime() > now)
      .map((s) => {
        const seconds = Math.floor((s.at.getTime() - now) / 1000);
        return Notifications.scheduleNotificationAsync({
          content: {
            title: s.title,
            body: s.body,
            sound: 'default',
            data: { tag: VAULT_TAGS.bill, billId },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds,
            channelId: 'vault',
          },
        });
      }),
  );
};

export const cancelBillReminder = async (billId: string): Promise<void> => {
  if (!notificationsSupported) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter(
          (n) =>
            (n.content.data as any)?.tag === VAULT_TAGS.bill &&
            (n.content.data as any)?.billId === billId,
        )
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    /* ignore */
  }
};

// ─── Quest daily summary ────────────────────────────────────
const QUEST_DAILY_TAGS = {
  summary: 'kaizenarc:quest:daily-summary',
} as const;

export interface QuestReminderSettings {
  dailySummaryEnabled: boolean;
  dailySummaryHour: number;
}

export const syncQuestReminders = async (settings: QuestReminderSettings): Promise<void> => {
  if (!notificationsSupported) return;
  const granted = await ensurePermission();
  await cancelByTag(QUEST_DAILY_TAGS.summary);
  if (!granted) return;

  if (settings.dailySummaryEnabled) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Quests waiting',
        body: 'Tap to see what\'s still open today.',
        sound: 'default',
        data: { tag: QUEST_DAILY_TAGS.summary },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.dailySummaryHour,
        minute: 0,
        channelId: 'quest-daily',
      },
    });
  }
};

// ─── Gamification (ad-hoc, fire-now) ────────────────────────
// Fires a one-shot local notification on the gamification channel. Useful when
// the app is backgrounded mid-action and the user should still see the achievement.
// Skips when the app is foregrounded — the in-app modal already celebrates, and
// a duplicate OS banner would feel noisy.
export const notifyAchievement = async (input: {
  title: string;
  body: string;
  /** Force-fire even when the app is foregrounded. Default: false. */
  force?: boolean;
}): Promise<void> => {
  if (!notificationsSupported) return;
  if (!input.force && AppState.currentState === 'active') return;
  const granted = await ensurePermission();
  if (!granted) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        sound: 'default',
        data: { tag: 'kaizenarc:achievement' },
      },
      trigger: null, // fire immediately
    });
  } catch {
    /* ignore */
  }
};
