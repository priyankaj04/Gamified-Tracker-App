import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { AppState, AppStateStatus } from 'react-native';

const BGM_SOURCE = require('../assets/sounds/ryoish-the-peoplex27s-land-336886.mp3');

let sound: Audio.Sound | null = null;
let loading = false;
let appStateSub: { remove: () => void } | null = null;
let currentVolume = 0.02;
let enabled = true;
let started = false;

async function configureAudioMode() {
  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
  });
}

async function ensureLoaded() {
  if (sound || loading) return;
  loading = true;
  try {
    await configureAudioMode();
    const { sound: created } = await Audio.Sound.createAsync(
      BGM_SOURCE,
      {
        isLooping: true,
        volume: enabled ? currentVolume : 0,
        shouldPlay: false,
      },
    );
    sound = created;
  } catch (err) {
    // Asset may be missing — fail silently so the app still runs.
    sound = null;
  } finally {
    loading = false;
  }
}

function onAppStateChange(state: AppStateStatus) {
  if (!sound) return;
  if (state === 'active' && enabled) {
    sound.playAsync().catch(() => {});
  } else {
    sound.pauseAsync().catch(() => {});
  }
}

export async function startBgm(opts?: { enabled?: boolean; volume?: number }) {
  if (opts?.enabled !== undefined) enabled = opts.enabled;
  if (opts?.volume !== undefined) currentVolume = opts.volume;

  await ensureLoaded();
  if (!sound) return;

  await sound.setVolumeAsync(enabled ? currentVolume : 0).catch(() => {});
  if (enabled) {
    await sound.playAsync().catch(() => {});
  }

  if (!started) {
    started = true;
    appStateSub = AppState.addEventListener('change', onAppStateChange);
  }
}

export async function setBgmEnabled(next: boolean) {
  enabled = next;
  if (!sound) {
    if (next) await startBgm({ enabled: true });
    return;
  }
  await sound.setVolumeAsync(next ? currentVolume : 0).catch(() => {});
  if (next) {
    await sound.playAsync().catch(() => {});
  } else {
    await sound.pauseAsync().catch(() => {});
  }
}

export async function setBgmVolume(v: number) {
  currentVolume = Math.max(0, Math.min(1, v));
  if (sound && enabled) {
    await sound.setVolumeAsync(currentVolume).catch(() => {});
  }
}

export async function stopBgm() {
  if (appStateSub) {
    appStateSub.remove();
    appStateSub = null;
  }
  started = false;
  if (sound) {
    try {
      await sound.stopAsync();
      await sound.unloadAsync();
    } catch {}
    sound = null;
  }
}
