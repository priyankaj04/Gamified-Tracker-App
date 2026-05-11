import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { palette , spiritText } from '@/lib/themes';

interface Props {
  startTime: string | null;
  targetHours: number;
  size?: number;
}

export function FastingClock({ startTime, targetHours, size = 200 }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startTime) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  const { elapsedH, pct, complete } = useMemo(() => {
    if (!startTime) return { elapsedH: 0, pct: 0, complete: false };
    const ms = now - new Date(startTime).getTime();
    const h = ms / 3_600_000;
    const p = Math.min(1, h / targetHours);
    return { elapsedH: h, pct: p, complete: h >= targetHours };
  }, [startTime, targetHours, now]);

  const strokeWidth = 16;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;
  const color = complete ? '#4ade80' : '#fbbf24';

  const totalSec = Math.max(0, Math.floor((now - (startTime ? new Date(startTime).getTime() : now)) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={palette.cardAlt}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFillObject, styles.center]}>
        {startTime ? (
          <>
            <Text style={[styles.time, { color }]}>
              {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
            </Text>
            <Text style={styles.label}>
              {complete ? 'GOAL REACHED' : `OF ${targetHours}H`}
            </Text>
            <Text style={styles.pct}>{Math.round(pct * 100)}%</Text>
          </>
        ) : (
          <>
            <Text style={[styles.time, { color, fontSize: 22 }]}>READY</Text>
            <Text style={styles.label}>Start a fast</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', padding: 12 },
  time: { fontSize: 30, fontWeight: '900', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  label: {
    fontSize: 10,
    color: spiritText.secondary,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  pct: { fontSize: 14, color: palette.text, fontWeight: '900', marginTop: 6 },
});
