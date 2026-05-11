import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme } from '@/lib/themes';
import { EmptyState } from '@/components/layout/EmptyState';
import { FilterChip } from '@/components/ui/FilterChip';
import { GlowButton } from '@/components/ui/GlowButton';
import { usePersonalRecords, type PersonalRecordRich } from '@/hooks/useWorkouts';
import { useExerciseMeta } from '@/hooks/useExercises';
import { useSettings, toDisplayWeight } from '@/hooks/useSettings';

export default function RecordsScreen() {
  const router = useRouter();
  const accent = screenTheme.dojo.accent;
  const { data, isFetching, refetch } = usePersonalRecords();
  const meta = useExerciseMeta();
  const settings = useSettings();

  const [muscle, setMuscle] = useState<string | undefined>();
  const [equipment, setEquipment] = useState<string | undefined>();

  const unit = settings.data?.weightUnit ?? 'kg';
  const fmt = (kg: number | null) => {
    const v = toDisplayWeight(kg, unit);
    return v != null ? `${v.toFixed(1)} ${unit}` : '—';
  };

  const records = data?.records ?? [];
  const filtered = useMemo(
    () =>
      records.filter((r) => {
        if (muscle && r.musclePrimary !== muscle) return false;
        if (equipment && r.equipment !== equipment) return false;
        return true;
      }),
    [records, muscle, equipment],
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={<RefreshControl tintColor={accent} refreshing={isFetching} onRefresh={refetch} />}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          <FilterChip
            label={muscle ?? 'Muscle'}
            active={!!muscle}
            color={accent}
            options={meta.data?.muscleGroups}
            value={muscle}
            onPick={setMuscle}
            pickerTitle="Muscle group"
          />
          <FilterChip
            label={equipment ?? 'Equipment'}
            active={!!equipment}
            color={accent}
            options={meta.data?.equipmentTypes}
            value={equipment}
            onPick={setEquipment}
            pickerTitle="Equipment"
          />
          {(muscle || equipment) && (
            <Pressable
              onPress={() => {
                setMuscle(undefined);
                setEquipment(undefined);
              }}
              style={[styles.chip, { borderColor: accent }]}>
              <Text style={[styles.chipText, { color: accent }]}>Clear</Text>
            </Pressable>
          )}
        </ScrollView>

        {filtered.length === 0 ? (
          records.length === 0 ? (
            <EmptyState
              icon="trophy"
              title="No PRs yet"
              message="Smash a new weight on any lift to set your first PR."
              accent={accent}
            />
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 28, gap: 10 }}>
              <EmptyState
                icon="trophy"
                title="No PRs match filter"
                message={`${records.length} PR${records.length === 1 ? '' : 's'} total · 0 match this filter.`}
                accent={accent}
              />
              <View style={{ width: 200 }}>
                <GlowButton
                  title="Clear filters"
                  color={accent}
                  variant="ghost"
                  onPress={() => {
                    setMuscle(undefined);
                    setEquipment(undefined);
                  }}
                />
              </View>
            </View>
          )
        ) : (
          <View style={{ gap: 8 }}>
            {filtered.map((r) => (
              <PRRow key={r.id} record={r} onPress={() => router.push({ pathname: '/dojo/records/[exerciseId]', params: { exerciseId: r.exerciseId ?? '', name: r.exerciseName } } as any)} fmt={fmt} accent={accent} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function PRRow({
  record,
  onPress,
  fmt,
  accent,
}: {
  record: PersonalRecordRich;
  onPress: () => void;
  fmt: (kg: number | null) => string;
  accent: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={[styles.icon, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
        <Ionicons name="trophy" size={16} color={accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.exName} numberOfLines={1}>
          {record.exerciseName}
        </Text>
        <View style={styles.meta}>
          {record.musclePrimary && (
            <Text style={styles.tag}>{record.musclePrimary}</Text>
          )}
          {record.equipment && <Text style={styles.tag}>{record.equipment}</Text>}
          <Text style={styles.date}>{new Date(record.achievedAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.bestWeight, { color: accent }]}>
          {fmt(record.bestWeightKg)} × {record.bestReps ?? '—'}
        </Text>
        {record.bestEstOneRmKg != null && (
          <Text style={styles.subBest}>
            ~1RM {fmt(record.bestEstOneRmKg)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: { gap: 6, paddingBottom: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    marginRight: 6,
  },
  chipText: { color: palette.textMuted, fontWeight: '700', fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  icon: {
    width: 32, height: 32, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  exName: { color: palette.text, fontWeight: '800', fontSize: 14 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4, alignItems: 'center' },
  tag: { color: palette.textMuted, fontSize: 10, fontWeight: '700' },
  date: { color: palette.textDim, fontSize: 10 },
  bestWeight: { fontSize: 14, fontWeight: '900', letterSpacing: -0.3 },
  subBest: { color: palette.textMuted, fontSize: 11, marginTop: 2, fontWeight: '700' },
});
