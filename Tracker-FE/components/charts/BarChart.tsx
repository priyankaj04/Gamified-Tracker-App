import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { palette } from '@/lib/themes';

interface Bar {
  label: string;
  value: number;
}

interface Props {
  bars: Bar[];
  color?: string;
  height?: number;
  width?: number;
  valueFormatter?: (v: number) => string;
}

export function BarChart({
  bars,
  color = '#a78bfa',
  height = 160,
  width = 320,
  valueFormatter = (v) => `${Math.round(v)}`,
}: Props) {
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  if (!bars.length) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={{ color: palette.textMuted, fontSize: 12 }}>No data</Text>
      </View>
    );
  }
  const padding = 24;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const gap = 4;
  const barW = Math.max(4, (w - gap * (bars.length - 1)) / bars.length);
  const max = Math.max(1, ...bars.map((b) => b.value));

  const focused = focusedIdx != null ? bars[focusedIdx] : null;
  const focusedX = focusedIdx != null ? padding + focusedIdx * (barW + gap) + barW / 2 : 0;

  return (
    <View>
      <View>
        <Svg width={width} height={height}>
          {bars.map((b, i) => {
            const bh = (b.value / max) * h;
            const isFocused = focusedIdx === i;
            return (
              <Rect
                key={i}
                x={padding + i * (barW + gap)}
                y={padding + h - bh}
                width={barW}
                height={bh}
                rx={3}
                fill={color}
                opacity={isFocused ? 1 : b.value > 0 ? 0.9 : 0.18}
              />
            );
          })}
        </Svg>
        {/* Overlay tap targets — Svg has poor hit-testing for tiny bars */}
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
          {bars.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => setFocusedIdx((cur) => (cur === i ? null : i))}
              style={{ flex: 1 }}
            />
          ))}
        </View>
        {focused && (
          <View
            pointerEvents="none"
            style={[
              styles.tooltip,
              {
                left: Math.min(width - 70, Math.max(0, focusedX - 32)),
                top: padding - 6,
                borderColor: color,
              },
            ]}>
            <Text style={[styles.tooltipText, { color }]}>{valueFormatter(focused.value)}</Text>
            <Text style={styles.tooltipLabel}>{focused.label}</Text>
          </View>
        )}
      </View>
      <View style={[styles.labels, { width }]}>
        {bars.map((b, i) => (
          <Text
            key={i}
            style={[styles.label, { width: barW + gap, transform: [{ translateX: padding - gap / 2 }] }]}
            numberOfLines={1}>
            {b.label}
          </Text>
        ))}
      </View>
      <Text style={[styles.peak, { color }]}>Peak: {valueFormatter(max)}</Text>
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
  labels: { flexDirection: 'row', position: 'absolute', bottom: 4 },
  label: { color: palette.textMuted, fontSize: 9, textAlign: 'center', fontWeight: '700' },
  peak: { fontSize: 11, fontWeight: '800', marginTop: 4, textAlign: 'right', paddingRight: 4 },
  tooltip: {
    position: 'absolute',
    backgroundColor: palette.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 64,
  },
  tooltipText: { fontSize: 12, fontWeight: '900' },
  tooltipLabel: { color: palette.textMuted, fontSize: 9, fontWeight: '700', marginTop: 1 },
});
