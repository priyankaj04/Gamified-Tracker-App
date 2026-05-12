import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { palette } from '@/lib/themes';

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  accent?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
}

const toISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const todayISO = () => toISO(new Date());

const parseISO = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date();
  date.setFullYear(y, (m || 1) - 1, d || 1);
  date.setHours(12, 0, 0, 0);
  return date;
};

const formatLabel = (iso: string) => {
  const today = todayISO();
  const d = parseISO(iso);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = toISO(y);
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  const tomorrow = toISO(tmr);
  if (iso === today) return `Today · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  if (iso === yesterday) return `Yesterday · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  if (iso === tomorrow) return `Tomorrow · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
};

export function CalendarPicker({
  value,
  onChange,
  accent = '#22d3ee',
  minimumDate,
  maximumDate,
  placeholder,
}: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const hasValue = !!value;

  const open = () => {
    const initial = value ? parseISO(value) : new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        is24Hour: true,
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toISO(date));
        },
      });
    } else {
      setIosOpen(true);
    }
  };

  return (
    <>
      <Pressable
        onPress={open}
        style={({ pressed }) => [
          styles.btn,
          { borderColor: accent + '88' },
          pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        ]}>
        <View style={[styles.iconWrap, { backgroundColor: accent + '33' }]}>
          <Ionicons name="calendar" size={14} color="#ffffff" />
        </View>
        <Text style={[styles.label, !hasValue && { color: palette.textDim }]}>
          {hasValue ? formatLabel(value) : placeholder ?? 'Select date'}
        </Text>
        <Ionicons name="chevron-down" size={14} color={palette.textMuted} />
      </Pressable>
      {Platform.OS === 'ios' && iosOpen && (
        <View style={styles.iosWrap}>
          <DateTimePicker
            value={value ? parseISO(value) : new Date()}
            mode="date"
            display="spinner"
            themeVariant="dark"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={(_event, date) => {
              if (date) onChange(toISO(date));
            }}
          />
          <Pressable
            onPress={() => setIosOpen(false)}
            style={[styles.doneBtn, { backgroundColor: accent }]}>
            <Text style={styles.doneLabel}>Done</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: palette.card,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: '#ffffff', fontSize: 14, fontWeight: '800', flex: 1 },
  iosWrap: {
    marginTop: 6,
    backgroundColor: palette.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 8,
  },
  doneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  doneLabel: { color: '#0b0b14', fontWeight: '900', fontSize: 13 },
});
