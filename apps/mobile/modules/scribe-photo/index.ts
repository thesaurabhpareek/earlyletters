/**
 * Local Expo module `ScribePhoto` (iOS). Optional: absent in Expo Go, on web and on Android until an implementation
 * lands, so every caller must handle null (src/lib/photos/baker.ts does).
 * Two functions, each writing only to the destination file uri JavaScript builds (src/lib/photos/files.ts), so the
 * file JavaScript reads is exactly the one the native side wrote. No network, no permission, no photo library.
 * A failure rejects with one closed `code` and no path: "photo_pick_failed" or "photo_reencode_failed".
 */
import { requireOptionalNativeModule } from 'expo';

export interface ScribePhotoNative {
  /**
   * Apple's system photo picker (PHPickerViewController with no photo library: no permission, nothing read but the
   * one picture chosen). Copies the picked still to `destination` (inside Caches/ImagePicker) and resolves it, or
   * resolves null on Cancel.
   */
  pickOne(destination: string): Promise<string | null>;
  /** Writes an upright, metadata-free JPEG of `source` to `destination` (inside Caches/ScribePhoto) and resolves it. */
  reencodeUpright(source: string, destination: string): Promise<string>;
}

export const ScribePhoto = requireOptionalNativeModule<ScribePhotoNative>('ScribePhoto');
