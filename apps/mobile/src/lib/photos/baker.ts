/**
 * The OrientationBaker port's device adapter (types.ts): hands the picked file's uri to the native ImageIO step
 * (modules/scribe-photo), reads the upright, metadata-free JPEG it made, and removes that temporary file whatever
 * happened. A missing native module, a missing uri, or any failure is `null`, which `commitPhoto` reports as
 * `needs_rotation` or `not_jpeg` and stores nothing for. Native error text is dropped (NX-39-R50).
 * Pure (the native call and the file reads are parameters), so it is tested in Node with stand-ins.
 */
import type { OrientationBaker } from './types';

export interface BakeNative {
  reencodeUpright(uri: string): Promise<string>;
}
export interface BakedFiles {
  read(uri: string): Promise<Uint8Array>;
  remove(uri: string): Promise<void>;
}

export function createOrientationBaker(native: BakeNative | null | undefined, files: BakedFiles): OrientationBaker | undefined {
  if (!native) return undefined;
  return {
    async bake(_original, source) {
      const uri = source?.uri;
      if (!uri) return null;
      let out: string | null = null;
      try {
        out = await native.reencodeUpright(uri);
        return await files.read(out);
      } catch {
        return null;
      } finally {
        if (out) await files.remove(out).catch(() => {});
      }
    },
  };
}
