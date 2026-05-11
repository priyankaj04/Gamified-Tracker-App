import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import { palette, screenTheme } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { DatePicker, todayISO } from '@/components/ui/DatePicker';
import { API_BASE_URL } from '@/constants';
import {
  useBulkDeleteWorkouts,
  useImportWorkouts,
  type ImportResult,
} from '@/hooks/useWorkouts';

const fourteenAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return d.toISOString().split('T')[0];
};

export default function DojoData() {
  const accent = screenTheme.dojo.accent;
  const bulkDel = useBulkDeleteWorkouts();
  const importMut = useImportWorkouts();
  const [busy, setBusy] = useState<'csv' | 'json' | 'import' | null>(null);
  const [from, setFrom] = useState(fourteenAgo());
  const [to, setTo] = useState(todayISO());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const downloadAndShare = async (kind: 'csv' | 'json') => {
    setBusy(kind);
    try {
      const url = `${API_BASE_URL}/export/workouts.${kind}`;
      const filename = `kaizenarc-workouts-${todayISO()}.${kind}`;
      const target = `${FileSystem.cacheDirectory}${filename}`;
      const res = await FileSystem.downloadAsync(url, target);
      if (res.status !== 200) throw new Error(`Download failed (${res.status})`);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri, {
          mimeType: kind === 'csv' ? 'text/csv' : 'application/json',
          dialogTitle: 'Export workouts',
          UTI: kind === 'csv' ? 'public.comma-separated-values-text' : 'public.json',
        });
      } else {
        Alert.alert('Saved', `File at ${res.uri}`);
      }
    } catch (e: any) {
      Alert.alert('Export failed', e.message ?? 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    setBusy('import');
    setImportResult(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled) {
        setBusy(null);
        return;
      }
      const file = picked.assets?.[0];
      if (!file) {
        setBusy(null);
        return;
      }
      const csv = await FileSystem.readAsStringAsync(file.uri);
      const res = await importMut.mutateAsync(csv);
      setImportResult(res);
    } catch (e: any) {
      Alert.alert('Import failed', e?.message ?? 'Unknown error');
    } finally {
      setBusy(null);
    }
  };

  const handleBulkDelete = () => {
    Alert.alert(
      'Delete workouts in range?',
      `${from} → ${to}\n\nThis can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await bulkDel.mutateAsync({ from, to });
              Alert.alert('Deleted', `${res.deleted} workout(s) removed.`);
            } catch (e: any) {
              Alert.alert('Failed', e.message ?? 'Unknown error');
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: palette.bg }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Text style={styles.section}>Export</Text>
      <View style={styles.card}>
        <Text style={styles.helper}>
          Download your full workout history. CSV is one row per set; JSON keeps full structure.
        </Text>
        <Pressable
          onPress={() => downloadAndShare('csv')}
          disabled={!!busy}
          style={[styles.btn, { borderColor: accent }]}>
          {busy === 'csv' ? (
            <ActivityIndicator color={accent} />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={18} color={accent} />
              <Text style={[styles.btnText, { color: accent }]}>Export CSV</Text>
            </>
          )}
        </Pressable>
        <Pressable
          onPress={() => downloadAndShare('json')}
          disabled={!!busy}
          style={[styles.btn, { borderColor: accent }]}>
          {busy === 'json' ? (
            <ActivityIndicator color={accent} />
          ) : (
            <>
              <Ionicons name="code-slash-outline" size={18} color={accent} />
              <Text style={[styles.btnText, { color: accent }]}>Export JSON</Text>
            </>
          )}
        </Pressable>
      </View>

      <Text style={styles.section}>Import</Text>
      <View style={styles.card}>
        <Text style={styles.helper}>
          Restore from a previously exported CSV. Header must include date, workout_name,
          type, exercise, set_index, set_type, reps, weight_kg.
        </Text>
        <Pressable
          onPress={handleImport}
          disabled={!!busy}
          style={[styles.btn, { borderColor: accent }]}>
          {busy === 'import' ? (
            <ActivityIndicator color={accent} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={18} color={accent} />
              <Text style={[styles.btnText, { color: accent }]}>Import CSV</Text>
            </>
          )}
        </Pressable>
        {importResult && (
          <View style={{ marginTop: 4 }}>
            <Text style={{ color: palette.text, fontWeight: '800', fontSize: 13 }}>
              Imported {importResult.imported} · skipped {importResult.skipped}
            </Text>
            {importResult.errors.slice(0, 5).map((e, i) => (
              <Text key={i} style={{ color: palette.danger, fontSize: 11, marginTop: 2 }}>
                Row {e.row}: {e.reason}
              </Text>
            ))}
            {importResult.errors.length > 5 && (
              <Text style={{ color: palette.textMuted, fontSize: 11, marginTop: 2 }}>
                …and {importResult.errors.length - 5} more
              </Text>
            )}
          </View>
        )}
      </View>

      <Text style={styles.section}>Bulk delete</Text>
      <View style={styles.card}>
        <Text style={styles.helper}>Delete every workout logged between two dates. Permanent.</Text>
        <Text style={styles.label}>From</Text>
        <DatePicker value={from} onChange={setFrom} accent={accent} days={60} />
        <Text style={styles.label}>To</Text>
        <DatePicker value={to} onChange={setTo} accent={accent} days={60} />
        <View style={{ height: 6 }} />
        <GlowButton
          title={`Delete ${from} → ${to}`}
          color={palette.danger}
          onPress={handleBulkDelete}
          loading={bulkDel.isPending}
        />
      </View>
    </ScrollView>
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
    gap: 10,
  },
  helper: { color: palette.textMuted, fontSize: 12, lineHeight: 18 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  btnText: { fontWeight: '800', fontSize: 14 },
  label: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
