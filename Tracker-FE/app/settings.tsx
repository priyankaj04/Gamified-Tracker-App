import React from 'react';
import { ScrollView, View, Text, StyleSheet, Switch } from 'react-native';
import { palette } from '@/lib/themes';
import { API_BASE_URL, APP_NAME } from '@/constants';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsScreen() {
  const haptics = useAppStore((s) => s.hapticsEnabled);
  const setHaptics = useAppStore((s) => s.setHapticsEnabled);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text style={styles.section}>App</Text>
      <View style={styles.card}>
        <Row label="Name" value={APP_NAME} />
        <Row label="API" value={API_BASE_URL} />
      </View>

      <Text style={styles.section}>Preferences</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Haptics</Text>
          <Switch value={haptics} onValueChange={setHaptics} />
        </View>
      </View>

      <Text style={styles.section}>About</Text>
      <View style={styles.card}>
        <Text style={styles.about}>
          KaizenArc — anime-styled goal tracker. Show up every day, level up.
        </Text>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { color: palette.text, fontWeight: '700', fontSize: 14 },
  value: { color: palette.textMuted, fontSize: 13, flexShrink: 1, textAlign: 'right' },
  about: { color: palette.textMuted, lineHeight: 20, fontSize: 13 },
});
