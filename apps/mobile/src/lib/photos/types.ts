/** Photo with a letter: shapes and the ports the logic runs against (tests use in-memory ones). */

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
