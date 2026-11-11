/**
 * The ONE file that imports expo-image-picker (NX-39-R52 review of 57.0.20, conditions C5 and C6). Apple's system
 * photo picker (PHPicker) through the package, and nothing else:
 * - the only call is `launchImageLibraryAsync` with fixed options: images, one, no editing, no Exif, no base64.
 *   `allowsEditing: true` would switch the package to its old picker, which reads the photo library and needs
 *   permission; so it is fixed to false and a test pins it;
 * - no permission function, no camera, no media library is ever named in the app (an AST scan pins that);
 * - the result is cut down to `{ uri }`. `assetId`, `fileName`, `exif`, `base64`, `width`, `height`, `fileSize`,
 *   `mimeType` and a Live Photo's `pairedVideoUri` are never read, kept, logged or stored;
 * - a failure crosses as the closed code `failed`. The package's error text can hold file paths, so it is dropped.
 * The package has no progress callback and no cancel for an iCloud-only photo (review section 6, Q4): `onProgress` is
 * never called and `cancel` only stops the app waiting; Apple's own sheet shows the wait.
 */
import * as ImagePicker from 'expo-image-picker';
import type { PhotoPicker, PickOutcome } from './types';

export function createPhotoPicker(api: Pick<typeof ImagePicker, 'launchImageLibraryAsync'> = ImagePicker): PhotoPicker {
  return {
    open() {
      let stopped = false;
      const done = (async (): Promise<PickOutcome> => {
        try {
          const r = await api.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, allowsEditing: false, exif: false, base64: false });
          if (stopped || r.canceled) return { status: 'cancelled' };
          const uri = r.assets?.[0]?.uri;
          return typeof uri === 'string' && uri.length > 0 ? { status: 'picked', asset: { uri } } : { status: 'failed' };
        } catch {
          return { status: 'failed' };
        }
      })();
      return { done, cancel: () => void (stopped = true) };
    },
  };
}
