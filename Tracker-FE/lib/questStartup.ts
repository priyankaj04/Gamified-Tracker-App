import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { questKeys } from '@/hooks/useQuests';

const KEY_LAST_ROLLOVER = 'kaizenarc:quest-last-rollover';
const KEY_LAST_ARCHIVE = 'kaizenarc:quest-last-archive';

const todayISO = () => new Date().toISOString().slice(0, 10);

// Idempotent — safe to call on every app open.
// Performs daily-quest recurrence rollover and auto-archive at most once per day.
export const runQuestStartupTasks = async () => {
  const today = todayISO();

  try {
    const last = await AsyncStorage.getItem(KEY_LAST_ROLLOVER);
    if (last !== today) {
      await api.post('/quests/rollover');
      await AsyncStorage.setItem(KEY_LAST_ROLLOVER, today);
      queryClient.invalidateQueries({ queryKey: questKeys.all });
    }
  } catch {
    /* network failure — try again next launch */
  }

  try {
    const last = await AsyncStorage.getItem(KEY_LAST_ARCHIVE);
    if (last !== today) {
      await api.post('/quests/auto-archive');
      await AsyncStorage.setItem(KEY_LAST_ARCHIVE, today);
      queryClient.invalidateQueries({ queryKey: questKeys.all });
    }
  } catch {
    /* ignore */
  }

  try {
    await api.post('/quests/challenges/seed');
    queryClient.invalidateQueries({ queryKey: questKeys.challenges });
  } catch {
    /* ignore */
  }
};
