import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let permissionPromptInFlight = false;

export const ensurePermission = async (): Promise<boolean> => {
  if (permissionPromptInFlight) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  permissionPromptInFlight = true;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } finally {
    permissionPromptInFlight = false;
  }
};

// Android channel — required for push categorisation. No-op on iOS.
export const setupChannels = async () => {
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
};

export const scheduleRestTimerNotification = async (
  seconds: number,
): Promise<string | null> => {
  if (seconds <= 0) return null;
  const ok = await ensurePermission();
  if (!ok) return null;
  return Notifications.scheduleNotificationAsync({
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
  });
};

export const cancelScheduledNotification = async (id: string | null) => {
  if (!id) return;
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
  return Notifications.scheduleNotificationAsync({
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
  });
};

export const cancelAllReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

// Tag prefix so we can identify reminders we own (vs rest-timer one-shots).
const REMINDER_TAGS = {
  daily: 'kaizenarc:daily-workout',
  streak: 'kaizenarc:streak-at-risk',
  weekly: 'kaizenarc:weekly-summary',
} as const;

const cancelByTag = async (tag: string) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => (n.content.data as any)?.tag === tag)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
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
