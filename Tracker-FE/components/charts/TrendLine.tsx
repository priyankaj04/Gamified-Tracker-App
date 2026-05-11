import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { palette } from '@/lib/themes';

interface Props {
  values: number[];
  color?: string;
  height?: number;
  width?: number;
  fillBelow?: boolean;
  showDots?: boolean;
}

export function TrendLine({
  values,
  color = '#4ade80',
  height = 140,
  width = 320,
  fillBelow = true,
  showDots = false,
}: Props) {
  if (!values || values.length < 2) {
    return (
      <View style={[styles.empty, { height, width }]}>
        <Text style={{ color: palette.textMuted, fontSize: 12 }}>Not enough data yet</Text>
      </View>
    );
  }
  const padding = 12;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const stepX = w / (values.length - 1);

  const pts = values.map((v, i) => ({
    x: padding + stepX * i,
    y: padding + h - ((v - min) / range) * h,
  }));

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x},${padding + h} L${pts[0].x},${padding + h} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {fillBelow && <Path d={area} fill="url(#grad)" />}
      <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {showDots &&
        pts.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}
    </Svg>
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
