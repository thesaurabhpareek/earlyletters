/** Home's photo start: whether it draws, and what a tap does. The tap opens the system picker and nothing else. */
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { getPending, getPhotoPicker } from './registry';
import { photoStartShows } from './start-shows';
import { runPick } from './session';
import { useRegisteredPhotoDevice } from './use-registered';

/** `onPicked` runs only for a chosen picture; Cancel returns to Home untouched. */
export function usePhotoStart(onPicked: () => void): { show: boolean; failed: boolean; start: () => void } {
  const registered = useRegisteredPhotoDevice(); // after mount, never in the render body
  const [failed, setFailed] = useState(false);
  const running = useRef(false); // one pick at a time: a second tap while the picker is up does nothing
  // Back on Home means the picture was left behind (a swipe back from Ready, say): nothing carries over to the next letter.
  useFocusEffect(
    useCallback(() => {
      void getPending()?.discard();
    }, []),
  );
  const start = useCallback(() => {
    const picker = getPhotoPicker();
    if (!picker || running.current) return;
    running.current = true;
    setFailed(false);
    void runPick(picker)
      .done.then(async (r) => {
        if (r.status === 'picked') {
          await getPending()?.set(r.asset);
          onPicked();
        } else if (r.status === 'failed') setFailed(true);
      })
      .catch(() => setFailed(true)) // a picture that cannot be held is a calm line, never an uncaught error
      .finally(() => {
        running.current = false;
      });
  }, [onPicked]);
  return { show: registered && photoStartShows(), failed, start };
}
