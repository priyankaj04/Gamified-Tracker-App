import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { palette, screenTheme } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { DatePicker, todayISO } from '@/components/ui/DatePicker';
import { StarRating } from '@/components/gamification/StarRating';
import { useLogCardio } from '@/hooks/useCardio';
import { useSettings } from '@/hooks/useSettings';

const HR_ZONE_HINTS: Record<number, string> = {
  1: 'Z1 · easy · 50–60% HR',
  2: 'Z2 · aerobic · 60–70% HR',
  3: 'Z3 · tempo · 70–80% HR',
  4: 'Z4 · threshold · 80–90% HR',
  5: 'Z5 · max · 90%+ HR',
};

const ACTIVITIES = [
  'Run',
  'Cycle',
  'Swim',
  'Row',
  'HIIT',
  'Badminton',
  'Dance',
  'Jump Rope',
  'Other',
];

const HR_ZONES = [1, 2, 3, 4, 5];

export default function NewCardio() {
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const log = useLogCardio();
  const settings = useSettings();
  const distUnit = settings.data?.distanceUnit ?? 'km';

  const [activity, setActivity] = useState('Run');
  const [date, setDate] = useState(todayISO());
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [hrZone, setHrZone] = useState<number | null>(null);
  const [stars, setStars] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setError(null);
    const mins = parseInt(duration, 10);
    if (!mins) {
      setError('Duration is required.');
      return;
    }
    try {
      // Convert miles → km if user prefers miles.
      const distKm = distance
        ? distUnit === 'mi'
          ? parseFloat(distance) * 1.609344
          : parseFloat(distance)
        : undefined;
      await log.mutateAsync({
        activityType: activity,
        date,
        durationMinutes: mins,
        distanceKm: distKm,
        hrZone: hrZone ?? undefined,
        stars: stars ?? undefined,
        notes: notes || undefined,
      });
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Could not save cardio');
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.label}>Activity</Text>
      <View style={styles.activityGrid}>
        {ACTIVITIES.map((a) => {
          const active = activity === a;
          return (
            <Pressable
              key={a}
              onPress={() => setActivity(a)}
              style={[styles.activityBtn, active && { backgroundColor: accent + '22', borderColor: accent }]}>
              <Text style={[styles.activityText, active && { color: accent }]}>{a}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Date</Text>
      <DatePicker value={date} onChange={setDate} accent={accent} />

      <Text style={styles.label}>Duration (min)</Text>
      <TextInput
        value={duration}
        onChangeText={setDuration}
        keyboardType="numeric"
        style={styles.input}
        placeholder="30"
        placeholderTextColor={palette.textDim}
      />

      <Text style={styles.label}>Distance ({distUnit})</Text>
      <TextInput
        value={distance}
        onChangeText={setDistance}
        keyboardType="decimal-pad"
        style={styles.input}
        placeholder={distUnit === 'mi' ? 'e.g. 3.1' : 'e.g. 5.0'}
        placeholderTextColor={palette.textDim}
      />

      <Text style={styles.label}>Heart-rate Zone</Text>
      <View style={styles.zoneRow}>
        {HR_ZONES.map((z) => {
          const active = hrZone === z;
          return (
            <Pressable
              key={z}
              onPress={() => setHrZone(active ? null : z)}
              style={[styles.zoneBtn, active && { backgroundColor: accent + '22', borderColor: accent }]}>
              <Text style={[styles.zoneText, active && { color: accent }]}>Z{z}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.zoneHint}>
        {hrZone ? HR_ZONE_HINTS[hrZone] : 'Z1 easy · Z2 aerobic · Z3 tempo · Z4 threshold · Z5 max'}
      </Text>

      <Text style={styles.label}>How did it feel?</Text>
      <StarRating value={stars} onChange={setStars} />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        multiline
        placeholderTextColor={palette.textDim}
      />

      <View style={{ height: 12 }} />
      {error && <Text style={styles.error}>{error}</Text>}
      <GlowButton title="Save" color={accent} loading={log.isPending} onPress={onSave} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  activityBtn: {
    flexGrow: 1,
    minWidth: '30%',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  activityText: { color: palette.textMuted, fontWeight: '800', fontSize: 12 },
  zoneRow: { flexDirection: 'row', gap: 6 },
  zoneBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
  },
  zoneText: { color: palette.textMuted, fontWeight: '900', fontSize: 13 },
  zoneHint: { color: palette.textDim, fontSize: 11, fontStyle: 'italic', marginTop: 4 },
  error: { color: palette.danger, fontSize: 13, fontWeight: '700', marginBottom: 6 },
});
