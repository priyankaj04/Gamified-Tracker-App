import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { palette, screenTheme, vaultText } from '@/lib/themes';
import { MAGE_CHARACTER_BY_KEY } from '@/lib/mageBadges';
import { MAGE_RANKS, type ModuleRank } from '@/lib/xp';

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

const VAULT_GOLD = screenTheme.vault.accent;
const DISPLAY_FONT = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif-condensed',
  default: 'System',
});

export function VaultRankBadgeCard({
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
  const character = rank?.key ? MAGE_CHARACTER_BY_KEY[rank.key] : undefined;
  const levelIdx = rank ? MAGE_RANKS.findIndex((r) => r.key === rank.key) : -1;
  const level = levelIdx >= 0 ? levelIdx + 1 : null;
  const Wrap: any = onPress ? Pressable : View;

  return (
    <Wrap onPress={onPress} style={[styles.card, { borderColor: VAULT_GOLD + '55', height: 210 }]}>
      <LinearGradient
        colors={['rgba(30,22,7,0.95)', 'rgba(16,12,7,0.95)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.hero}>
        {/* LEFT — info */}
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', flex: 1, justifyContent:'space-between', alignItems: 'center', gap: 18 }}>
            {level != null && (
              <Text style={[styles.level, { color }]}>LEVEL {String(level).padStart(2, '0')}</Text>
            )}
            <Text style={[styles.metaValue, { color }]}>{score.toLocaleString()} XP</Text>
          </View>
          <Text style={[styles.name, { color }]} numberOfLines={2}>
            {character?.name ?? rank?.title ?? '—'}
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
                  <View style={[styles.dot, { backgroundColor: color }]} />
                  <Text style={styles.pointTxt} numberOfLines={1}>
                    {p}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

        </View>

        {/* RIGHT — character art, flush to the edge */}
        <View style={styles.artWrap}>
          {character?.image ? (
            <Image source={character.image} resizeMode="cover" style={styles.art} />
          ) : null}
        </View>

        {right ? <View style={styles.heroRight}>{right}</View> : null}
      </View>

      <View style={styles.body}>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Vault XP</Text>
            <Text style={[styles.metaValue, { color }]}>{score.toLocaleString()}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: color + '33' }]} />
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>{nextRank ? 'To Next Rank' : 'Status'}</Text>
            <Text style={[styles.metaValue, { color }]}>
              {nextRank ? `${toNext.toLocaleString()} XP` : 'MAXED'}
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
    backgroundColor: palette.bg + 'aa',
    borderRadius: 18,
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
    flexDirection: 'row',
    minHeight: 160,
    alignItems: 'stretch',
  },
  info: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 8,
    justifyContent: 'center',
    gap: 4,
  },
  level: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.4,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  name: {
    fontFamily: DISPLAY_FONT,
    fontSize: 22,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 2 },
  },
  tagline: {
    color: vaultText.secondary,
    fontFamily: DISPLAY_FONT,
    fontStyle: 'italic',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 2,
    marginBottom: 6,
  },
  points: {
    gap: 4,
    marginTop: 4,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  pointTxt: {
    color: vaultText.primary,
    fontSize: 10,
    fontWeight: '700',
    flexShrink: 1,
  },
  artWrap: {
    width: 180,
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  art: {
    width: '100%',
    height: '100%',
  },
  heroRight: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  sub: {
    color: vaultText.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaCol: { flex: 1 },
  metaLabel: {
    color: vaultText.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 20,
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
    color: vaultText.secondary,
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
