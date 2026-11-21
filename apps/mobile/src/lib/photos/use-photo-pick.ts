/**
 * Opens Apple's system picker from Ready, Review or the letter page (NS-01-R7). Not Home's start (use-photo-start.ts is
 * the only one that may start a letter from a picture). The picture is handed to `onPicked` as `{ uri }`; the caller
 * owns what happens next, and the picker's temporary original is removed by whoever reads it (pending.ts, attach).
 */
import { useCallback, useRef, useState } from 'react';
import { getPhotoPicker } from './registry';
import { useRegisteredPhotoDevice } from './use-registered';
import { runPick } from './session';
import type { PickedAsset } from './types';

export function usePhotoPick(onPicked: (asset: PickedAsset) => void | Promise<void>): { ready: boolean; busy: boolean; failed: boolean; pick: () => void } {
  const registered = useRegisteredPhotoDevice(); // after mount, never in the render body
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const running = useRef(false);
  const pick = useCallback(() => {
    const picker = getPhotoPicker();
    if (!picker || running.current) return;
    running.current = true;
    setBusy(true);
    setFailed(false);
    void runPick(picker).done.then(async (r) => {
      try {
        if (r.status === 'picked') await onPicked(r.asset);
        else if (r.status === 'failed') setFailed(true);
      } finally {
        running.current = false;
        setBusy(false);
      }
    });
  }, [onPicked]);
  return { ready: registered && getPhotoPicker() !== null, busy, failed, pick };
}
