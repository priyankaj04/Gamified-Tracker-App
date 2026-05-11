import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { palette, screenTheme } from '@/lib/themes';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcon =
  (name: IoniconName) =>
  ({ color, size }: { color: string; size: number }) =>
    <Ionicons name={name} size={size} color={color} />;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: screenTheme.dashboard.accent,
        tabBarInactiveTintColor: palette.textDim,
        tabBarStyle: {
          backgroundColor: palette.bgElevated,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('flash') }}
      />
      <Tabs.Screen
        name="dojo"
        options={{ title: 'Dojo', tabBarIcon: tabIcon('flame') }}
      />
      <Tabs.Screen
        name="forge"
        options={{ title: 'Forge', tabBarIcon: tabIcon('code-slash') }}
      />
      <Tabs.Screen
        name="spirit"
        options={{ title: 'Spirit', tabBarIcon: tabIcon('pulse') }}
      />
      <Tabs.Screen
        name="vault"
        options={{ title: 'Vault', tabBarIcon: tabIcon('wallet') }}
      />
      <Tabs.Screen
        name="quests"
        options={{ title: 'Quests', tabBarIcon: tabIcon('list') }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
