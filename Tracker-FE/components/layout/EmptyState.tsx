import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  accent?: string;
}

export function EmptyState({ icon = 'sparkles', title, message, accent = '#a78bfa' }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
        <Ionicons name={icon} size={36} color={accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30, gap: 10 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { color: palette.text, fontWeight: '800', fontSize: 18 },
  message: { color: palette.textMuted, textAlign: 'center', fontSize: 13, lineHeight: 19 },
});
