import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ScreenKey } from '@/lib/themes';

// Static require map — Metro must see literal paths at bundle time.
// Drop your own anime MC images at these paths to replace the generated ones.
const SCENES: Record<ScreenKey, ImageSource> = {
  dashboard: require('@/assets/backgrounds/dashboard.jpeg'),
  dojo:      require('@/assets/backgrounds/dojo.jpeg'),
  forge:     require('@/assets/backgrounds/forge.png'),
  spirit:    require('@/assets/backgrounds/spirit.jpeg'),
  vault:     require('@/assets/backgrounds/vault.png'),
  quests:    require('@/assets/backgrounds/quests.webp'),
  hall:      require('@/assets/backgrounds/hall.png'),
};

interface Props {
  scene: ScreenKey;
  children: React.ReactNode;
  // dim controls how dark the readability overlay is (0 → 1)
  dim?: number;
  style?: StyleProp<ViewStyle>;
}

export function ThemedScene({ scene, children, dim = 0.55, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      <Image
        source={SCENES[scene]}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={scene}
        priority="normal"
      />
      <LinearGradient
        colors={[
          `rgba(7, 7, 16, ${Math.min(1, dim + 0.35)})`,
          `rgba(7, 7, 16, ${dim})`,
          `rgba(7, 7, 16, ${dim * 0.55})`,
          `rgba(7, 7, 16, ${dim * 0.25})`
        ]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={[
          `rgba(7, 7, 16, ${dim * 0.55})`,
          `rgba(7, 7, 16, ${dim * 0.25})`,
          `rgba(7, 7, 16, ${dim})`,
          `rgba(7, 7, 16, ${Math.min(1, dim + 0.35)})`,
        ]}
        locations={[0, 0.4, 0.75, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {children}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  body: { flex: 1 },
});
