import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

interface Props {
  /** ISO timestamp the timer started at. */
  startedAt: string;
  /** Set false to freeze the displayed value. */
  running?: boolean;
  /** "hms" → HH:MM:SS, "ms" → MM:SS */
  format?: 'hms' | 'ms';
  style?: StyleProp<TextStyle>;
}

const pad = (n: number) => n.toString().padStart(2, '0');

const formatElapsed = (sec: number, format: 'hms' | 'ms') => {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (format === 'ms') return `${pad(h * 60 + m)}:${pad(ss)}`;
  return `${pad(h)}:${pad(m)}:${pad(ss)}`;
};

/**
 * Renders a smoothly-ticking elapsed time relative to `startedAt`.
 * The clock is driven entirely by Date.now() locally — no network polling
 * involved — so the displayed value never stutters or jumps.
 */
export function LiveTimer({ startedAt, running = true, format = 'hms', style }: Props) {
  const startMs = useRef(new Date(startedAt).getTime());
  const [now, setNow] = useState(() => Date.now());

  // Re-anchor when startedAt changes (e.g. timer restarted).
  useEffect(() => {
    startMs.current = new Date(startedAt).getTime();
    setNow(Date.now());
  }, [startedAt]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  const elapsedSec = Math.floor((now - startMs.current) / 1000);
  return <Text style={style}>{formatElapsed(elapsedSec, format)}</Text>;
}
