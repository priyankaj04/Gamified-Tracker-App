import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { palette } from '@/lib/themes';
import { RoutineEditor } from '@/components/workout/RoutineEditor';
import { useRoutine } from '@/hooks/useRoutines';

export default function RoutineDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useRoutine(id);
  if (isLoading || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: palette.textMuted }}>Loading…</Text>
      </View>
    );
  }
  return <RoutineEditor initial={data} />;
}
