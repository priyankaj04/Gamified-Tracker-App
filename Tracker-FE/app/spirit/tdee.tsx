import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { GlowButton } from '@/components/ui/GlowButton';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { StatCard } from '@/components/ui/StatCard';
import { useTDEE } from '@/hooks/useNutrition';

export default function TDEEScreen() {
  const accent = screenTheme.spirit.accent;
  const tdee = useTDEE();

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [activity, setActivity] = useState<'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'>('moderate');

  return (
    <ThemedScene scene="spirit">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SpiritHeader title="TDEE" subtitle="Cut · Maintain · Bulk" accent={accent} back compact />
        <View style={{ paddingHorizontal: 20, gap: 12, paddingTop: 4 }}>
        <Text style={styles.sub}>Estimate your maintenance, cut, and bulk calories.</Text>

        <Field label="Weight (kg)">
          <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" style={styles.input} />
        </Field>
        <Field label="Height (cm)">
          <TextInput value={height} onChangeText={setHeight} keyboardType="decimal-pad" style={styles.input} />
        </Field>
        <Field label="Age">
          <TextInput value={age} onChangeText={setAge} keyboardType="number-pad" style={styles.input} />
        </Field>

        <Field label="Gender">
          <View style={styles.row}>
            {(['male', 'female', 'other'] as const).map((g) => (
              <Pressable
                key={g}
                onPress={() => setGender(g)}
                style={[styles.chip, gender === g && { borderColor: accent, backgroundColor: accent + '22' }]}>
                <Text style={[styles.chipLabel, gender === g && { color: accent }]}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Activity">
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as const).map((a) => (
              <Pressable
                key={a}
                onPress={() => setActivity(a)}
                style={[styles.chip, activity === a && { borderColor: accent, backgroundColor: accent + '22' }]}>
                <Text style={[styles.chipLabel, activity === a && { color: accent }]}>{a}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <GlowButton
          title="Calculate"
          color={accent}
          loading={tdee.isPending}
          onPress={() => {
            const w = parseFloat(weight);
            const h = parseFloat(height);
            const a = parseInt(age, 10);
            if (!w || !h || !a) return;
            tdee.mutate({ weightKg: w, heightCm: h, age: a, gender, activityLevel: activity });
          }}
        />

        {tdee.data && (
          <>
            <SectionTitle title="Results" accent={accent} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <StatCard label="BMR" value={tdee.data.bmr} accent={accent} />
              <StatCard label="TDEE" value={tdee.data.tdee} accent={accent} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <StatCard label="Cut" value={tdee.data.cuttingCalories} accent={palette.danger} />
              <StatCard label="Maintain" value={tdee.data.maintenanceCalories} accent={spiritText.secondary} />
              <StatCard label="Bulk" value={tdee.data.bulkingCalories} accent={screenTheme.spirit.accent2} />
            </View>
          </>
        )}
        </View>
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
  title: { color: palette.text, fontSize: 22, fontWeight: '900' },
  sub: { color: spiritText.secondary, fontSize: 13 },
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
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.card,
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  chipLabel: { color: spiritText.secondary, fontSize: 12, fontWeight: '800' },
});
