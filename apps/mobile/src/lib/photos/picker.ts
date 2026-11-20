/**
 * The system picker port (types.ts PhotoPicker) over scribe-photo's pickOne: Apple's PHPickerViewController made with no
 * photo library, so no permission is asked and nothing is read but the one picture the parent chose (NS-01-R2, R22).
 * No picker package is used: this is the one file that calls pickOne:
 * - the native side copies the picked still into the destination built here (Caches/ImagePicker), and the result is
 *   cut down to `{ uri }`;
 * - Cancel is `cancelled` (so is the picker going away by navigation, which scribe-photo answers with null); a failure
 *   crosses as the closed code `failed` and the native error text is dropped;
 * - an answer naming any file but that destination is a failure, never read.
 * One pick at a time: a second `open` while one runs answers `cancelled` at once and opens nothing. `cancel` ends the
 * wait at once (NS-01-R17). The native copy may still land afterwards (an iCloud-only picture keeps downloading), and
 * such a copy is removed, as is one that lands while the app lock is up: the parent picks again once it is open.
 * scribe-photo reports no download progress yet, so `onProgress` is never called.
 */
import type { ScribePhotoNative } from '../../../modules/scribe-photo';
import type { PhotoPicker, PickOutcome } from './types';

export interface PickerHooks {
  /** Removes a picked copy nobody will read. Never throws. */
  discard(uri: string): Promise<void>;
  /** The app lock is up. A check that throws counts as locked. */
  locked(): boolean;
}

export function createPhotoPicker(native: Pick<ScribePhotoNative, 'pickOne'>, destination: () => string, hooks: PickerHooks): PhotoPicker {
  let busy = false;
  return {
    open() {
      if (busy) return { done: Promise.resolve<PickOutcome>({ status: 'cancelled' }), cancel: () => {} };
      busy = true;
      let answer!: (o: PickOutcome) => void;
      const done = new Promise<PickOutcome>((resolve) => (answer = resolve));
      let answered = false;
      const settle = (o: PickOutcome): boolean => {
        if (answered) return false;
        answered = true;
        busy = false;
        answer(o);
        return true;
      };
      void (async () => {
        let out: string;
        let uri: string | null;
        try {
          out = destination();
          uri = await native.pickOne(out);
        } catch {
          settle({ status: 'failed' });
          return;
        }
        if (uri === null) settle({ status: 'cancelled' });
        else if (uri !== out) settle({ status: 'failed' });
        else if (lockedNow(hooks) || !settle({ status: 'picked', asset: { uri } })) {
          settle({ status: 'cancelled' });
          await hooks.discard(uri);
        }
      })();
      return { done, cancel: () => void settle({ status: 'cancelled' }) };
    },
  };
}

function lockedNow(hooks: PickerHooks): boolean {
  try {
    return hooks.locked();
  } catch {
    return true;
  }
}
