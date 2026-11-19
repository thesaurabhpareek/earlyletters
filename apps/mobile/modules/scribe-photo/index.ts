/**
 * Local Expo module `ScribePhoto` (iOS). Optional: absent in Expo Go, on web and on Android until an implementation
 * lands, so every caller must handle null (src/lib/photos/baker.ts does). One function: an upright, metadata-free JPEG
 * from one picked photo, through ImageIO. No network, no permission, no photo library.
 */
import { requireOptionalNativeModule } from 'expo';

export interface ScribePhotoNative {
  /** file:// uri of a JPEG in Caches/ScribePhoto. The caller reads it and removes it. Rejects with `photo_reencode_failed`. */
  reencodeUpright(uri: string): Promise<string>;
}

export const ScribePhoto = requireOptionalNativeModule<ScribePhotoNative>('ScribePhoto');
