/**
 * The OrientationBaker port's device adapter (types.ts): hands one picked original to the native ImageIO step
 * (modules/scribe-photo) with a destination this file builds, reads the upright, metadata-free JPEG written there, and
 * removes that temporary file whatever happened. Only a picked original in Caches/ImagePicker is ever handed over
 * (review N4), and the native call is bounded in time (N9). A missing native module, a uri outside that folder, a
 * timeout or any failure is `null`, which `commitPhoto` reports as `needs_rotation` or `not_jpeg` and stores nothing
 * for. Native error text is dropped (NX-39-R50). Pure (the native call and the files are parameters), so it is tested
 * in Node with stand-ins.
 */
import type { OrientationBaker } from './types';

/** How long the native step may take for one picture before it counts as a failure. */
export const BAKE_TIMEOUT_MS = 20_000;

export interface BakeNative {
  reencodeUpright(source: string, destination: string): Promise<string>;
}
export interface BakedFiles {
  /** True only for a picked original directly inside Caches/ImagePicker: the one kind of file the native step reads. */
  isPicked(uri: string): boolean;
  /** A new file uri inside Caches/ScribePhoto for the native step to write. */
  destination(): string;
  read(uri: string): Promise<Uint8Array>;
  remove(uri: string): Promise<void>;
}

function within<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('photo_bake_timeout')), ms);
  });
  return Promise.race([work, late]).finally(() => clearTimeout(timer));
}

export function createOrientationBaker(native: BakeNative | null | undefined, files: BakedFiles, timeoutMs = BAKE_TIMEOUT_MS): OrientationBaker | undefined {
  if (!native) return undefined;
  return {
    async bake(_original, source) {
      const uri = source?.uri;
      if (!uri || !files.isPicked(uri)) return null;
      const out = files.destination();
      try {
        // The native side resolves the destination it was given; anything else is not trusted.
        if ((await within(native.reencodeUpright(uri, out), timeoutMs)) !== out) return null;
        return await files.read(out);
      } catch {
        return null;
      } finally {
        await files.remove(out).catch(() => {});
      }
    },
  };
}
