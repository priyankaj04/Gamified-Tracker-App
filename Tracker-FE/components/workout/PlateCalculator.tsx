import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { palette } from '@/lib/themes';

const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];
const COLORS: Record<number, string> = {
  25: '#ef4444',
  20: '#3b82f6',
  15: '#fbbf24',
  10: '#4ade80',
  5: '#ffffff',
  2.5: '#94a3b8',
  1.25: '#64748b',
};

interface Props {
  barbellKg: number;
  unitLabel: string;
  accent: string;
}

export function PlateCalculator({ barbellKg, unitLabel, accent }: Props) {
  const [target, setTarget] = useState('60');
  const targetNum = parseFloat(target) || 0;

  const plates = useMemo(() => {
    if (targetNum <= barbellKg) return [] as { weight: number; count: number }[];
    let perSide = (targetNum - barbellKg) / 2;
    const out: { weight: number; count: number }[] = [];
    for (const p of PLATES_KG) {
      const count = Math.floor(perSide / p);
      if (count > 0) {
        out.push({ weight: p, count });
        perSide -= count * p;
      }
    }
    return out;
  }, [targetNum, barbellKg]);

  const loaded = barbellKg + plates.reduce((s, p) => s + p.weight * p.count * 2, 0);
  const remainder = targetNum - loaded;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Plate Calculator</Text>
      <Text style={styles.subtitle}>Bar: {barbellKg} {unitLabel}</Text>
      <View style={styles.targetRow}>
        <Text style={styles.targetLabel}>Target</Text>
        <TextInput
          value={target}
          onChangeText={(v) => setTarget(v.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          style={[styles.input, { color: accent }]}
          placeholderTextColor={palette.textDim}
        />
        <Text style={[styles.targetLabel, { color: accent }]}>{unitLabel}</Text>
      </View>

      {plates.length === 0 ? (
        <Text style={styles.empty}>
          {targetNum === 0 ? 'Enter a target weight' : 'Target ≤ bar weight'}
        </Text>
      ) : (
        <>
          <Text style={styles.helper}>
            Load <Text style={styles.helperBold}>each side</Text> of the bar with:
          </Text>
          <View style={styles.plateRow}>
            {plates.map((p) => (
              <View key={p.weight} style={[styles.plateChip, { borderColor: COLORS[p.weight] }]}>
                <Text style={[styles.plateText, { color: COLORS[p.weight] }]}>
                  {p.count}× {p.weight}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.foot}>
            {barbellKg} {unitLabel} bar + {((loaded - barbellKg) / 2).toFixed(2)} {unitLabel} per side = {loaded.toFixed(2)} {unitLabel} total
            {Math.abs(remainder) > 0.01 ? `  · short ${remainder.toFixed(2)}` : ' ✓'}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
    gap: 8,
  },
  title: { color: palette.text, fontWeight: '800', fontSize: 14 },
  subtitle: { color: palette.textMuted, fontSize: 11 },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  targetLabel: { color: palette.textMuted, fontWeight: '800', fontSize: 12, letterSpacing: 0.4 },
  input: {
    flex: 1,
    backgroundColor: palette.cardAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 10,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  plateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  plateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  plateText: { fontWeight: '900', fontSize: 12 },
  foot: { color: palette.textMuted, fontSize: 11, marginTop: 4 },
  empty: { color: palette.textDim, fontSize: 12 },
  helper: { color: palette.textMuted, fontSize: 12, marginTop: 4 },
  helperBold: { color: palette.text, fontWeight: '900' },
});
