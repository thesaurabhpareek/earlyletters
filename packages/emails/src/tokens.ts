/**
 * Email design tokens. Colours come from @scribe/brand (the single source);
 * the only values derived here are the dark `accentSoft`, `onAccent` and
 * `surface`, copied from docs/design/DESIGN_LANGUAGE.md section 2 where their
 * contrast ratios are computed.
 *
 * Email-specific choices:
 * - No pure white (#FFFFFF) and no pure black anywhere. Apple Mail and several
 *   Outlook apps auto-darken pure white or transparent backgrounds, and pure
 *   white on pure black is what forced-inversion clients handle worst
 *   (Litmus, Email on Acid; see README). Light text on the button is `paper`.
 * - The letter sheet is `paper`, sitting on a slightly deeper `desk`. In dark
 *   mode the sheet lifts to `paperRaisedDark` on `paperDark`.
 * - Type sizes are px (email clients ignore rem roots). 17px body keeps iOS
 *   Mail from auto-scaling text and reads comfortably on a 375px screen.
 */
import { brand } from '@scribe/brand';

const c = brand.colors;

export type Palette = {
  /** Outer background, behind the sheet. */
  desk: string;
  /** The letter sheet. */
  sheet: string;
  ink: string;
  inkMuted: string;
  accent: string;
  /** Soft wash for the code box and safety note. */
  accentSoft: string;
  /** Text on an `accent` fill. */
  onAccent: string;
  line: string;
};

export const light: Palette = {
  desk: '#F5EFE7', // DESIGN_LANGUAGE `surface` (light); ink on it 12.98:1
  sheet: c.paper,
  ink: c.ink,
  inkMuted: c.inkMuted,
  accent: c.accent,
  accentSoft: c.accentSoft,
  onAccent: c.paper, // paper on accent ~5.5:1; avoids pure white
  line: c.line,
};

export const dark: Palette = {
  desk: c.paperDark,
  sheet: c.paperRaisedDark,
  ink: c.inkDark,
  inkMuted: c.inkMutedDark,
  accent: c.accentDark,
  accentSoft: '#3A2E25', // DESIGN_LANGUAGE dark `accentSoft`; ink on it 11.20:1
  onAccent: '#1E1612', // DESIGN_LANGUAGE dark `onAccent`; on accent 8.11:1
  line: c.lineDark,
};

export const fonts = {
  /** Reading serif. Literata if installed, else Georgia (every major client). */
  serif: "Literata, Georgia, 'Times New Roman', serif",
  /** UI sans. Mukta if installed, else the platform UI font. */
  sans: "Mukta, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  /** Digits for one-time codes: tabular, unambiguous. */
  code: "'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace",
} as const;

/** px sizes and unitless line heights, tuned for a 375px phone. */
export const type = {
  heading: { size: 26, line: 1.3, weight: 500, family: fonts.serif },
  headingMobile: { size: 24 },
  /** Default body: UI sans, 17px / 1.6 ("Quiet UI"). */
  body: { size: 17, line: 1.6, weight: 400, family: fonts.sans },
  /** Letter body: reading serif, for notes written like a letter (welcome, family). */
  letter: { size: 18, line: 1.65, weight: 400, family: fonts.serif },
  ui: { size: 16, line: 1.5, weight: 600, family: fonts.sans },
  small: { size: 14, line: 1.55, weight: 400, family: fonts.sans },
  /** Floor: nothing smaller (DESIGN_LANGUAGE holds 13pt for grandparents). */
  footer: { size: 13, line: 1.6, weight: 400, family: fonts.sans },
  code: { size: 30, line: 1.2, weight: 600, family: fonts.code, tracking: 6 },
} as const;

/** 4px scale, same steps as @scribe/design-tokens `space`. */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 9: 40, 10: 48, 12: 64 } as const;

export const layout = {
  /** Max sheet width. Fluid below it. */
  maxWidth: 600,
  /** Sheet padding: desktop, then phone (applied by media query). */
  pad: 40,
  padMobile: 24,
  /** Outer gutter around the sheet on phones. */
  gutterMobile: 12,
  radius: 14,
  radiusSmall: 8,
  /** Minimum tap target, WCAG 2.5.5 / Apple HIG. Button renders 48px tall. */
  tapTarget: 44,
  /** B3 interim lockup: 320x56 PNG shown at 160x28 (packages/brand/assets/email/manifest.json). */
  logoWidth: 160,
  logoHeight: 28,
} as const;

/** Where email images live. Nothing is ever loaded from any other host. */
export const ASSET_ORIGIN = `https://${brand.publisher.domain}`;
export const ASSET_BASE = `${ASSET_ORIGIN}/email`;
