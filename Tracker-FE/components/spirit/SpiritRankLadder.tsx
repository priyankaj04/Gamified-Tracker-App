import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';
import { CHAKRA_BADGE_IMAGES } from '@/lib/spiritBadges';
import type { ModuleRank } from '@/lib/xp';

interface Props {
  ladder: ModuleRank[];
  score: number;
  currentKey: string | undefined;
  unitLabel: string;
}

export function SpiritRankLadder({ ladder, score, currentKey, unitLabel }: Props) {
  return (
    <View style={styles.grid}>
      {ladder.map((r, idx) => {
        const unlocked = score >= r.min;
        const isCurrent = currentKey === r.key;
        const level = idx + 1;
        const badge = CHAKRA_BADGE_IMAGES[r.key];
        return (
          <View
            key={r.key}
            style={[
              styles.tile,
              { borderColor: unlocked ? r.color + '55' : palette.border },
              isCurrent && {
                borderColor: r.color,
                backgroundColor: r.color + '14',
                shadowColor: r.color,
                shadowOpacity: 0.55,
              },
            ]}>
            <View style={styles.badgeWrap}>
              <Image
                source={badge}
                resizeMode="contain"
                style={[
                  styles.badgeImg,
                  !unlocked && styles.badgeLocked,
                ]}
              />
              {!unlocked && (
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={18} color={palette.textDim} />
                </View>
              )}
            </View>
            <Text style={[styles.level, { color: isCurrent ? r.color : palette.textMuted }]}>
              LEVEL {String(level).padStart(2, '0')}
            </Text>
            <Text
              numberOfLines={1}
              style={[styles.title, { color: unlocked ? r.color : palette.textMuted }]}>
              {r.title}
            </Text>
            <Text style={styles.sub}>
              {r.min} {unitLabel}
            </Text>
            {isCurrent && (
              <View style={[styles.hereTag, { backgroundColor: r.color }]}>
                <Text style={styles.hereTxt}>YOU ARE HERE</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  tile: {
    width: '47.5%',
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  badgeWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeImg: { width: '100%', height: '100%' },
  badgeLocked: { opacity: 0.25 },
  lockOverlay: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(7,7,16,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  level: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginTop: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
    textAlign: 'center',
  },
  sub: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  hereTag: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  hereTxt: {
    color: '#0b0b14',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
