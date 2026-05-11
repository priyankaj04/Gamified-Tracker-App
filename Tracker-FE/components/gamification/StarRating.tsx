import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '@/lib/themes';

interface Props {
  value: number | null;
  onChange?: (n: number) => void;
  size?: number;
  color?: string;
  readOnly?: boolean;
}

export function StarRating({ value, onChange, size = 22, color = '#fbbf24', readOnly = false }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (value ?? 0) >= n;
        return (
          <Pressable
            key={n}
            disabled={readOnly}
            onPress={() => onChange?.(n)}
            hitSlop={6}
            style={{ paddingHorizontal: 2 }}>
            <Ionicons
              name={active ? 'star' : 'star-outline'}
              size={size}
              color={active ? color : palette.textDim}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
