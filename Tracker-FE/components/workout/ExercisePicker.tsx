import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { glass, palette, screenTheme } from '@/lib/themes';
import { useExercises, useExerciseMeta, useUpdateExercise } from '@/hooks/useExercises';
import { useGameState } from '@/hooks/useGame';
import type { Exercise } from '@/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercises: Exercise[]) => void;
  mode?: 'multi' | 'single';
  accent?: string;
}

export function ExercisePicker({
  visible,
  onClose,
  onSelect,
  mode = 'multi',
  accent = screenTheme.dojo.accent,
}: Props) {
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState<string | undefined>();
  const [equipment, setEquipment] = useState<string | undefined>();
  const [favOnly, setFavOnly] = useState(false);
  const [selected, setSelected] = useState<Record<string, Exercise>>({});

  const meta = useExerciseMeta();
  const exQuery = useExercises({
    search: search || undefined,
    muscle,
    equipment,
    favorite: favOnly ? true : undefined,
  });
  const updateExercise = useUpdateExercise();
  const game = useGameState();
  const dojoStreak = game.data?.streaks?.dojo?.count ?? 0;
  const longest = game.data?.streaks?.dojo?.longestStreak ?? 0;

  const exercises = exQuery.data?.exercises ?? [];

  const reset = () => {
    setSearch('');
    setMuscle(undefined);
    setEquipment(undefined);
    setFavOnly(false);
    setSelected({});
  };

  const handleAdd = () => {
    const list = Object.values(selected);
    if (list.length === 0) return;
    onSelect(list);
    reset();
    onClose();
  };

  const toggle = (ex: Exercise) => {
    if (mode === 'single') {
      onSelect([ex]);
      reset();
      onClose();
      return;
    }
    setSelected((s) => {
      const next = { ...s };
      if (next[ex.id]) delete next[ex.id];
      else next[ex.id] = ex;
      return next;
    });
  };

  const toggleFavorite = (ex: Exercise) => {
    updateExercise.mutate({ id: ex.id, body: { isFavorite: !ex.isFavorite } });
  };

  const selectedCount = Object.keys(selected).length;

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={[styles.headerBtn, { color: palette.textMuted }]}>Cancel</Text>
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>Add exercises</Text>
            <View style={[styles.streakPill, { borderColor: '#f97316', backgroundColor: '#f9731622' }]}>
              <Ionicons name="flame" size={12} color="#f97316" />
              <Text style={styles.streakText}>
                {dojoStreak}
                {longest > dojoStreak ? ` · best ${longest}` : ''}
              </Text>
            </View>
          </View>
          {mode === 'multi' ? (
            <Pressable onPress={handleAdd} disabled={selectedCount === 0} hitSlop={8}>
              <Text style={[styles.headerBtn, { color: selectedCount > 0 ? accent : palette.textDim }]}>
                Add{selectedCount > 0 ? ` (${selectedCount})` : ''}
              </Text>
            </Pressable>
          ) : (
            <View style={{ width: 60 }} />
          )}
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={palette.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises…"
            placeholderTextColor={palette.textDim}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {!!search && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={palette.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          <Chip
            label={favOnly ? '★ Favorites' : '☆ Favorites'}
            active={favOnly}
            color={accent}
            onPress={() => setFavOnly((v) => !v)}
          />
          <Chip
            label={muscle ?? 'Muscle'}
            active={!!muscle}
            color={accent}
            options={meta.data?.muscleGroups}
            value={muscle}
            onPick={setMuscle}
            pickerTitle="Muscle group"
          />
          <Chip
            label={equipment ?? 'Equipment'}
            active={!!equipment}
            color={accent}
            options={meta.data?.equipmentTypes}
            value={equipment}
            onPick={setEquipment}
            pickerTitle="Equipment"
          />
          {(muscle || equipment || favOnly) && (
            <Pressable onPress={reset} style={[styles.clearChip, { borderColor: accent }]}>
              <Text style={[styles.chipText, { color: accent }]}>Clear</Text>
            </Pressable>
          )}
        </ScrollView>

        {exQuery.isLoading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={accent} />
          </View>
        ) : exercises.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: palette.textMuted }}>No matches.</Text>
          </View>
        ) : (
          <FlatList
            data={exercises}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const checked = !!selected[item.id];
              return (
                <Pressable
                  onPress={() => toggle(item)}
                  style={({ pressed }) => [
                    styles.row,
                    checked && { backgroundColor: accent + '18', borderColor: accent },
                    pressed && { opacity: 0.7 },
                  ]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.tag, { borderColor: accent + '66' }]}>
                        <Text style={[styles.tagText, { color: accent }]}>{item.musclePrimary}</Text>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagDim}>{item.equipment}</Text>
                      </View>
                      <View style={styles.tag}>
                        <Text style={styles.tagDim}>{item.exerciseType}</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable onPress={() => toggleFavorite(item)} hitSlop={6} style={{ paddingHorizontal: 6 }}>
                    <Ionicons
                      name={item.isFavorite ? 'star' : 'star-outline'}
                      size={20}
                      color={item.isFavorite ? '#fbbf24' : palette.textDim}
                    />
                  </Pressable>
                  {mode === 'multi' && (
                    <Ionicons
                      name={checked ? 'checkmark-circle' : 'add-circle-outline'}
                      size={26}
                      color={checked ? accent : palette.textDim}
                    />
                  )}
                </Pressable>
              );
            }}
            contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

