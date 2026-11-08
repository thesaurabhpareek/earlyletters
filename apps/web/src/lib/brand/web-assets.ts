/**
 * The approved brand files this website serves: the favicon set, the Apple touch icon, the share image and the email
 * header logos. They are byte-for-byte copies of the brand registry masters (packages/brand/registry.json, on develop),
 * made by scripts/web/sync-brand-assets.mjs, which also writes web-assets.json next to this file. The site never draws
 * or edits a logo itself (docs/brand/BRAND_SYSTEM.md).
 *
 * Code asks for a registry id, never a file name. Each asset is served at its registry `url` from apps/web/public.
 * apps/web/test/brand-assets.test.ts checks every copy against the hashes recorded here.
 */
import lock from './web-assets.json';

export type WebAssetId = keyof typeof lock.assets;

export interface WebAsset {
  readonly context: string;
  /** Registry version and date of the drawing. */
  readonly version: string;
  readonly date: string;
  /** Repo-relative path of the master in packages/brand (present on develop). */
  readonly master: string;
  /** Where the file is served on this site; also its path under apps/web/public. */
  readonly url: string;
  readonly format: string;
  readonly dimensions?: { readonly width: number; readonly height: number; readonly unit: string };
  readonly bytes: number;
  readonly sha256: string;
  /** Every repo-relative file that holds a copy (the public one first). */
  readonly copies: readonly string[];
}

export const webAssets: Readonly<Record<WebAssetId, WebAsset>> = lock.assets;

export function webAsset(id: WebAssetId): WebAsset {
  return webAssets[id];
}

/** Pixel size of a raster asset. */
export function webAssetSize(id: WebAssetId): { width: number; height: number } {
  const d = webAssets[id].dimensions;
  if (!d || d.unit !== 'px') throw new Error(`brand asset "${id}" has no pixel size`);
  return { width: d.width, height: d.height };
}
