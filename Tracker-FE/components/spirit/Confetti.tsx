import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const COLORS = ['#16a34a', '#22c55e', '#fbbf24', '#f97316', '#22d3ee', '#a78bfa', '#f43f5e'];

interface PieceConfig {
  startX: number;
  delay: number;
  driftX: number;
  driftY: number;
  rot: number;
  size: number;
  color: string;
  shape: 'square' | 'circle';
  duration: number;
}

function Piece({ cfg, onDone }: { cfg: PieceConfig; onDone: () => void }) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(cfg.delay, withTiming(1, { duration: 80 }));
    x.value = withDelay(cfg.delay, withTiming(cfg.driftX, { duration: cfg.duration, easing: Easing.out(Easing.quad) }));
    y.value = withDelay(
      cfg.delay,
      withSequence(
        withTiming(cfg.driftY - 60, { duration: cfg.duration * 0.35, easing: Easing.out(Easing.quad) }),
        withTiming(cfg.driftY, { duration: cfg.duration * 0.65, easing: Easing.in(Easing.quad) }, (done) => {
          if (done) runOnJS(onDone)();
        }),
      ),
    );
    rotate.value = withDelay(
      cfg.delay,
      withTiming(cfg.rot, { duration: cfg.duration, easing: Easing.linear }),
    );
    opacity.value = withDelay(
      cfg.delay + cfg.duration * 0.7,
      withTiming(0, { duration: cfg.duration * 0.3 }),
    );
  }, [cfg, onDone, opacity, rotate, x, y]);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          left: cfg.startX,
          width: cfg.size,
          height: cfg.size,
          backgroundColor: cfg.color,
          borderRadius: cfg.shape === 'circle' ? cfg.size : 2,
        },
        aStyle,
      ]}
    />
  );
}

interface Props {
  active: boolean;
  onComplete?: () => void;
  origin?: 'top' | 'center';
  count?: number;
}

export function Confetti({ active, onComplete, origin = 'top', count = 36 }: Props) {
  const [tick, setTick] = React.useState(0);

  useEffect(() => {
    if (active) setTick((n) => n + 1);
  }, [active]);

  const pieces = useMemo(() => {
    const w = Dimensions.get('window').width;
    const h = Dimensions.get('window').height;
    return Array.from({ length: count }, (): PieceConfig => {
      const startX = Math.random() * w;
      const driftX = (Math.random() - 0.5) * w * 0.6;
      const driftY = origin === 'top' ? h * 0.6 + Math.random() * 100 : h * 0.4;
      return {
        startX,
        delay: Math.floor(Math.random() * 200),
        driftX,
        driftY,
        rot: (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 540),
        size: 6 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.random() < 0.4 ? 'circle' : 'square',
        duration: 1400 + Math.random() * 1100,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const completedRef = React.useRef(0);
  const onPieceDone = () => {
    completedRef.current += 1;
    if (completedRef.current >= pieces.length) {
      completedRef.current = 0;
      onComplete?.();
    }
  };

  if (!active && tick === 0) return null;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { top: origin === 'top' ? 0 : '20%' }]}>
      {pieces.map((cfg, i) => (
        <Piece key={`${tick}-${i}`} cfg={cfg} onDone={onPieceDone} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
});
