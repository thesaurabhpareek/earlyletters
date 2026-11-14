/** Home's photo start: whether it draws, and what a tap does. The tap opens the system picker and nothing else. */
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { photoSurfaces, photosBuildEnabled } from './flag';
import { registerPhotoDevice } from './device';
import { photosPausedNow } from './pause';
import { getPending, getPhotoPicker } from './registry';
import { runPick } from './session';

export function photoStartShows(paused = photosPausedNow()): boolean {
  return photoSurfaces({ build: photosBuildEnabled(), paused }).start && getPhotoPicker() !== null;
}

/** `onPicked` runs only for a chosen picture; Cancel returns to Home untouched. */
export function usePhotoStart(onPicked: () => void): { show: boolean; failed: boolean; start: () => void } {
  registerPhotoDevice(); // idempotent; does nothing when the photos switch is off
  const [failed, setFailed] = useState(false);
  // Back on Home means the picture was left behind (a swipe back from Ready, say): nothing carries over to the next letter.
  useFocusEffect(
    useCallback(() => {
      void getPending()?.discard();
    }, []),
  );
  const start = useCallback(() => {
    const picker = getPhotoPicker();
    if (!picker) return;
    setFailed(false);
    void runPick(picker).done.then((r) => {
      if (r.status === 'picked') {
        void getPending()?.set(r.asset).then(onPicked);
      } else if (r.status === 'failed') setFailed(true);
    });
  }, [onPicked]);
  return { show: photoStartShows(), failed, start };
}
