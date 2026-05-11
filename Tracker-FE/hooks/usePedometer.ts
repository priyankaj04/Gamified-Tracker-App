import { useEffect, useRef, useState } from 'react';
import { Pedometer } from 'expo-sensors';
import { useSyncSteps } from './useSpirit';

interface PedometerState {
  available: boolean;
  permitted: boolean;
  todaySteps: number;
}

export function useDevicePedometer({ enabled = true }: { enabled?: boolean } = {}) {
  const [state, setState] = useState<PedometerState>({
    available: false,
    permitted: false,
    todaySteps: 0,
  });
  const sync = useSyncSteps();
  const lastSyncedRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        if (!available) {
          if (!cancelled) setState((s) => ({ ...s, available: false }));
          return;
        }

        // Request permissions (iOS HealthKit / Android Activity Recognition)
        const perm = await Pedometer.requestPermissionsAsync();
        if (!perm.granted) {
          if (!cancelled) setState((s) => ({ ...s, available: true, permitted: false }));
          return;
        }

        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        const result = await Pedometer.getStepCountAsync(start, end);
        if (!cancelled) {
          setState({ available: true, permitted: true, todaySteps: result.steps });
        }

        // Sync to backend at most once every 5 min
        const now = Date.now();
        if (now - lastSyncedRef.current > 5 * 60 * 1000) {
          sync.mutate({ steps: result.steps });
          lastSyncedRef.current = now;
        }
      } catch {
        if (!cancelled) setState((s) => ({ ...s, available: false }));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return state;
}
