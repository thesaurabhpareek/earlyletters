/**
 * Local Expo module `ScribePhoto` (iOS). Optional: absent in Expo Go, on web and on Android until an implementation
 * lands, so every caller must handle null (src/lib/photos/baker.ts does).
 * Two functions, each writing only to the destination file uri JavaScript gives, so the file JavaScript reads is
 * exactly the one the native side wrote. The native side accepts only a plain file name directly inside its Caches
 * folder (ImagePicker or ScribePhoto) and refuses any other path. No network, no photo library, and no photo-library
 * or camera permission request. A failure rejects with one closed `code` and no path: "photo_pick_failed" or
 * "photo_reencode_failed". One picker is open at a time; the copy that follows a pick is not covered, so two copies
 * can run at once, each to its own name.
 */
import { requireOptionalNativeModule } from 'expo';

export interface ScribePhotoNative {
  /**
   * Apple's system photo picker (PHPickerViewController with no photo library: no permission, nothing read but the
   * one picture chosen). Copies the picked still to `destination` (inside Caches/ImagePicker) and resolves it, or
   * resolves null on Cancel or when the picker goes away without a pick. Rejects at once while another picker is open.
   */
  pickOne(destination: string): Promise<string | null>;
  /** Writes an upright, metadata-free JPEG of `source` to `destination` (inside Caches/ScribePhoto) and resolves it. */
  reencodeUpright(source: string, destination: string): Promise<string>;
}

export const ScribePhoto = requireOptionalNativeModule<ScribePhotoNative>('ScribePhoto');
