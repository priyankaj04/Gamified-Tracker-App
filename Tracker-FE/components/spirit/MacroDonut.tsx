import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { palette, spiritText } from '@/lib/themes';

interface Props {
  proteinG: number;
  carbsG: number;
  fatsG: number;
  size?: number;
}

const COLORS = {
  protein: '#16a34a',
  carbs: '#fbbf24',
  fats: '#f97316',
};

export function MacroDonut({ proteinG, carbsG, fatsG, size = 140 }: Props) {
  const total = proteinG * 4 + carbsG * 4 + fatsG * 9;
  if (total === 0) {
    return (
      <View style={[styles.empty, { width: size, height: size }]}>
        <Text style={{ color: spiritText.secondary, fontSize: 11, fontWeight: '800' }}>
          No macros yet
        </Text>
      </View>
    );
  }
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pPct = (proteinG * 4) / total;
  const cPct = (carbsG * 4) / total;
  const fPct = (fatsG * 9) / total;
  const cx = size / 2;
  const cy = size / 2;

  // Each arc as a Circle with strokeDasharray/offset
  const arc = (pct: number, color: string, offset: number) => (
    <Circle
      cx={cx}
      cy={cy}
      r={r}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeDasharray={`${c * pct} ${c}`}
      strokeDashoffset={-c * offset}
      transform={`rotate(-90 ${cx} ${cy})`}
      strokeLinecap="butt"
    />
  );

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke={palette.cardAlt} strokeWidth={strokeWidth} fill="none" />
        {arc(pPct, COLORS.protein, 0)}
        {arc(cPct, COLORS.carbs, pPct)}
        {arc(fPct, COLORS.fats, pPct + cPct)}
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.kcal}>{Math.round(total)}</Text>
        <Text style={styles.kcalLabel}>kcal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kcal: { color: spiritText.primary, fontSize: 18, fontWeight: '900' },
  kcalLabel: { color: spiritText.secondary, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
    borderRadius: 12,
  },
});
