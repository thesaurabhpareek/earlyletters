/**
 * Keeps the screen on while a take is being recorded or a book is being read aloud, and gives it back
 * the moment that ends (unmount, pause, finish). The phone sleeping mid-letter would stop the recording
 * and the playback with it. expo-keep-awake is already a dependency (the export screen uses it).
 *
 * `useKeepAwakeWhile(active, tag)`: holds while `active` is true; always released on unmount.
 * Failures are swallowed: if the OS refuses, nothing else may change. Nothing here logs.
 */
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';

export const KEEP_AWAKE_TAGS = { listen: 'scribe-listen', readTogether: 'scribe-read-together' } as const;

export function useKeepAwakeWhile(active: boolean, tag: string): void {
  useEffect(() => {
    if (!active) return;
    void activateKeepAwakeAsync(tag).catch(() => {});
    return () => {
      void deactivateKeepAwake(tag).catch(() => {});
    };
  }, [active, tag]);
}
