/**
 * Early Letters design tokens.
 * Zero dependencies. Plain values only, so React Native (StyleSheet, Reanimated)
 * and web (CSS-in-JS, CSS variables) can both consume them.
 *
 * Source of truth for rationale: docs/design/DESIGN_LANGUAGE.md
 * Contrast ratios below were computed with the WCAG 2.x relative-luminance formula.
 */

/* ------------------------------------------------------------------ */
/* Color                                                               */
/* ------------------------------------------------------------------ */

const light = {
  bg: '#FBF8F3', // brand "paper"
  surface: '#F5EFE7', // grouped / inset areas (book shelf, review tray)
  surfaceRaised: '#FFFFFF', // brand "paperRaised": cards, sheets
  text: '#2B2722', // brand "ink"          14.00:1 on bg
  textMuted: '#6B645B', // brand "inkMuted"  5.51:1 on bg, 5.11:1 on surface
  accent: '#8A5A3B', // brand accent         5.50:1 on bg
  accentSoft: '#F1E6DC', // selected chips, highlight wash (text 12.07:1)
  onAccent: '#FFFFFF', // text/icons on accent  5.82:1
  line: '#E6DED3', // hairlines, dividers (decorative, never sole affordance)
  focus: '#2F6F8F', // focus ring             5.23:1 on bg
  recording: '#B5473A', // live mic state       5.05:1 on bg
  success: '#3F7A55', // saved / delivered      4.80:1 on bg
  caution: '#94661A', // needs attention        4.75:1 on bg
} as const;

const dark = {
  bg: '#161412',
  surface: '#1B1917',
  surfaceRaised: '#201D1A',
  text: '#F2ECE4', // 15.66:1 on bg
  textMuted: '#B3AA9E', // 8.01:1 on bg
  accent: '#D9A47E', // 8.37:1 on bg
  accentSoft: '#3A2E25', // text 11.20:1, accent 5.99:1
  onAccent: '#1E1612', // 8.11:1 on accent (dark ink on light accent)
  line: '#33302C',
  focus: '#8CC4DE', // 9.68:1 on bg
  recording: '#F08C7C', // 7.65:1 on bg
  success: '#8CC9A0', // 9.60:1 on bg
  caution: '#E3B866', // 9.90:1 on bg
} as const;

/* ------------------------------------------------------------------ */
/* Spacing: 4pt scale. space[n] === n * 4, except named steps beyond 8 */
/* ------------------------------------------------------------------ */

const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16, // default screen gutter
  5: 20, // reading-view gutter
  6: 24,
  7: 28,
  8: 32,
  9: 40,
  10: 48,
  11: 56,
  12: 64,
} as const;

/* ------------------------------------------------------------------ */
/* Radii                                                               */
/* ------------------------------------------------------------------ */

const radius = {
  sm: 8, // inputs, small chips, photo thumbnails
  md: 14, // list cards, letter cards
  lg: 20, // feature cards, month chapter covers
  xl: 28, // sheets (top corners), capture surface
  pill: 9999, // buttons, segmented controls, tags
} as const;

/* ------------------------------------------------------------------ */
/* Typography                                                          */
/* ------------------------------------------------------------------ */

/** Font family names as registered with expo-font / @font-face. */
const fontFamily = {
  /** UI sans. Mukta (Ek Type, SIL OFL 1.1): Latin + Devanagari in one family. */
  sans: 'Mukta',
  sansMedium: 'Mukta-Medium',
  sansSemiBold: 'Mukta-SemiBold',
  /** Reading serif, Latin. Literata (TypeTogether, SIL OFL 1.1), variable opsz+wght. */
  serif: 'Literata',
  serifItalic: 'Literata-Italic',
  /** Reading serif, Devanagari. Tiro Devanagari Hindi (Tiro Typeworks, SIL OFL 1.1). */
  serifDevanagari: 'TiroDevanagariHindi',
  /** Fallback stacks for web. */
  webSans: "Mukta, 'Noto Sans Devanagari', -apple-system, system-ui, sans-serif",
  webSerif: "Literata, 'Tiro Devanagari Hindi', 'Noto Serif Devanagari', Georgia, serif",
} as const;

type Weight = '400' | '500' | '600' | '700';

interface TypeStyle {
  fontFamily: string;
  /** Size in pt at the default ("Large") Dynamic Type setting. */
  fontSize: number;
  /** Line height in pt at default. Scale proportionally with fontSize. */
  lineHeight: number;
  fontWeight: Weight;
  letterSpacing: number;
  /** iOS text style this maps to for Dynamic Type scaling. */
  dynamicTypeStyle: string;
  /** Upper bound multiplier for this style at accessibility sizes (null = unbounded). */
  maxScale: number | null;
}

const ts = (
  fontFamily: string,
  fontSize: number,
  lineHeight: number,
  fontWeight: Weight,
  letterSpacing: number,
  dynamicTypeStyle: string,
  maxScale: number | null,
): TypeStyle => ({ fontFamily, fontSize, lineHeight, fontWeight, letterSpacing, dynamicTypeStyle, maxScale });

