import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, screenTheme, spiritText } from '@/lib/themes';
import { useSpiritQuests, useClaimQuest, SpiritQuest } from '@/hooks/useSpiritQuests';

export function QuestsCard() {
  const accent = screenTheme.spirit.accent;
  const accent2 = screenTheme.spirit.accent2;
  const { data } = useSpiritQuests();
  const claim = useClaimQuest();

  if (!data || data.length === 0) return null;

  return (
    <View style={[styles.card, { borderColor: accent + '55' }]}>
      <LinearGradient
        colors={[accent + '22', 'transparent']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.head}>
        <View style={[styles.headIcon, { backgroundColor: accent + '33' }]}>
          <Ionicons name="flash" size={14} color="#ffffff" />
        </View>
        <Text style={styles.title}>Daily Spirit Quests</Text>
        <Text style={styles.headSub}>
          {data.filter((q) => q.claimed).length}/{data.length}
        </Text>
      </View>

      {data.map((q) => (
        <QuestRow
          key={q.id}
          quest={q}
          accent={accent}
          accent2={accent2}
          onClaim={() => claim.mutate(q.id)}
          claiming={claim.isPending}
        />
      ))}
    </View>
  );
}

function QuestRow({
  quest,
  accent,
  accent2,
  onClaim,
  claiming,
}: {
  quest: SpiritQuest;
  accent: string;
  accent2: string;
  onClaim: () => void;
  claiming: boolean;
}) {
  const pct = Math.min(1, quest.target > 0 ? quest.progress / quest.target : 0);
  const ringColor = quest.claimed ? '#ffffff44' : quest.completed ? accent2 : accent;
  return (
    <View style={[styles.row, quest.claimed && { opacity: 0.55 }]}>
      <View style={[styles.qIcon, { backgroundColor: accent + '33', borderColor: ringColor }]}>
        <Ionicons name={quest.icon as any} size={16} color="#ffffff" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.qTitle,
              quest.claimed && { textDecorationLine: 'line-through' },
            ]}
            numberOfLines={1}>
            {quest.title}
          </Text>
          <Text style={[styles.qXp, { color: quest.claimed ? spiritText.tertiary : accent2 }]}>
            +{quest.xpReward}
          </Text>
        </View>
        <Text style={styles.qDesc} numberOfLines={1}>
          {quest.description}
        </Text>
        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              { backgroundColor: quest.completed ? accent2 : accent, width: `${pct * 100}%` },
            ]}
          />
        </View>
      </View>
      {quest.completed && !quest.claimed ? (
        <Pressable
          onPress={onClaim}
          disabled={claiming}
          style={({ pressed }) => [
            styles.claimBtn,
            { backgroundColor: accent2 },
            pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
            claiming && { opacity: 0.6 },
          ]}>
          <Text style={styles.claimLabel}>Claim</Text>
        </Pressable>
      ) : quest.claimed ? (
        <Ionicons name="checkmark-done" size={20} color={accent} />
      ) : (
        <Text style={styles.qPct}>{Math.round(pct * 100)}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 4,
    padding: 14,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    flex: 1,
  },
  headSub: { color: spiritText.secondary, fontSize: 11, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 6,
  },
  qIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qTitle: { color: '#ffffff', fontSize: 13, fontWeight: '900', flex: 1 },
  qXp: { fontSize: 12, fontWeight: '900' },
  qDesc: { color: spiritText.secondary, fontSize: 11, fontWeight: '700', marginTop: 1 },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: 6,
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 3 },
  qPct: { color: spiritText.secondary, fontSize: 12, fontWeight: '900', minWidth: 40, textAlign: 'right' },
  claimBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  claimLabel: { color: '#0b0b14', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
});
