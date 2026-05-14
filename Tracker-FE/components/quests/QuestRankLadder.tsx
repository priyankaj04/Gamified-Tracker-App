import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { palette, questText, screenTheme } from '@/lib/themes';
import { HUNTER_CHARACTER_BY_KEY } from '@/lib/hunterBadges';
import type { HunterRank } from '@/lib/xp';

interface Props {
  ladder: HunterRank[];
  score: number;
  currentKey: string | undefined;
  unitLabel: string;
}

const QUEST_ACCENT = screenTheme.quests.accent;
const DISPLAY_FONT = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif-condensed',
  default: 'System',
});

export function QuestRankLadder({ ladder, score, currentKey, unitLabel }: Props) {
  return (
    <View style={styles.list}>
      {ladder.map((r, idx) => {
        const unlocked = score >= r.min;
        const isCurrent = currentKey === r.key;
        const level = idx + 1;
        const character = HUNTER_CHARACTER_BY_KEY[r.key];
        const color = r.color;

        return (
          <View
            key={r.key}
            style={[
              styles.card,
              { borderColor: unlocked ? QUEST_ACCENT + '55' : palette.border },
              isCurrent && {
                borderColor: color,
                shadowColor: color,
                shadowOpacity: 0.55,
              },
            ]}>
            <LinearGradient
              colors={
                unlocked
                  ? ['rgba(20,7,30,0.95)', 'rgba(7,12,20,0.95)']
                  : ['rgba(20,20,28,0.85)', 'rgba(12,12,18,0.92)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.row}>
              {/* LEFT — info */}
              <View style={styles.info}>
                <Text
                  style={[styles.level, { color: unlocked ? color : questText.tertiary }]}>
                  LEVEL {String(level).padStart(2, '0')}
                </Text>
                <Text
                  style={[
                    styles.name,
                    { color: unlocked ? color : questText.secondary },
                  ]}
                  numberOfLines={2}>
                  {character?.name ?? r.title}
                </Text>
                {character?.tagline ? (
                  <Text style={styles.tagline} numberOfLines={1}>
                    {character.tagline}
                  </Text>
                ) : null}

                {character?.points ? (
                  <View style={styles.points}>
                    {character.points.map((p) => (
                      <View key={p} style={styles.pointRow}>
                        <View
                          style={[
                            styles.dot,
                            { backgroundColor: unlocked ? color : questText.faint },
                          ]}
                        />
                        <Text
                          style={[
                            styles.pointTxt,
                            !unlocked && { color: questText.tertiary },
                          ]}
                          numberOfLines={1}>
                          {p}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.metaRow}>
                  <Text style={styles.meta}>
                    {r.min.toLocaleString()} {unitLabel}
                  </Text>
                  {isCurrent && (
                    <View style={[styles.hereTag, { backgroundColor: color }]}>
                      <Text style={styles.hereTxt}>YOU ARE HERE</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* RIGHT — character art, flush */}
              <View style={styles.artWrap}>
                {character?.image ? (
                  <Image
                    source={character.image}
                    resizeMode="cover"
                    style={[styles.art, !unlocked && styles.artLocked]}
                  />
                ) : null}
                {!unlocked && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={22} color={palette.textDim} />
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    gap: 10,
  },
  card: {
    backgroundColor: palette.bg + 'aa',
    height: 200,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  row: {
    flexDirection: 'row',
    minHeight: 140,
    alignItems: 'stretch',
  },
  info: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 14,
    paddingRight: 8,
    justifyContent: 'center',
    gap: 3,
  },
  level: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  name: {
    fontFamily: DISPLAY_FONT,
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  tagline: {
    color: questText.secondary,
    fontFamily: DISPLAY_FONT,
    fontStyle: 'italic',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 2,
    marginBottom: 4,
  },
  points: {
    gap: 3,
    marginTop: 2,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  pointTxt: {
    color: questText.primary,
    fontSize: 10.5,
    fontWeight: '700',
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  meta: {
    color: questText.tertiary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  hereTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  hereTxt: {
    color: '#0b0b14',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 1,
  },
  artWrap: {
    width: 180,
    alignSelf: 'stretch',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  art: {
    width: '100%',
    height: '100%',
  },
  artLocked: { opacity: 0.25 },
  lockOverlay: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(7,7,16,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
