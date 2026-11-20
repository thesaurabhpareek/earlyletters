/**
 * The system picker port (types.ts PhotoPicker) over scribe-photo's pickOne: Apple's PHPickerViewController made with no
 * photo library, so no permission is asked and nothing is read but the one picture the parent chose (NS-01-R2, R22).
 * No picker package is used: this is the one file that calls pickOne:
 * - the native side copies the picked still into the destination built here (Caches/ImagePicker), and the result is
 *   cut down to `{ uri }`;
 * - Cancel is `cancelled`; a failure crosses as the closed code `failed` and the native error text is dropped;
 * - an answer naming any file but that destination is a failure, never read.
 * A Live Photo gives its still. An iCloud-only picture downloads inside Apple's own sheet, which shows the wait, so
 * `onProgress` is never called and `cancel` only stops the app waiting.
 */
import type { ScribePhotoNative } from '../../../modules/scribe-photo';
import type { PhotoPicker, PickOutcome } from './types';

export function createPhotoPicker(native: Pick<ScribePhotoNative, 'pickOne'>, destination: () => string): PhotoPicker {
  return {
    open() {
      let stopped = false;
      const done = (async (): Promise<PickOutcome> => {
        try {
          const out = destination();
          const uri = await native.pickOne(out);
          if (stopped || uri === null) return { status: 'cancelled' };
          return uri === out ? { status: 'picked', asset: { uri } } : { status: 'failed' };
        } catch {
          return { status: 'failed' };
        }
      })();
      return { done, cancel: () => void (stopped = true) };
    },
  };
}
