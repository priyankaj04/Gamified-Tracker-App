import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Resolve the API base URL in this priority order:
// 1. EXPO_PUBLIC_API_BASE_URL env var — explicit override
// 2. Expo dev server hostUri (covers physical devices on the same LAN)
// 3. Android emulator alias for host loopback
// 4. localhost for iOS simulator + web
const resolveApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (envUrl) return envUrl;

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as any).expoGoConfig?.debuggerHost ??
    (Constants as any).manifest?.debuggerHost;

  if (hostUri) {
    const host = String(hostUri).split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000/api`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://192.168.0.112:3000/api';
  }
  return 'http://localhost:3000/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

export const APP_NAME = 'KaizenArc';
export const USER_NAME = 'Priyanka';
