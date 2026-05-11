import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { palette } from '@/lib/themes';

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: Slice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ slices, size = 180, thickness = 22, centerLabel, centerValue }: Props) {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={[styles.empty, { width: size - 20, height: size - 20, borderRadius: (size - 20) / 2 }]}>
          <Text style={{ color: palette.textMuted, fontSize: 12 }}>No data</Text>
        </View>
      </View>
    );
  }

  let offset = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          {slices.map((s, i) => {
            const frac = s.value / total;
            const dash = c * frac;
            const ring = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={s.color}
                strokeWidth={thickness}
                fill="none"
                strokeDasharray={`${dash} ${c}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return ring;
          })}
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        {centerValue && <Text style={styles.value}>{centerValue}</Text>}
        {centerLabel && <Text style={styles.label}>{centerLabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 24, fontWeight: '900', color: palette.text, letterSpacing: -0.4 },
  label: { fontSize: 11, color: palette.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderStyle: 'dashed',
  },
});
