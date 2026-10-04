// The Early Letters mark, defined once. Every icon, splash and SVG master is built from this file.
//
// The mark: an envelope whose top folds into a soft heart. Two rounded shoulders rise above the
// envelope, and the flap's fold line meets in the heart's point. Chosen from three concepts
// (packages/brand/logo/concepts, rationale in packages/content/BRAND.md "Mark and app icon").
//
// Colours come from packages/brand (`brand.colors`) and docs/design/DESIGN_LANGUAGE.md section 2.
// Plain ESM with no dependencies, so any script can import it.

/** Envelope with heart shoulders, on a 1024 artboard, centred on (512, 506). */
export const SILHOUETTE =
  'M512 330 C470 262 404 236 344 236 C254 236 200 300 200 380 L200 712 Q200 776 264 776 L760 776 Q824 776 824 712 L824 380 C824 300 770 236 680 236 C620 236 554 262 512 330 Z';

/**
 * The flap's fold line, running edge to edge so the flap above it is a whole heart and the pocket
 * below is the envelope. It is cut out of the silhouette, never drawn on top, so it stays
 * transparent in the dark, tinted, Android and splash variants.
 */
export const FOLD = 'M176 360 L232 400 C330 470 430 560 512 620 C594 560 694 470 792 400 L848 360';

export const FOLD_WIDTH = 44;

/** Centre of the silhouette's bounding box (200..824 x 236..776). */
const CX = 512;
const CY = 506;

/** Palette (hex), mirrored from packages/brand `brand.colors` and design tokens. */
export const PALETTE = {
  paper: '#FBF8F3',
  paperDark: '#161412',
  accent: '#8A5A3B',
  accentDark: '#D9A47E',
  accentSoft: '#F1E6DC',
  ink: '#2B2722',
  black: '#000000',
  white: '#FFFFFF',
};

/**
 * One mark on a square artboard.
 * @param {object} o
 * @param {number} [o.size=1024] output width and height in px (viewBox stays 1024)
 * @param {string|null} [o.background] full-bleed square colour, or null for transparent
 * @param {string} o.fill silhouette colour
 * @param {number} [o.scale=1] mark scale around the artboard centre (Android safe zone uses less)
 * @param {string} [o.title]
 */
export function markSvg({ size = 1024, background = null, fill, scale = 1.05, title = 'Early Letters mark' }) {
  // Scale around the silhouette's centre, then centre it on the artboard.
  const tx = 512 - CX * scale;
  const ty = 512 - CY * scale;
  const t = `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="${size}" height="${size}">
  <title>${title}</title>
  <defs>
    <mask id="fold" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024">
      <rect width="1024" height="1024" fill="#fff"/>
      <path d="${FOLD}" transform="${t}" fill="none" stroke="#000" stroke-width="${FOLD_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>
    </mask>
  </defs>
  ${background ? `<rect width="1024" height="1024" fill="${background}"/>` : ''}
  <path d="${SILHOUETTE}" transform="${t}" fill="${fill}" mask="url(#fold)"/>
</svg>
`;
}

/**
 * Every variant the app and stores need. `background: null` means transparent.
 * iOS: light must be opaque (App Store rejects alpha); dark keeps transparency so the system
 * draws its dark backdrop; tinted is a grayscale image the system tints, opaque on black.
 * Android adaptive: the mark sits inside the 66 dp safe circle of the 108 dp canvas, so it is
 * scaled to fit that circle; the background layer is a solid colour in app.config.ts.
 */
export const VARIANTS = {
  iosLight: { background: PALETTE.accent, fill: PALETTE.paper, title: 'App icon' },
  iosDark: { background: null, fill: PALETTE.accentDark, title: 'App icon, dark' },
  iosTinted: { background: PALETTE.black, fill: PALETTE.white, title: 'App icon, tinted' },
  androidForeground: { background: null, fill: PALETTE.paper, scale: 0.74, title: 'Android adaptive foreground' },
  androidMonochrome: { background: null, fill: PALETTE.white, scale: 0.74, title: 'Android themed icon' },
  splashLight: { background: null, fill: PALETTE.accent, scale: 1.4, title: 'Splash mark' },
  splashDark: { background: null, fill: PALETTE.accentDark, scale: 1.4, title: 'Splash mark, dark' },
  markAccent: { background: null, fill: PALETTE.accent, title: 'Early Letters mark' },
};
