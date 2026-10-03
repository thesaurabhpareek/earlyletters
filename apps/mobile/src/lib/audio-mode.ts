/**
 * The app owns one audio session (SOUND.md 5). Leaving recording or playback
 * always restores idle, so nonessential sound respects the silent switch.
 */
import { setAudioModeAsync } from 'expo-audio';

export type AudioModeName = 'idle' | 'recording' | 'playback';

let current: AudioModeName = 'idle';

export function getAudioMode(): AudioModeName {
  return current;
}

export async function setAudioMode(mode: AudioModeName): Promise<void> {
  current = mode;
  const base = { shouldPlayInBackground: false, interruptionMode: 'mixWithOthers' as const };
  if (mode === 'recording') {
    // doNotMix: other apps pause while a parent records (their voice is the take).
    await setAudioModeAsync({ ...base, interruptionMode: 'doNotMix', allowsRecording: true, playsInSilentMode: true });
  } else if (mode === 'playback') {
    await setAudioModeAsync({ ...base, interruptionMode: 'doNotMix', allowsRecording: false, playsInSilentMode: true });
  } else {
    await setAudioModeAsync({ ...base, allowsRecording: false, playsInSilentMode: false });
  }
}
