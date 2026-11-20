/** Photo with a letter: shapes and the ports the logic runs against (tests use in-memory ones). */

/** Files on the phone. Paths are relative to the photos folder: `<mediaId>.jpg` (ADR 0028 D1). No entry id in the name. */
export interface PhotoFiles {
  write(path: string, bytes: Uint8Array): Promise<void>;
  remove(path: string): Promise<void>;
  /** Every path under the folder, for the wipe. */
  list(): Promise<string[]>;
  freeBytes(): Promise<number>;
}

/**
 * The native re-encode that turns a picture's pixels upright (ImageIO). Exif is dropped from the stored copy, so a
 * picture whose orientation tag is not 1 is only kept if the pixels are turned first. Returns a JPEG whose pixels are
 * upright and that carries no orientation tag, or null when it cannot. The only implementation is native: baker.ts
 * over modules/scribe-photo. Where that module is absent (Expo Go, web, Android), there is no baker, such a picture is
 * reported as `needs_rotation` and nothing is stored.
 */
export interface OrientationBaker {
  bake(original: Uint8Array, source?: { uri?: string }): Promise<Uint8Array | null>;
}

/**
 * The picker's temporary files (Caches/ImagePicker). scribe-photo's picker copies the ORIGINAL there, with its
 * location (review C7). The app reads it once, then removes it; a sweep at launch empties the folder.
 */
export interface PickedFiles {
  read(uri: string): Promise<Uint8Array>;
  /** Never throws: a file already gone is fine. */
  remove(uri: string): Promise<void>;
  /** Empties the picker's folder. Never throws. */
  sweep(): Promise<void>;
}
