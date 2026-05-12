import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';
import type { DeployEnvironment, Deployment } from '@/types';

const envColor: Record<DeployEnvironment, string> = {
  development: '#60a5fa',
  staging: '#fbbf24',
  production: '#4ade80',
};

interface Props {
  deployment: Deployment;
  onPress?: () => void;
}

export function DeploymentRow({ deployment: d, onPress }: Props) {
  const color = envColor[d.environment];
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}>
      <View style={[styles.envPill, { backgroundColor: color + '22', borderColor: color }]}>
        <Text style={[styles.envText, { color }]}>{d.environment}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.version}>{d.version ?? 'untagged'}</Text>
        {d.releaseNotes && (
          <Text style={styles.notes} numberOfLines={1}>
            {d.releaseNotes}
          </Text>
        )}
        <Text style={styles.date}>{new Date(d.deployedAt).toLocaleString()}</Text>
      </View>
      {d.deployUrl && (
        <Pressable onPress={() => Linking.openURL(d.deployUrl!)} hitSlop={8}>
          <Ionicons name="open-outline" size={16} color={palette.textMuted} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    marginBottom: 8,
  },
  envPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  envText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  version: { color: palette.text, fontWeight: '800', fontSize: 13 },
  notes: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
  date: { color: palette.textDim, fontSize: 11, marginTop: 2 },
});
