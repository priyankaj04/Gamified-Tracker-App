import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { palette } from '@/lib/themes';
import { useQuestTemplates, useUseTemplate } from '@/hooks/useQuests';

interface Props {
  accent: string;
  onNewQuest: () => void;
  onQuickAdd?: () => void;
}

export function FabSpeedDial({ accent, onNewQuest, onQuickAdd }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const templatesQ = useQuestTemplates();
  const useTemplate = useUseTemplate();

  const templates = templatesQ.data ?? [];

  return (
    <>
      {open && (
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={() => setOpen(false)}
        />
      )}
      <View style={styles.host}>
        {open && (
          <View style={styles.actions}>
            {templates.slice(0, 4).map((t) => (
              <Pressable
                key={t.id}
                onPress={async () => {
                  setOpen(false);
                  await useTemplate.mutateAsync(t.id);
                }}
                style={[styles.action, { borderColor: accent + '66', backgroundColor: palette.card }]}>
                <Ionicons name="bookmark" size={16} color={accent} />
                <Text style={styles.actionTxt} numberOfLines={1}>
                  {t.name}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                setOpen(false);
                router.push('/quest/templates');
              }}
              style={[styles.action, { borderColor: accent + '66', backgroundColor: palette.card }]}>
              <Ionicons name="albums" size={16} color={accent} />
              <Text style={styles.actionTxt}>Manage Templates</Text>
            </Pressable>
            {onQuickAdd && (
              <Pressable
                onPress={() => {
                  setOpen(false);
                  onQuickAdd();
                }}
                style={[styles.action, { borderColor: accent + '66', backgroundColor: palette.card }]}>
                <Ionicons name="flash" size={16} color={accent} />
                <Text style={styles.actionTxt}>Quick Add</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                setOpen(false);
                onNewQuest();
              }}
              style={[styles.action, { borderColor: accent, backgroundColor: accent + '33' }]}>
              <Ionicons name="add" size={16} color={accent} />
              <Text style={[styles.actionTxt, { color: accent, fontWeight: '900' }]}>New Quest</Text>
            </Pressable>
          </View>
        )}
        <Pressable
          onLongPress={() => setOpen(true)}
          onPress={() => {
            if (open) setOpen(false);
            else onNewQuest();
          }}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: accent, shadowColor: accent },
            pressed && { opacity: 0.85 },
          ]}>
          <Ionicons name={open ? 'close' : 'add'} size={28} color="#0b0b14" />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', bottom: 24, right: 20, alignItems: 'flex-end', gap: 8 },
  actions: { gap: 8, alignItems: 'flex-end' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 240,
  },
  actionTxt: { color: palette.text, fontSize: 13, fontWeight: '700' },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
});
