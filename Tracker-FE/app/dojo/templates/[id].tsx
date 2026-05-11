import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { palette } from '@/lib/themes';
import { TemplateEditor } from '@/components/workout/TemplateEditor';
import { useTemplate } from '@/hooks/useTemplates';

export default function TemplateDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useTemplate(id);

  if (isLoading || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: palette.textMuted }}>Loading…</Text>
      </View>
    );
  }
  return <TemplateEditor initial={data} />;
}
