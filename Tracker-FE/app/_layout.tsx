import React, { useEffect } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { queryClient } from '@/lib/queryClient';
import { palette } from '@/lib/themes';
import { XPPopupHost } from '@/components/gamification/XPPopup';
import { BadgeUnlockHost } from '@/components/gamification/BadgeUnlock';
import { LevelUpHost } from '@/components/gamification/LevelUp';
import { ConfettiHost } from '@/components/spirit/ConfettiHost';
import { setupChannels } from '@/lib/notifications';

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
  useEffect(() => {
    setupChannels().catch(() => {});
  }, []);

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
            <Stack.Screen
              name="dojo/active-workout"
              options={{ title: 'Active Workout' }}
            />
            <Stack.Screen name="dojo/[id]" options={{ title: 'Workout' }} />
            <Stack.Screen
              name="dojo/edit-workout/[id]"
              options={{ presentation: 'modal', title: 'Edit Workout' }}
            />
            <Stack.Screen
              name="forge/new-project"
              options={{ presentation: 'modal', title: 'New Project' }}
            />
            <Stack.Screen name="forge/[id]" options={{ title: 'Project' }} />
            <Stack.Screen name="dojo/templates/index" options={{ title: 'Templates' }} />
            <Stack.Screen
              name="dojo/templates/new"
              options={{ presentation: 'modal', title: 'New Template' }}
            />
            <Stack.Screen name="dojo/templates/[id]" options={{ title: 'Template' }} />
            <Stack.Screen name="dojo/routines/index" options={{ title: 'Routines' }} />
            <Stack.Screen
              name="dojo/routines/new"
              options={{ presentation: 'modal', title: 'New Routine' }}
            />
            <Stack.Screen name="dojo/routines/[id]" options={{ title: 'Routine' }} />
            <Stack.Screen name="dojo/records" options={{ title: 'Personal Records' }} />
            <Stack.Screen name="dojo/records/[exerciseId]" options={{ title: 'Progression' }} />
            <Stack.Screen name="dojo/cardio/index" options={{ title: 'Cardio' }} />
            <Stack.Screen
              name="dojo/cardio/new"
              options={{ presentation: 'modal', title: 'Log Cardio' }}
            />
            <Stack.Screen name="dojo/stats" options={{ title: 'Stats' }} />
            <Stack.Screen name="dojo/settings" options={{ title: 'Workout Settings' }} />
            <Stack.Screen name="dojo/data" options={{ title: 'Data' }} />
            <Stack.Screen name="dojo/exercise-library" options={{ title: 'Exercise Library' }} />
            <Stack.Screen name="spirit/weight-log" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/measurements" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/measurement-compare" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/composition" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/nutrition" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/nutrition-log" options={{ presentation: 'modal', title: 'Log Meal' }} />
            <Stack.Screen name="spirit/food-database" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/sleep" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/habits" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/habit-detail" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/fasting" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/cycle" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/goals" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/goal-detail" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/energy-mood" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/wellness-score" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/tdee" options={{ headerShown: false }} />
            <Stack.Screen name="spirit/profile" options={{ headerShown: false }} />
          </Stack>
          <XPPopupHost />
          <BadgeUnlockHost />
          <LevelUpHost />
          <ConfettiHost />
          <StatusBar style="light" />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
