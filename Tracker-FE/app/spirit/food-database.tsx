import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlowButton } from '@/components/ui/GlowButton';
import { EmptyState } from '@/components/layout/EmptyState';
import { useFoods, useCreateFood, useDeleteFood } from '@/hooks/useNutrition';

export default function FoodDatabaseScreen() {
  const accent = screenTheme.spirit.accent;
  const [search, setSearch] = useState('');
  const foods = useFoods(search);
  const create = useCreateFood();
  const del = useDeleteFood();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [kcal, setKcal] = useState('');
  const [p, setP] = useState('');
  const [c, setC] = useState('');
  const [f, setF] = useState('');

  return (
    <ThemedScene scene="spirit">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <SpiritHeader title="Foods" subtitle="Custom database" accent={accent} back compact />
        <View style={{ padding: 16 }}>
          <View style={styles.search}>
            <Ionicons name="search" size={16} color={spiritText.secondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search foods…"
              placeholderTextColor={spiritText.tertiary}
              style={styles.searchInput}
            />
          </View>
        </View>

        <SectionTitle title="Foods" accent={accent} />
        {foods.data && foods.data.length > 0 ? (
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {foods.data.map((food) => (
              <View key={food.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{food.name}</Text>
                  <Text style={styles.sub}>
                    {food.caloriesPer100g ? `${food.caloriesPer100g}kcal/100g` : '—'} · P {food.proteinPer100g ?? '—'} · C {food.carbsPer100g ?? '—'} · F {food.fatsPer100g ?? '—'}
                  </Text>
                </View>
                {food.isCustom && (
                  <Pressable onPress={() => del.mutate(food.id)} hitSlop={8}>
                    <Ionicons name="trash" size={16} color={spiritText.tertiary} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <EmptyState icon="restaurant" title="No foods saved" message="Add your own foods for quick logging." accent={accent} />
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: accent, shadowColor: accent },
          pressed && { opacity: 0.85 },
        ]}>
        <Ionicons name="add" size={28} color="#0b0b14" />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Add Food">
        <Field label="Name">
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholderTextColor={spiritText.tertiary} />
        </Field>
        <Field label="Calories per 100g">
          <TextInput value={kcal} onChangeText={setKcal} keyboardType="number-pad" style={styles.input} placeholderTextColor={spiritText.tertiary} />
        </Field>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Field label="Protein"><TextInput value={p} onChangeText={setP} keyboardType="decimal-pad" style={styles.input} /></Field></View>
          <View style={{ flex: 1 }}><Field label="Carbs"><TextInput value={c} onChangeText={setC} keyboardType="decimal-pad" style={styles.input} /></Field></View>
          <View style={{ flex: 1 }}><Field label="Fats"><TextInput value={f} onChangeText={setF} keyboardType="decimal-pad" style={styles.input} /></Field></View>
        </View>
        <View style={{ height: 12 }} />
        <GlowButton
          title="Save"
          color={accent}
          loading={create.isPending}
          onPress={async () => {
            if (!name) return;
            await create.mutateAsync({
              name,
              caloriesPer100g: kcal ? parseFloat(kcal) : undefined,
              proteinPer100g: p ? parseFloat(p) : undefined,
              carbsPer100g: c ? parseFloat(c) : undefined,
              fatsPer100g: f ? parseFloat(f) : undefined,
            });
            setOpen(false);
            setName('');
            setKcal('');
            setP('');
            setC('');
            setF('');
          }}
        />
      </BottomSheet>
    </ThemedScene>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, color: palette.text, paddingVertical: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  name: { color: palette.text, fontWeight: '800', fontSize: 14 },
  sub: { color: spiritText.secondary, fontSize: 11, fontWeight: '700', marginTop: 2 },
  input: {
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    padding: 12,
    fontSize: 14,
  },
  fieldLabel: {
    color: spiritText.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
