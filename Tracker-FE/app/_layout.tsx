import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { queryClient } from '@/lib/queryClient';
import { palette } from '@/lib/themes';
import { XPPopupHost } from '@/components/gamification/XPPopup';

export const unstable_settings = {
  anchor: '(tabs)',
};

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.bg,
    card: palette.bgElevated,
    text: palette.text,
    border: palette.border,
    primary: '#a78bfa',
  },
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.bg }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navTheme}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: palette.bg },
              headerStyle: { backgroundColor: palette.bgElevated },
              headerTintColor: palette.text,
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="hall"
              options={{ presentation: 'modal', title: 'Hall of Power' }}
            />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen
              name="dojo/new-workout"
              options={{ presentation: 'modal', title: 'New Workout' }}
            />
            <Stack.Screen name="dojo/[id]" options={{ title: 'Workout' }} />
            <Stack.Screen
              name="forge/new-project"
              options={{ presentation: 'modal', title: 'New Project' }}
            />
            <Stack.Screen name="forge/[id]" options={{ title: 'Project' }} />
          </Stack>
          <XPPopupHost />
          <StatusBar style="light" />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
