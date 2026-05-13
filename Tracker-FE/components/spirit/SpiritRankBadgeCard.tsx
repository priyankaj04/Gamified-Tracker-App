import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';
import { CHAKRA_BADGE_IMAGES } from '@/lib/spiritBadges';
import { CHAKRA_RANKS, type ModuleRank } from '@/lib/xp';

interface Props {
  rank: ModuleRank | undefined;
  nextRank: ModuleRank | null | undefined;
  score: number;
  progressPct: number;
  toNext: number;
  subtitle?: string;
  accent: string;
  onPress?: () => void;
  right?: React.ReactNode;
}

export function SpiritRankBadgeCard({
  rank,
  nextRank,
  score,
  progressPct,
  toNext,
  subtitle,
  accent,
  onPress,
  right,
}: Props) {
  const color = rank?.color ?? accent;
  const badge = rank?.key ? CHAKRA_BADGE_IMAGES[rank.key] : undefined;
  const levelIdx = rank ? CHAKRA_RANKS.findIndex((r) => r.key === rank.key) : -1;
  const level = levelIdx >= 0 ? levelIdx + 1 : null;
  const Wrap: any = onPress ? Pressable : View;

  return (
    <Wrap onPress={onPress} style={[styles.card]}>
      <ImageBackground
        source={badge}
        resizeMode="contain"
        style={styles.hero}
        imageStyle={styles.heroImg}>
        <LinearGradient
          colors={['rgba(7,7,16,0)', 'rgba(7,7,16,0.35)', 'rgba(7,7,16,0.95)']}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        {right ? <View style={styles.heroRight}>{right}</View> : null}
        <View style={styles.heroFoot}>
          {level != null && (
            <Text style={[styles.level, { color }]}>LEVEL {String(level).padStart(2, '0')}</Text>
          )}
          <Text style={[styles.title, { color }]} numberOfLines={1}>
            {rank?.title ?? '—'}
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.body}>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Total Logs</Text>
            <Text style={[styles.metaValue, { color }]}>{score}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: color + '33' }]} />
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>
              {nextRank ? 'To Next Rank' : 'Status'}
            </Text>
            <Text style={[styles.metaValue, { color: nextRank ? color : color }]}>
              {nextRank ? `${toNext} logs` : 'MAXED'}
            </Text>
          </View>
        </View>

        {nextRank ? (
          <>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.max(0, Math.min(100, progressPct))}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={styles.barTxt}>
              Next:{' '}
              <Text style={{ color: nextRank.color, fontWeight: '900' }}>{nextRank.title}</Text>
            </Text>
          </>
        ) : (
          <Text style={[styles.barTxt, { color }]}>Apex rank achieved.</Text>
        )}

        {onPress && (
          <View style={styles.cta}>
            <Text style={[styles.ctaTxt, { color }]}>View rank path</Text>
            <Ionicons name="chevron-forward" size={14} color={color} />
          </View>
        )}
      </View>
    </Wrap>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.card,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1.5,
    marginHorizontal: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  hero: {
    height: 90,
    width: '100%',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(7,7,16,0.55)',
  },
  heroImg: {
    opacity: 0.95,
    alignSelf: 'center',
  },
  heroRight: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  heroFoot: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  level: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  sub: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaCol: { flex: 1 },
  metaLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  divider: {
    width: 1,
    height: 28,
    marginHorizontal: 12,
  },
  barBg: {
    height: 6,
    backgroundColor: palette.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3 },
  barTxt: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ctaTxt: { fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
});
