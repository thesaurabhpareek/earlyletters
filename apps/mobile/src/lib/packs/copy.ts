/**
 * Storage words moved to @scribe/content (packages/content/src/features/packs.en.ts). Re-exported
 * here with `{app}` filled from packages/brand, as before, so imports keep working.
 */
import { packsCopy as raw } from '@scribe/content';
import { withBrandName } from '../copy';

export const packsCopy = withBrandName(raw);

/** "12 MB", "574 MB", "1.2 GB": decimal units, as iOS Settings shows storage. */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0 KB';
  if (n < 1e6) return `${Math.max(1, Math.round(n / 1e3))} KB`;
  if (n < 1e9) return `${Math.round(n / 1e6)} MB`;
  return `${(n / 1e9).toFixed(1)} GB`;
}
