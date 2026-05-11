import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { GlowButton } from '@/components/ui/GlowButton';
import { useProfile, useUpdateProfile } from '@/hooks/useSpirit';
import type { ActivityLevel, Gender } from '@/types';

export default function ProfileScreen() {
  const accent = screenTheme.spirit.accent;
  const profile = useProfile();
  const update = useUpdateProfile();

  const [height, setHeight] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');

  useEffect(() => {
    if (profile.data) {
      setHeight(profile.data.heightCm ? String(profile.data.heightCm) : '');
      setDob(profile.data.dateOfBirth ?? '');
      if (profile.data.gender) setGender(profile.data.gender);
      if (profile.data.activityLevel) setActivity(profile.data.activityLevel);
    }
  }, [profile.data]);

  return (
    <ThemedScene scene="spirit">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <SpiritHeader title="Profile" subtitle="Used by BMI · TDEE" accent={accent} back compact />
        <View style={{ paddingHorizontal: 20, gap: 12, paddingTop: 4 }}>
        <Text style={styles.sub}>Used to calculate BMI, body fat categories, and TDEE.</Text>

        <Field label="Height (cm)">
          <TextInput value={height} onChangeText={setHeight} keyboardType="decimal-pad" style={styles.input} />
        </Field>
        <Field label="Date of birth (YYYY-MM-DD)">
          <TextInput value={dob} onChangeText={setDob} style={styles.input} placeholderTextColor={spiritText.tertiary} />
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
        <Field label="Activity Level">
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
          title="Save"
          color={accent}
          loading={update.isPending}
          onPress={() =>
            update.mutate({
              heightCm: height ? parseFloat(height) : undefined,
              dateOfBirth: dob || undefined,
              gender,
              activityLevel: activity,
            })
          }
        />
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
