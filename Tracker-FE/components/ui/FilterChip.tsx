import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { glass, palette } from '@/lib/themes';

interface Props {
  label: string;
  active: boolean;
  color: string;
  options?: string[];
  value?: string;
  onPick?: (v: string | undefined) => void;
  pickerTitle?: string;
  onPress?: () => void;
}

// Sheet-backed filter chip. Replaces the broken absolute-positioned dropdowns
// that get clipped by horizontal ScrollViews. Mirrors the pattern in
// `components/workout/ExercisePicker.tsx::Chip`.
export function FilterChip({
  label,
  active,
  color,
  options,
  value,
  onPick,
  pickerTitle,
  onPress,
}: Props) {
  const [open, setOpen] = useState(false);
  const hasMenu = !!options && !!onPick;
  return (
    <>
      <Pressable
        onPress={hasMenu ? () => setOpen(true) : onPress}
        style={[styles.chip, active && { borderColor: color, backgroundColor: color + '33' }]}>
        <Text style={[styles.chipText, active && { color }]} numberOfLines={1}>
          {label}
        </Text>
        {hasMenu && (
          <Ionicons name="chevron-down" size={14} color={active ? color : palette.textMuted} />
        )}
      </Pressable>
      {hasMenu && (
        <BottomSheet visible={open} onClose={() => setOpen(false)} title={pickerTitle ?? 'Select'}>
          <ScrollView style={{ maxHeight: 420 }}>
            {[undefined, ...options!].map((opt, idx) => {
              const selected = value === opt;
              const txt = opt ?? 'All';
              return (
                <Pressable
                  key={idx}
                  onPress={() => {
                    onPick!(opt);
                    setOpen(false);
                  }}
                  style={[styles.menuRow, selected && { backgroundColor: color + '22' }]}>
                  <Text style={[styles.menuText, selected && { color }]}>{txt}</Text>
                  {selected && <Ionicons name="checkmark" size={18} color={color} />}
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={{ height: 12 }} />
        </BottomSheet>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: glass.borderStrong,
    backgroundColor: palette.bgElevated,
    marginRight: 6,
  },
  chipText: { color: palette.text, fontWeight: '700', fontSize: 13 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 10,
    marginVertical: 2,
  },
  menuText: { color: palette.text, fontWeight: '600', fontSize: 15 },
});
