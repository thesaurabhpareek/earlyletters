/**
 * Pure parts of QuotePair: the opening quotation pair, the brand device (BRAND_SYSTEM 1).
 * The drawing is the registry's symbol, repeated here as path data because the app does not
 * load SVG files at run time. test/quote-pair.test.ts reads packages/brand/assets/logo/primary
 * and fails if this path or box ever drifts from the file, and it asks the registry
 * (assetFor('app.brand-device')) which file to use and the smallest size it allows.
 */
import { assetFor, type BrandAsset } from '@scribe/brand/registry';
import type { ColorScheme } from '@scribe/design-tokens';

/** Copied from logo/primary/symbol.svg (same geometry in symbol-accent.svg and symbol-reversed.svg). */
export const SYMBOL_VIEWBOX = '-41.19 -41.19 1112 1082.37';
export const SYMBOL_PATH =
  'M5.5 642.11C29.42 519.1 157.78 269.33 409.6 93C455.2 61.07 503.19 32.71 553.15 8.17C565.89 1.91 575.48 -2.49 586.06 1.57C594.93 4.98 603.28 13.86 630.47 74.92C657.65 135.98 658.67 148.13 655.26 157C651.08 167.89 640.61 172.9 629.14 178.81C578.34 205 530.86 237.19 487.72 274.67C402.74 348.51 406.23 380.68 408 390.31C419.67 453.59 525.1 455.85 578.37 584.35C627.51 702.89 595.58 840.43 499.24 925.2C402.89 1009.97 262.42 1024.13 151.09 960.3C39.76 896.47 -18.98 768.08 5.5 642.11ZM657.16 799.43C653.1 721.84 692.86 552.33 817.9 408.48C840.54 382.44 865.16 358.18 891.53 335.92C898.26 330.24 903.37 326.16 910.34 327.01C916.19 327.73 922.54 331.82 948.06 364.48C973.57 397.14 976.01 404.29 975.29 410.14C974.41 417.32 968.85 421.9 962.84 427.18C936.21 450.55 912.48 477.03 892.14 506.06C852.1 563.22 859.02 582.05 861.53 587.58C878.04 623.9 941.81 609.44 993.13 678.75C1040.47 742.7 1041.89 830.23 996.65 895.67C951.4 961.12 869.02 990.71 792.47 969.01C715.93 947.31 661.33 878.88 657.16 799.43Z';

const [VB_X, VB_Y, VB_W, VB_H] = SYMBOL_VIEWBOX.split(' ').map(Number);
/** Width over height of the viewBox. */
export const SYMBOL_ASPECT = VB_W / VB_H;
/** The mark sits inside a quiet margin of about this fraction of the box width (the viewBox starts at a negative x). */
export const SYMBOL_PAD = Math.abs(VB_X) / VB_W;

/** The registry asset for the surface: accent on paper, reversed on dark. */
export function deviceAsset(scheme: ColorScheme): BrandAsset {
  const want = scheme === 'dark' ? 'dark' : 'light';
  const found = assetFor('app.brand-device').find((a) => a.surface === want);
  if (!found) throw new Error(`brand registry: app.brand-device has no ${want} asset`);
  return found;
}

/** Height in points, never below the registry's smallest allowed size for the mark. */
export function deviceHeight(scheme: ColorScheme, wanted: number): number {
  const min = deviceAsset(scheme).minSize?.px ?? 24;
  return Math.max(min, Math.round(wanted));
}

/** Left offset so the visible mark (not its quiet margin) lines up with the text edge. */
export function edgeOffset(height: number): number {
  return -Math.round(SYMBOL_PAD * height * SYMBOL_ASPECT * 10) / 10;
}