/**
 * Sizes mirror Apple's iOS "Large (default)" Dynamic Type table where a system
 * equivalent exists (HIG Typography > Specifications). Mukta sets slightly small
 * on its em, so UI styles are +1pt over SF equivalents for optical parity.
 * letterBody and letterDateline are custom reading styles.
 */
const type = {
  display: ts(fontFamily.serif, 34, 41, '500', 0.2, 'largeTitle', 1.6),
  title1: ts(fontFamily.serif, 28, 34, '500', 0.2, 'title1', 1.8),
  title2: ts(fontFamily.serif, 22, 28, '500', 0, 'title2', 2.0),
  headline: ts(fontFamily.sansSemiBold, 18, 23, '600', 0, 'headline', null),
  body: ts(fontFamily.sans, 18, 24, '400', 0, 'body', null),
  callout: ts(fontFamily.sans, 17, 22, '400', 0, 'callout', null),
  subhead: ts(fontFamily.sans, 16, 21, '400', 0, 'subheadline', null),
  footnote: ts(fontFamily.sans, 14, 19, '400', 0.1, 'footnote', null),
  caption: ts(fontFamily.sansMedium, 13, 17, '500', 0.2, 'caption1', null),
  /** Letter text. Scales with Dynamic Type "body" and the in-app Reading Size control. */
  letterBody: ts(fontFamily.serif, 20, 32, '400', 0, 'body', null),
  /** "Month 4 · Tuesday night · Papa" line above each letter. Small caps feel via tracking. */
  letterDateline: ts(fontFamily.sansMedium, 14, 18, '500', 0.6, 'footnote', 2.4),
} as const;

/**
 * In-app Reading Size multiplier applied on top of Dynamic Type for letterBody only.
 * "Large print" is offered during family-invite onboarding for grandparents.
 */
const readingScale = {
  standard: 1,
  large: 1.2,
  largePrint: 1.45,
} as const;

/* ------------------------------------------------------------------ */
/* Elevation                                                           */
/* Warm-tinted shadows (ink, not black). In dark mode shadows are      */
/* nearly invisible, so elevation is carried by surfaceRaised + line.  */
/* ------------------------------------------------------------------ */

interface Elevation {
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
  /** Android elevation equivalent. */
  elevation: number;
  /** Web box-shadow equivalent (light mode). */
  web: string;
  /** Whether to draw a 1px `line` border in dark mode to separate the surface. */
  darkBorder: boolean;
}

const elevation: Record<0 | 1 | 2 | 3, Elevation> = {
  0: { shadowColor: '#2B2722', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0, web: 'none', darkBorder: false },
  1: { shadowColor: '#2B2722', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1, web: '0 2px 6px rgba(43,39,34,0.06)', darkBorder: true },
  2: { shadowColor: '#2B2722', shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4, web: '0 6px 16px rgba(43,39,34,0.10)', darkBorder: true },
  3: { shadowColor: '#2B2722', shadowOpacity: 0.16, shadowRadius: 32, shadowOffset: { width: 0, height: 12 }, elevation: 12, web: '0 12px 32px rgba(43,39,34,0.16)', darkBorder: true },
};

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* Spring params in Reanimated / Framer Motion form (stiffness/damping/ */
/* mass) plus the equivalent SwiftUI-style response/dampingFraction.    */
/* reduceMotion: what to use when Reduce Motion is on (cross-fade).     */
/* ------------------------------------------------------------------ */

const motion = {
  /** Toggles, chips, button press, word-highlight advance. ~0.25s, no visible overshoot. */
  snappy: { stiffness: 520, damping: 46, mass: 1, response: 0.28, dampingFraction: 1.0 },
  /** Sheets, card-to-detail, navigation. ~0.4s, very slight settle. */
  standard: { stiffness: 260, damping: 30, mass: 1, response: 0.4, dampingFraction: 0.92 },
  /** Breathing glow, page settle, chapter reveal. ~0.7s, soft. */
  gentle: { stiffness: 90, damping: 18, mass: 1, response: 0.66, dampingFraction: 0.95 },
  reduceMotion: { type: 'fade', durationMs: 200 },
  /** Breathing glow when idle (no voice): one inhale+exhale cycle. */
  breathIdleMs: 4000,
} as const;

export const tokens = {
  light,
  dark,
  space,
  radius,
  type,
  fontFamily,
  readingScale,
  elevation,
  motion,
} as const;

export type ColorScheme = 'light' | 'dark';
export type ColorToken = keyof typeof light;
export type SpaceToken = keyof typeof space;
export type RadiusToken = keyof typeof radius;
export type TypeToken = keyof typeof type;
export type ElevationToken = keyof typeof elevation;
export type MotionToken = 'snappy' | 'standard' | 'gentle';

export default tokens;
