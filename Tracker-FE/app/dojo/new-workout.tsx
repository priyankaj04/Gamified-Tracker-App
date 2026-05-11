import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { WorkoutForm } from '@/components/workout/WorkoutForm';

export default function NewWorkout() {
  const params = useLocalSearchParams<{ templateId?: string; duplicateFromId?: string }>();
  return (
    <WorkoutForm
      mode="new"
      templateId={params.templateId}
      sourceWorkoutId={params.duplicateFromId}
    />
  );
}
