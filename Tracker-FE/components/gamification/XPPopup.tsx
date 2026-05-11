import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useAppStore, type XpPopup } from '@/store/useAppStore';

function PopupItem({ popup, index }: { popup: XpPopup; index: number }) {
  const opacity = useSharedValue(0);
  const translate = useSharedValue(20);
  const dismiss = useAppStore((s) => s.dismissPopup);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    translate.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) });

    opacity.value = withDelay(
      1400,
      withSequence(
        withTiming(0, { duration: 400 }, (finished) => {
          if (finished) runOnJS(dismiss)(popup.id);
        }),
      ),
    );
    translate.value = withDelay(1400, withTiming(-30, { duration: 400 }));
  }, [opacity, translate, popup.id, dismiss]);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translate.value }],
  }));

  return (
    <Animated.View style={[styles.popup, aStyle, { top: 80 + index * 56 }]}>
      <Text style={styles.popupText}>
        +{popup.amount} XP ⚡{popup.label ? `  ${popup.label}` : ''}
      </Text>
    </Animated.View>
  );
}

export function XPPopupHost() {
  const popups = useAppStore((s) => s.popups);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {popups.map((p, i) => (
        <PopupItem key={p.id} popup={p} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#a78bfa',
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  popupText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.4 },
});
