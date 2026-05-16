import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/store/useAppStore';
import { notifyAchievement } from '@/lib/notifications';

// ── Sound (optional) ─────────────────────────────────────────────────────
//
// To enable an XP chime / level-up sound:
//   1) Drop short sound files into `assets/sounds/xp.mp3` and
//      `assets/sounds/level-up.mp3` (~ 0.4–0.8s).
//   2) Inside `app/_layout.tsx`, import and call:
//        import { registerCelebrationSounds } from '@/lib/celebrate';
//        registerCelebrationSounds({
//          xp:    require('@/assets/sounds/xp.mp3'),
//          level: require('@/assets/sounds/level-up.mp3'),
//        });
//
// Without registration, celebrations still fire the popup, confetti, and
// haptic pattern — they just stay silent.

interface SoundAssets {
  xp?: any;
  level?: any;
}

let registeredAssets: SoundAssets = {};
let cachedXpSound: any = null;
let audioConfigured = false;

export const registerCelebrationSounds = (assets: SoundAssets) => {
  registeredAssets = assets;
};

const ensureAudioMode = async (Audio: any) => {
  if (audioConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    audioConfigured = true;
  } catch {}
};

const playXpSound = async () => {
  if (!registeredAssets.xp) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Audio } = require('expo-av');
    await ensureAudioMode(Audio);
    if (!cachedXpSound) {
      const { sound } = await Audio.Sound.createAsync(registeredAssets.xp, { volume: 0.6 });
      cachedXpSound = sound;
    }
    await cachedXpSound.replayAsync();
  } catch {
    /* silent fallback */
  }
};

const playLevelSound = async () => {
  const asset = registeredAssets.level ?? registeredAssets.xp;
  if (!asset) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Audio } = require('expo-av');
    await ensureAudioMode(Audio);
    const { sound } = await Audio.Sound.createAsync(asset, { volume: 0.75 });
    await sound.playAsync();
    setTimeout(() => sound.unloadAsync().catch(() => {}), 2500);
  } catch {}
};

// ── Haptic patterns ──────────────────────────────────────────────────────

const xpBurst = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 90);
  } catch {}
};

const milestoneBurst = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 120);
  } catch {}
};

const levelBurst = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 100);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 240);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 380);
  } catch {}
};

// ── Public API ────────────────────────────────────────────────────────────

export type CelebrateLevel = 'micro' | 'normal' | 'big' | 'epic';

// Streak milestone tiers. 7/14 are "big" (single confetti burst), 30/60/100 are "epic"
// (double burst). Return null for non-milestone counts so callers can skip celebration.
export const streakMilestoneLevel = (count: number | undefined | null): CelebrateLevel | null => {
  if (!count) return null;
  if (count === 30 || count === 60 || count === 100) return 'epic';
  if (count === 7 || count === 14) return 'big';
  return null;
};

export interface CelebrateOptions {
  xp?: number;
  label?: string;
  level?: CelebrateLevel;
}

/**
 * Fires the full celebration stack for an XP-earning action:
 * - centered XP popup
 * - confetti burst
 * - tactile haptic pattern
 * - optional XP chime (only if a sound asset was registered)
 */
export const celebrate = ({ xp, label, level = 'normal' }: CelebrateOptions = {}) => {
  const store = useAppStore.getState();

  if (xp && xp > 0) store.pushPopup(xp, label);

  if (level === 'micro') {
    Haptics.selectionAsync().catch(() => {});
    return;
  }

  if (level === 'epic') {
    levelBurst();
    playLevelSound();
    store.triggerConfetti();
    setTimeout(() => store.triggerConfetti(), 500);
    // True milestones get a local notification so backgrounded users still know.
    if (label) {
      void notifyAchievement({
        title: label,
        body: xp && xp > 0 ? `+${xp} XP earned` : 'Milestone reached',
      });
    }
    return;
  }

  if (level === 'big') {
    milestoneBurst();
    playXpSound();
    store.triggerConfetti();
    return;
  }

  // normal
  xpBurst();
  playXpSound();
  store.triggerConfetti();
};
