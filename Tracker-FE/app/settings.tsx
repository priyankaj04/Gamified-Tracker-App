import React from 'react';
import { ScrollView, View, Text, StyleSheet, Switch } from 'react-native';
import { palette } from '@/lib/themes';
import { API_BASE_URL, APP_NAME } from '@/constants';
import { useAppStore } from '@/store/useAppStore';

export default function SettingsScreen() {
  const haptics = useAppStore((s) => s.hapticsEnabled);
  const setHaptics = useAppStore((s) => s.setHapticsEnabled);
  const bgm = useAppStore((s) => s.bgmEnabled);
  const setBgm = useAppStore((s) => s.setBgmEnabled);
  const bgmVolume = useAppStore((s) => s.bgmVolume);
  const setVolume = useAppStore((s) => s.setBgmVolume);

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
        <View style={styles.row}>
          <Text style={styles.label}>Background Music</Text>
          <Switch value={bgm} onValueChange={setBgm} />
        </View>
        {bgm && (
          <View style={{ gap: 8 }}>
            <View style={styles.row}>
              <Text style={styles.label}>Volume</Text>
              <Text style={styles.value}>{Math.round(bgmVolume * 100)}%</Text>
            </View>
            <View style={styles.volumeRow}>
              {[0.05, 0.1, 0.2, 0.3, 0.5, 0.75].map((v) => {
                const active = Math.abs(bgmVolume - v) < 0.01;
                return (
                  <Text
                    key={v}
                    onPress={() => setVolume(v)}
                    style={[styles.volumeChip, active && styles.volumeChipActive]}>
                    {Math.round(v * 100)}
                  </Text>
                );
              })}
            </View>
          </View>
        )}
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
  volumeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  volumeChip: {
    color: palette.textMuted,
    backgroundColor: palette.bgElevated,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  volumeChipActive: {
    color: '#fff',
    backgroundColor: '#a78bfa',
    borderColor: '#a78bfa',
  },
});
