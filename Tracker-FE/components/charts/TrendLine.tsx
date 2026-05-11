import React, { useState } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { palette } from '@/lib/themes';

interface Props {
  values: number[];
  labels?: string[];
  color?: string;
  height?: number;
  width?: number;
  fillBelow?: boolean;
  showDots?: boolean;
  valueFormatter?: (v: number) => string;
}

export function TrendLine({
  values,
  labels,
  color = '#4ade80',
  height = 140,
  width = 320,
  fillBelow = true,
  showDots = false,
  valueFormatter = (v) => v.toFixed(1),
}: Props) {
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

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

  const focused = focusedIdx != null ? pts[focusedIdx] : null;
  const focusedVal = focusedIdx != null ? values[focusedIdx] : null;
  const focusedLabel = focusedIdx != null ? labels?.[focusedIdx] : null;

  return (
    <View style={{ width, height }}>
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
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={focusedIdx === i ? 5 : 3}
              fill={color}
              {...(focusedIdx === i
                ? { stroke: palette.bgElevated, strokeWidth: 2 }
                : {})}
            />
          ))}
      </Svg>
      <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
        {values.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => setFocusedIdx((cur) => (cur === i ? null : i))}
            style={{ flex: 1 }}
          />
        ))}
      </View>
      {focused && focusedVal != null && (
        <View
          pointerEvents="none"
          style={[
            styles.tooltip,
            {
              left: Math.min(width - 90, Math.max(0, focused.x - 40)),
              top: Math.max(0, focused.y - 38),
              borderColor: color,
            },
          ]}>
          <Text style={[styles.tooltipValue, { color }]}>{valueFormatter(focusedVal)}</Text>
          {focusedLabel && <Text style={styles.tooltipLabel}>{focusedLabel}</Text>}
        </View>
      )}
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
  tooltip: {
    position: 'absolute',
    backgroundColor: palette.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  tooltipValue: { fontSize: 13, fontWeight: '900' },
  tooltipLabel: { color: palette.textMuted, fontSize: 10, fontWeight: '700', marginTop: 1 },
});
