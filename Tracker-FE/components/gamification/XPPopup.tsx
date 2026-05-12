import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useAppStore, type XpPopup } from '@/store/useAppStore';

const { height: H } = Dimensions.get('window');

function PopupItem({ popup, index }: { popup: XpPopup; index: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);
  const translate = useSharedValue(0);
  const haloOpacity = useSharedValue(0);
  const dismiss = useAppStore((s) => s.dismissPopup);

  useEffect(() => {
    // Pop in: spring scale + fade
    opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
    scale.value = withSpring(1, { damping: 9, stiffness: 200, mass: 0.7 });
    haloOpacity.value = withTiming(1, { duration: 320 });

    // Hold for ~1.4s then float up + fade
    opacity.value = withDelay(
      1400,
      withSequence(
        withTiming(0, { duration: 460, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) runOnJS(dismiss)(popup.id);
        }),
      ),
    );
    translate.value = withDelay(
      1400,
      withTiming(-60, { duration: 460, easing: Easing.in(Easing.quad) }),
    );
    haloOpacity.value = withDelay(1400, withTiming(0, { duration: 460 }));
  }, [opacity, scale, translate, haloOpacity, popup.id, dismiss]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translate.value }],
  }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: haloOpacity.value * 0.6,
    transform: [{ scale: scale.value * 1.3 }, { translateY: translate.value }],
  }));

  // Stack subsequent popups slightly above each other
  const offsetY = H / 2 - 90 - index * 72;

  return (
    <>
      <Animated.View style={[styles.halo, { top: offsetY - 30 }, haloStyle]}>
        <LinearGradient
          colors={['rgba(167, 139, 250, 0.55)', 'rgba(167, 139, 250, 0)']}
          style={styles.haloGradient}
        />
      </Animated.View>
      <Animated.View style={[styles.card, { top: offsetY }, cardStyle]}>
        <LinearGradient
          colors={['#a78bfa', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.row}>
          <Text style={styles.bolt}>⚡</Text>
          <Text style={styles.amount}>+{popup.amount}</Text>
          <Text style={styles.unit}>XP</Text>
        </View>
        {popup.label && <Text style={styles.label}>{popup.label}</Text>}
      </Animated.View>
    </>
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
  halo: {
    position: 'absolute',
    alignSelf: 'center',
    width: 280,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloGradient: { width: '100%', height: '100%', borderRadius: 140 },
  card: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderRadius: 24,
    minWidth: 200,
    overflow: 'hidden',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#a78bfa',
    shadowOpacity: 0.65,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  bolt: { fontSize: 22, marginRight: 2 },
  amount: {
    color: '#ffffff',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 2 },
  },
  unit: { color: 'rgba(255,255,255,0.85)', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  label: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