interface ChipProps {
  label: string;
  active: boolean;
  color: string;
  onPress?: () => void;
  options?: string[];
  value?: string;
  onPick?: (v: string | undefined) => void;
  pickerTitle?: string;
}

function Chip({ label, active, color, onPress, options, value, onPick, pickerTitle }: ChipProps) {
  const [open, setOpen] = useState(false);
  const hasMenu = !!options && !!onPick;
  return (
    <>
      <Pressable
        onPress={hasMenu ? () => setOpen(true) : onPress}
        style={[styles.chip, active && { borderColor: color, backgroundColor: color + '33' }]}>
        <Text style={[styles.chipText, active && { color }]} numberOfLines={1}>
          {label}
        </Text>
        {hasMenu && (
          <Ionicons
            name="chevron-down"
            size={14}
            color={active ? color : palette.textMuted}
          />
        )}
      </Pressable>
      {hasMenu && (
        <BottomSheet visible={open} onClose={() => setOpen(false)} title={pickerTitle ?? 'Select'}>
          <ScrollView style={{ maxHeight: 420 }}>
            {[undefined, ...options!].map((opt, idx) => {
              const selected = value === opt;
              const txt = opt ?? 'All';
              return (
                <Pressable
                  key={idx}
                  onPress={() => {
                    onPick!(opt);
                    setOpen(false);
                  }}
                  style={[styles.menuRow, selected && { backgroundColor: color + '22' }]}>
                  <Text style={[styles.menuText, selected && { color }]}>{txt}</Text>
                  {selected && <Ionicons name="checkmark" size={18} color={color} />}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ height: 12 }} />
        </BottomSheet>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bgElevated },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  title: { color: palette.text, fontWeight: '800', fontSize: 16 },
  titleWrap: { alignItems: 'center', gap: 4 },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  streakText: { color: '#f97316', fontSize: 11, fontWeight: '900', letterSpacing: 0.3 },
  headerBtn: { fontWeight: '700', fontSize: 15 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.cardAlt,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  searchInput: { flex: 1, color: palette.text, fontSize: 14 },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: glass.borderStrong,
    backgroundColor: palette.bgElevated,
    marginRight: 6,
    height: 38
  },
  chipText: { color: palette.text, fontWeight: '700', fontSize: 13 },
  clearChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 10,
    marginVertical: 2,
  },
  menuText: { color: palette.text, fontWeight: '600', fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  exName: { color: palette.text, fontWeight: '700', fontSize: 15 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  tag: {
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  tagDim: { color: palette.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
});
