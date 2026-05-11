import React, { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette, screenTheme , spiritText } from '@/lib/themes';
import { ThemedScene } from '@/components/layout/ThemedScene';
import { SpiritHeader } from '@/components/spirit/SpiritHeader';
import { SectionTitle } from '@/components/layout/SectionTitle';
import { EmptyState } from '@/components/layout/EmptyState';
import { useMeasurementCompare, useMeasurements } from '@/hooks/useSpirit';

const FIELDS: { key: string; label: string }[] = [
  { key: 'chestCm', label: 'Chest' },
  { key: 'waistCm', label: 'Waist' },
  { key: 'hipsCm', label: 'Hips' },
  { key: 'bicepsCm', label: 'Biceps' },
  { key: 'thighsCm', label: 'Thighs' },
  { key: 'neckCm', label: 'Neck' },
  { key: 'shouldersCm', label: 'Shoulders' },
  { key: 'calvesCm', label: 'Calves' },
  { key: 'forearmsCm', label: 'Forearms' },
];

export default function CompareScreen() {
  const accent = screenTheme.spirit.accent;
  const all = useMeasurements();

  const dates = useMemo(() => (all.data ?? []).map((m) => m.date), [all.data]);

  const [date1, setDate1] = useState<string | null>(null);
  const [date2, setDate2] = useState<string | null>(null);

  // default to most-recent and earliest once data loads
  React.useEffect(() => {
    if (!date1 && dates.length >= 2) {
      setDate1(dates[dates.length - 1]);
      setDate2(dates[0]);
    }
  }, [dates, date1]);

  const cmp = useMeasurementCompare(date1, date2);

  if (!all.data || all.data.length < 2) {
    return (
      <ThemedScene scene="spirit">
        <View style={{ padding: 20 }}>
          <EmptyState
            icon="git-compare"
            title="Need at least 2 entries"
            message="Log measurements on different dates to compare changes."
            accent={accent}
          />
        </View>
      </ThemedScene>
    );
  }

  return (
    <ThemedScene scene="spirit">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <SpiritHeader title="Compare" subtitle="Two-date diff" accent={accent} back compact />

        <View style={styles.pickRow}>
          <DatePill label="From" value={date1} dates={dates} onChange={setDate1} accent={accent} />
          <Ionicons name="arrow-forward" size={18} color={spiritText.secondary} />
          <DatePill label="To" value={date2} dates={dates} onChange={setDate2} accent={accent} />
        </View>

        {cmp.data && (
          <>
            <SectionTitle title="Comparison" accent={accent} />
            <View style={styles.tableHead}>
              <Text style={[styles.cell, styles.hCell]}></Text>
              <Text style={[styles.cell, styles.hCell, { textAlign: 'right' }]}>{date1?.slice(5)}</Text>
              <Text style={[styles.cell, styles.hCell, { textAlign: 'right' }]}>{date2?.slice(5)}</Text>
              <Text style={[styles.cell, styles.hCell, { textAlign: 'right' }]}>Δ</Text>
            </View>
            <View style={{ paddingHorizontal: 20, gap: 4 }}>
              {FIELDS.map((f) => {
                const aVal = (cmp.data?.a as any)?.[f.key];
                const bVal = (cmp.data?.b as any)?.[f.key];
                const delta = cmp.data?.delta?.[f.key];
                const deltaColor =
                  delta == null
                    ? spiritText.secondary
                    : delta < 0
                    ? palette.success
                    : delta > 0
                    ? palette.danger
                    : spiritText.secondary;
                return (
                  <View key={f.key} style={styles.row}>
                    <Text style={[styles.cell, styles.labelCell]}>{f.label}</Text>
                    <Text style={[styles.cell, styles.valCell]}>{aVal ?? '—'}</Text>
                    <Text style={[styles.cell, styles.valCell]}>{bVal ?? '—'}</Text>
                    <View style={[styles.cell, { alignItems: 'flex-end' }]}>
                      {delta != null && delta !== 0 ? (
                        <View style={[styles.deltaPill, { backgroundColor: deltaColor + '22' }]}>
                          <Ionicons
                            name={delta < 0 ? 'arrow-down' : 'arrow-up'}
                            size={10}
                            color={deltaColor}
                          />
                          <Text style={[styles.deltaText, { color: deltaColor }]}>{Math.abs(delta).toFixed(1)}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.cell, { color: spiritText.tertiary }]}>—</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </ThemedScene>
  );
}

function DatePill({
  label,
  value,
  dates,
  onChange,
  accent,
}: {
  label: string;
  value: string | null;
  dates: string[];
  onChange: (d: string) => void;
  accent: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => [
          styles.pill,
          { borderColor: open ? accent : palette.border },
          pressed && { opacity: 0.85 },
        ]}>
        <Text style={[styles.pillVal, { color: value ? palette.text : spiritText.tertiary }]}>
          {value ?? 'pick date'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={spiritText.secondary} />
      </Pressable>
      {open && (
        <View style={styles.dropdown}>
          {dates.slice(0, 12).map((d) => (
            <Pressable
              key={d}
              onPress={() => {
                onChange(d);
                setOpen(false);
              }}
              style={({ pressed }) => [
                styles.dropdownRow,
                value === d && { backgroundColor: accent + '22' },
                pressed && { opacity: 0.85 },
              ]}>
              <Text style={[styles.dropdownLabel, value === d && { color: accent }]}>{d}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pickRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  pillLabel: {
    color: spiritText.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: palette.card,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  pillVal: { color: palette.text, fontWeight: '800', fontSize: 13, flex: 1 },
  dropdown: {
    marginTop: 4,
    backgroundColor: palette.bgElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  dropdownRow: { paddingHorizontal: 12, paddingVertical: 10 },
  dropdownLabel: { color: palette.text, fontSize: 13, fontWeight: '700' },
  tableHead: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  hCell: {
    color: spiritText.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cell: { flex: 1, color: palette.text, fontSize: 13 },
  labelCell: { fontWeight: '800', color: palette.text },
  valCell: { textAlign: 'right', color: palette.text, fontWeight: '800' },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  deltaText: { fontSize: 11, fontWeight: '900' },
});
