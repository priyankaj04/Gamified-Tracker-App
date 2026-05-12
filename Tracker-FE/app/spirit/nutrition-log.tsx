import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { GlowButton } from '@/components/ui/GlowButton';
import { SpiritDatePicker as DatePicker, todayISO } from '@/components/spirit/SpiritDatePicker';
import { useLogMeal } from '@/hooks/useNutrition';
import type { MealType } from '@/types';

const TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export default function NutritionLogScreen() {
  const accent = screenTheme.spirit.accent;
  const router = useRouter();
  const logMeal = useLogMeal();

  const [date, setDate] = useState(todayISO());
  const [mealType, setMealType] = useState<MealType>('Breakfast');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  return (
    <ThemedScene scene="spirit">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Field label="Date">
          <DatePicker value={date} onChange={setDate} accent={accent} />
        </Field>

        <Field label="Meal type">
          <View style={styles.row}>
            {TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setMealType(t)}
                style={[
                  styles.chip,
                  mealType === t && { backgroundColor: accent + '22', borderColor: accent },
                ]}>
                <Text style={[styles.chipLabel, mealType === t && { color: accent }]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Name">
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="e.g. Chicken bowl" placeholderTextColor={spiritText.tertiary} />
        </Field>
        <Field label="Calories (kcal)">
          <TextInput value={calories} onChangeText={setCalories} keyboardType="number-pad" style={styles.input} placeholderTextColor={spiritText.tertiary} />
        </Field>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field label="Protein (g)">
              <TextInput value={protein} onChangeText={setProtein} keyboardType="decimal-pad" style={styles.input} placeholderTextColor={spiritText.tertiary} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Carbs (g)">
              <TextInput value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" style={styles.input} placeholderTextColor={spiritText.tertiary} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Fats (g)">
              <TextInput value={fats} onChangeText={setFats} keyboardType="decimal-pad" style={styles.input} placeholderTextColor={spiritText.tertiary} />
            </Field>
          </View>
        </View>

        <View style={{ height: 8 }} />
        <GlowButton
          title="Save Meal"
          color={accent}
          loading={logMeal.isPending}
          onPress={async () => {
            const kcal = parseInt(calories, 10);
            if (!name || !kcal) return;
            await logMeal.mutateAsync({
              date,
              mealType,
              name,
              calories: kcal,
              proteinG: protein ? parseFloat(protein) : 0,
              carbsG: carbs ? parseFloat(carbs) : 0,
              fatsG: fats ? parseFloat(fats) : 0,
            });
            router.back();
          }}
        />
      </ScrollView>
    </ThemedScene>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipLabel: { color: spiritText.secondary, fontSize: 12, fontWeight: '800' },
});
