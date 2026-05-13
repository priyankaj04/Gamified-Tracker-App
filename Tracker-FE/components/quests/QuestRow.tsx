import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { palette, priorityColor } from '@/lib/themes';
import { AnimeTag } from '@/components/ui/AnimeTag';
import type { Quest } from '@/types';

interface Props {
  quest: Quest;
  onComplete: () => void;
  onDelete: () => void;
  onSnooze?: () => void;
  onTap?: () => void;
  accent?: string;
}

const ACTION_WIDTH = 80;

export function QuestRow({ quest, onComplete, onDelete, onSnooze, onTap, accent = '#e879f9' }: Props) {
  const tx = useSharedValue(0);
  const start = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onStart(() => {
      start.value = tx.value;
    })
    .onUpdate((e) => {
      const next = start.value + e.translationX;
      tx.value = Math.min(ACTION_WIDTH * 1.3, Math.max(-ACTION_WIDTH * 1.3, next));
    })
    .onEnd((e) => {
      if (tx.value < -ACTION_WIDTH * 0.55 || e.velocityX < -700) {
        tx.value = withSpring(-ACTION_WIDTH, { damping: 18, stiffness: 220 });
      } else if (tx.value > ACTION_WIDTH * 0.55 || e.velocityX > 700) {
        tx.value = withSpring(ACTION_WIDTH, { damping: 18, stiffness: 220 });
      } else {
        tx.value = withSpring(0, { damping: 18, stiffness: 220 });
      }
    });

  const aStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const close = () => {
    tx.value = withTiming(0);
  };

  const overdue = quest.dueDate && !quest.completed && new Date(quest.dueDate) < new Date(new Date().toISOString().slice(0, 10));
  const stepProgress = quest.stepCount && quest.stepCount > 0
    ? Math.round(((quest.stepDoneCount ?? 0) / quest.stepCount) * 100)
    : null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.leftAction, { backgroundColor: '#fbbf24aa' }]}>
        <Pressable
          onPress={() => {
            close();
            onSnooze?.();
          }}
          style={styles.actionBtn}>
          <Ionicons name="moon" size={18} color="#0b0b14" />
          <Text style={styles.actionLabel}>Snooze</Text>
        </Pressable>
      </View>
      <View style={[styles.rightAction, { backgroundColor: palette.danger + 'aa' }]}>
        <Pressable
          onPress={() => {
            close();
            onDelete();
          }}
          style={styles.actionBtn}>
          <Ionicons name="trash" size={18} color="#0b0b14" />
          <Text style={styles.actionLabel}>Delete</Text>
        </Pressable>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[aStyle, styles.content]}>
          <Pressable
            onPress={() => {
              if (Math.abs(tx.value) > 4) runOnJS(close)();
              else onTap?.();
            }}
            style={[
              styles.card,
              quest.isBoss && { borderColor: '#ef4444', borderWidth: 2 },
              overdue && !quest.isBoss && { borderColor: palette.danger + '88', borderWidth: 1.5 },
            ]}>
            <AnimeTag label={quest.priority} variant="priority" />
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                {quest.isBoss && <Ionicons name="flame" size={14} color="#ef4444" />}
                <Text style={[styles.qTitle, quest.completed && styles.strike]} numberOfLines={2}>
                  {quest.title}
                </Text>
              </View>
              {stepProgress !== null && (
                <View style={styles.progressWrap}>
                  <View style={styles.progressBg}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${stepProgress}%`, backgroundColor: accent },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressTxt}>
                    {quest.stepDoneCount}/{quest.stepCount}
                  </Text>
                </View>
              )}
              <View style={styles.qMeta}>
                {quest.isDaily && <Text style={styles.dailyTag}>DAILY</Text>}
                {quest.recurrence?.kind === 'weekly' && <Text style={styles.dailyTag}>WEEKLY</Text>}
                {quest.recurrence?.kind === 'monthly' && <Text style={styles.dailyTag}>MONTHLY</Text>}
                {quest.dueDate && (
                  <Text style={[styles.dueTxt, overdue && { color: palette.danger }]}>
                    {overdue ? 'OVERDUE ' : ''}
                    {new Date(quest.dueDate).toLocaleDateString()}
                  </Text>
                )}
                {quest.estimatedMinutes && (
                  <Text style={styles.dueTxt}>~{quest.estimatedMinutes}m</Text>
                )}
                {quest.difficulty && (
                  <Text style={[styles.diffTag, { color: priorityColor[quest.priority] }]}>
                    {quest.difficulty.toUpperCase()}
                  </Text>
                )}
                {quest.tags?.slice(0, 2).map((t) => (
                  <AnimeTag key={t.id} label={t.name} color={t.color} />
                ))}
              </View>
            </View>
            {!quest.completed ? (
              <Pressable
                onPress={onComplete}
                hitSlop={6}
                style={({ pressed }) => [styles.completeBtn, pressed && { opacity: 0.7 }]}>
                <Ionicons name="checkmark-circle" size={28} color="#4ade80" />
              </Pressable>
            ) : (
              <Pressable onPress={onDelete} hitSlop={6} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                <Ionicons name="trash" size={22} color={palette.danger} />
              </Pressable>
            )}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', borderRadius: 12 },
  content: { borderRadius: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 10,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qTitle: { color: palette.text, fontWeight: '700', fontSize: 14, flex: 1 },
  strike: { textDecorationLine: 'line-through', color: palette.textMuted },
  qMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, alignItems: 'center' },
  dailyTag: {
    color: '#e879f9',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    backgroundColor: '#e879f922',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  dueTxt: { color: palette.textMuted, fontSize: 11, fontWeight: '700' },
  completeBtn: { padding: 4 },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  progressBg: {
    flex: 1,
    height: 4,
    backgroundColor: palette.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressTxt: { color: palette.textMuted, fontSize: 10, fontWeight: '800' },
  leftAction: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  rightAction: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  actionBtn: { alignItems: 'center', gap: 2 },
  actionLabel: { color: '#0b0b14', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});
