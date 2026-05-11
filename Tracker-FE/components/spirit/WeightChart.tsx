import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Rect } from 'react-native-svg';
import { palette , spiritText } from '@/lib/themes';

interface Props {
  values: number[]; // chronological oldest → newest
  labels?: string[];
  color?: string;
  height?: number;
  width?: number;
  idealMin?: number;
  idealMax?: number;
  showMovingAverage?: boolean;
}

const movingAverage = (xs: number[], window = 7) => {
  return xs.map((_, i) => {
    const slice = xs.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((s, n) => s + n, 0) / slice.length;
  });
};

export function WeightChart({
  values,
  color = '#4ade80',
  height = 180,
  width = 320,
  idealMin,
  idealMax,
  showMovingAverage = true,
}: Props) {
  const movingAvg = useMemo(() => movingAverage(values), [values]);

  if (!values || values.length < 2) {
    return (
      <View style={[styles.empty, { height, width }]}>
        <Text style={{ color: spiritText.secondary, fontSize: 12 }}>Not enough data yet</Text>
      </View>
    );
  }

  const padding = 16;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const all = [...values, ...(idealMin != null ? [idealMin] : []), ...(idealMax != null ? [idealMax] : [])];
  const max = Math.max(...all);
  const min = Math.min(...all);
  const range = max - min || 1;
  const stepX = w / (values.length - 1);

  const pts = values.map((v, i) => ({
    x: padding + stepX * i,
    y: padding + h - ((v - min) / range) * h,
  }));
  const avgPts = movingAvg.map((v, i) => ({
    x: padding + stepX * i,
    y: padding + h - ((v - min) / range) * h,
  }));

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${padding + h} L${pts[0].x},${padding + h} Z`;
  const avgLine = avgPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Ideal range band
  let idealBand: { y: number; h: number } | null = null;
  if (idealMin != null && idealMax != null) {
    const yTop = padding + h - ((idealMax - min) / range) * h;
    const yBottom = padding + h - ((idealMin - min) / range) * h;
    idealBand = { y: yTop, h: Math.max(2, yBottom - yTop) };
  }

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {idealBand && (
          <Rect
            x={padding}
            y={idealBand.y}
            width={w}
            height={idealBand.h}
            fill={color}
            fillOpacity={0.08}
          />
        )}
        <Path d={area} fill="url(#wgrad)" />
        <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        {showMovingAverage && (
          <Path
            d={avgLine}
            stroke={palette.warning}
            strokeWidth={2}
            fill="none"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.card,
    borderRadius: 12,
  },
});
