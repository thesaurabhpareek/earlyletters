/**
 * The recorder's state for Listen's clock (listen-meter.logic): read every CLOCK_MS, kept in React state only when
 * the shown second or the recorder's own state changes (clockChanged). About one re-render a second, never one per
 * level reading; the level goes to the aura on its own timer (listen.tsx). In place of expo-audio's
 * useAudioRecorderState, which sets state whenever the level moves 0.1 dB or the duration 50 ms.
 */
import type { AudioRecorder, RecorderState } from 'expo-audio';
import { useEffect, useState } from 'react';
import { CLOCK_MS, clockChanged } from './listen-meter.logic';

export function useRecorderClock(recorder: AudioRecorder, interval: number = CLOCK_MS): RecorderState {
  const [state, setState] = useState<RecorderState>(() => recorder.getStatus());
  useEffect(() => {
    const read = setInterval(() => {
      let next: RecorderState;
      try {
        next = recorder.getStatus();
      } catch {
        return; // released: the screen is going
      }
      setState((prev) => (clockChanged(prev, next) ? next : prev));
    }, interval);
    return () => clearInterval(read);
  }, [recorder, interval]);
  return state;
}
