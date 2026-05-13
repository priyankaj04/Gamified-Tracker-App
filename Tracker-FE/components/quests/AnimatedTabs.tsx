import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '@/lib/themes';

interface Tab<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (k: T) => void;
  accent: string;
}

export function AnimatedTabs<T extends string>({ tabs, active, onChange, accent }: Props<T>) {
  const idx = Math.max(0, tabs.findIndex((t) => t.key === active));
  const x = useRef(new Animated.Value(idx)).current;

  useEffect(() => {
    Animated.spring(x, {
      toValue: idx,
      damping: 18,
      stiffness: 220,
      useNativeDriver: false,
    }).start();
  }, [idx, x]);

  return (
    <View style={styles.wrap}>
      <View style={styles.tabsRow}>
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              style={styles.tab}>
              <Text style={[styles.label, isActive && { color: accent }]}>
                {t.label}
              </Text>
              {t.count !== undefined && t.count > 0 && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: isActive ? accent + '33' : palette.cardAlt },
                  ]}>
                  <Text style={[styles.badgeTxt, { color: isActive ? accent : palette.textMuted }]}>
                    {t.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.indicatorTrack}>
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: accent,
              left: x.interpolate({
                inputRange: tabs.map((_, i) => i),
                outputRange: tabs.map((_, i) => `${(i * 100) / tabs.length}%`),
              }),
              width: `${100 / tabs.length}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, marginBottom: 10 },
  tabsRow: { flexDirection: 'row', backgroundColor: palette.card, borderRadius: 12, borderWidth: 1, borderColor: palette.border, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  label: { color: palette.textMuted, fontWeight: '800', fontSize: 12, letterSpacing: 0.4 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeTxt: { fontSize: 10, fontWeight: '900' },
  indicatorTrack: {
    marginTop: 6,
    height: 3,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
  },
});
