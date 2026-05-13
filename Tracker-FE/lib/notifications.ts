import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

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
