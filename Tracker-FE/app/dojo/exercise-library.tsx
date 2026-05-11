import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { palette, screenTheme } from '@/lib/themes';
import { GlowButton } from '@/components/ui/GlowButton';
import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  useExercises,
  useExerciseMeta,
  useUpdateExercise,
  useCreateExercise,
  useDeleteExercise,
} from '@/hooks/useExercises';
import type { Exercise, ExerciseType } from '@/types';

const TYPES: ExerciseType[] = ['compound', 'isolation', 'cardio'];

const equipmentIcon = (equipment: string): keyof typeof Ionicons.glyphMap => {
  const e = equipment.toLowerCase();
  if (e.includes('barbell')) return 'barbell';
  if (e.includes('dumbbell')) return 'fitness';
  if (e.includes('machine')) return 'cog';
  if (e.includes('cable')) return 'link';
  if (e.includes('bodyweight')) return 'body';
  if (e.includes('band')) return 'pulse';
  if (e.includes('kettlebell')) return 'water';
  if (e.includes('cardio')) return 'bicycle';
  return 'flash';
};

export default function ExerciseLibrary() {
  const accent = screenTheme.dojo.accent;
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [favOnly, setFavOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const meta = useExerciseMeta();
  const list = useExercises({
    search: search || undefined,
    muscle: muscle ?? undefined,
    equipment: equipment ?? undefined,
    favorite: favOnly || undefined,
  });
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  const muscles = meta.data?.muscleGroups ?? [];
  const equipmentList = meta.data?.equipmentTypes ?? [];

  const toggleFavorite = (ex: Exercise) => {
    Haptics.selectionAsync();
    updateMutation.mutate({ id: ex.id, body: { isFavorite: !ex.isFavorite } });
  };

  const onDelete = (ex: Exercise) => {
    if (!ex.isCustom) {
      Alert.alert('Built-in exercise', 'Only custom exercises can be deleted.');
      return;
    }
    Alert.alert('Delete exercise?', `Remove "${ex.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(ex.id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 10 }}>
        {/* Search */}
        <View style={[styles.searchWrap, { borderColor: palette.border }]}>
          <Ionicons name="search" size={18} color={palette.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises…"
            placeholderTextColor={palette.textDim}
            style={styles.search}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={palette.textDim} />
            </Pressable>
          )}
        </View>

        {/* Muscle filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <FilterChip label="All" active={muscle == null} onPress={() => setMuscle(null)} accent={accent} />
          {muscles.map((m) => (
            <FilterChip
              key={m}
              label={m}
              active={muscle === m}
              onPress={() => setMuscle(muscle === m ? null : m)}
              accent={accent}
            />
          ))}
        </ScrollView>

        {/* Equipment + Fav */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <FilterChip
            label={favOnly ? '★ Favorites' : '☆ Favorites'}
            active={favOnly}
            onPress={() => setFavOnly((v) => !v)}
            accent="#fbbf24"
          />
          {equipmentList.map((e) => (
            <FilterChip
              key={e}
              label={e}
              active={equipment === e}
              onPress={() => setEquipment(equipment === e ? null : e)}
              accent={accent}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 100 }}
        data={list.data?.exercises ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { borderColor: palette.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
              <Ionicons name={equipmentIcon(item.equipment)} size={20} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name} {item.isCustom && <Text style={styles.custom}>· custom</Text>}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {item.musclePrimary} · {item.equipment} · {item.exerciseType}
              </Text>
            </View>
            <Pressable onPress={() => toggleFavorite(item)} hitSlop={6} style={styles.iconBtn}>
              <Ionicons
                name={item.isFavorite ? 'star' : 'star-outline'}
                size={20}
                color={item.isFavorite ? '#fbbf24' : palette.textMuted}
              />
            </Pressable>
            {item.isCustom && (
              <Pressable onPress={() => onDelete(item)} hitSlop={6} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={18} color={palette.textDim} />
              </Pressable>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ color: palette.textMuted }}>
              {list.isFetching ? 'Loading…' : 'No exercises match these filters.'}
            </Text>
          </View>
        }
      />

      <Pressable
        onPress={() => setCreateOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: accent, shadowColor: accent },
          pressed && { opacity: 0.85 },
        ]}>
        <Ionicons name="add" size={26} color="#0b0b14" />
      </Pressable>

      <CreateExerciseSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        muscles={muscles}
        equipmentList={equipmentList}
      />
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  accent,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  accent: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? accent : palette.border, backgroundColor: active ? accent + '22' : palette.card },
      ]}>
      <Text style={[styles.chipText, { color: active ? accent : palette.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function CreateExerciseSheet({
  visible,
  onClose,
  muscles,
  equipmentList,
}: {
  visible: boolean;
  onClose: () => void;
  muscles: string[];
  equipmentList: string[];
}) {
  const accent = screenTheme.dojo.accent;
  const create = useCreateExercise();
  const [name, setName] = useState('');
  const [musclePrimary, setMusclePrimary] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [type, setType] = useState<ExerciseType>('compound');

  const onSave = async () => {
    if (!name.trim() || !musclePrimary || !equipment) {
      Alert.alert('Missing fields', 'Name, muscle group, and equipment are required.');
      return;
    }
    try {
      await create.mutateAsync({
        name: name.trim(),
        musclePrimary,
        equipment,
        exerciseType: type,
      });
      setName('');
      setMusclePrimary(null);
      setEquipment(null);
      setType('compound');
      onClose();
    } catch (e: any) {
      Alert.alert('Failed', e?.message ?? 'Could not create exercise');
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Add Custom Exercise">
      <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Pendlay Row (3-second pause)"
          placeholderTextColor={palette.textDim}
          style={styles.input}
        />

        <Text style={styles.label}>Primary Muscle</Text>
        <View style={styles.wrapRow}>
          {muscles.map((m) => (
            <Pressable
              key={m}
              onPress={() => setMusclePrimary(m)}
              style={[
                styles.smChip,
                musclePrimary === m && { backgroundColor: accent + '22', borderColor: accent },
              ]}>
              <Text style={[styles.smChipText, musclePrimary === m && { color: accent }]}>{m}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Equipment</Text>
        <View style={styles.wrapRow}>
          {equipmentList.map((e) => (
            <Pressable
              key={e}
              onPress={() => setEquipment(e)}
              style={[
                styles.smChip,
                equipment === e && { backgroundColor: accent + '22', borderColor: accent },
              ]}>
              <Text style={[styles.smChipText, equipment === e && { color: accent }]}>{e}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Type</Text>
        <View style={styles.wrapRow}>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[
                styles.smChip,
                type === t && { backgroundColor: accent + '22', borderColor: accent },
              ]}>
              <Text style={[styles.smChipText, type === t && { color: accent }]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 18 }} />
        <GlowButton title="Create" color={accent} loading={create.isPending} onPress={onSave} />
        <View style={{ height: 24 }} />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  search: { flex: 1, color: palette.text, fontSize: 14 },
  chipRow: { flexDirection: 'row', gap: 6, paddingRight: 16 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '800' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  name: { color: palette.text, fontSize: 14, fontWeight: '700' },
  custom: { color: palette.textDim, fontSize: 11, fontWeight: '500' },
  meta: { color: palette.textMuted, fontSize: 11, marginTop: 2 },
  iconBtn: { padding: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  label: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
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
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  smChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  smChipText: { color: palette.textMuted, fontSize: 12, fontWeight: '700' },
});
