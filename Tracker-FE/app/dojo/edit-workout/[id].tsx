import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { WorkoutForm } from '@/components/workout/WorkoutForm';

export default function EditWorkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WorkoutForm mode="edit" sourceWorkoutId={id} />;
}
