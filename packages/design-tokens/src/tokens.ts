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
  /** Boundary of an interactive control (inputs, unselected pills, outline buttons, switch off-track).
   *  WCAG 1.4.11 needs 3:1: 3.62 on bg, 3.36 on surface, 3.83 on surfaceRaised, 3.12 on accentSoft. */
  controlBorder: '#8A8175',
  /** Dotted underline under machine-edited words (Review). Full strength: 5.82 on surfaceRaised. */
  editMark: '#8A5A3B',
  /** Destructive actions (Delete). Its own role so it can diverge from `recording`, which means
   *  "listening", never "error" (DESIGN_LANGUAGE 2). Value equals recording until design decides (TDD 09 Q1). */
  destructive: '#B5473A', // 5.05:1 on bg
  onDestructive: '#FFFFFF', // 5.35:1 on destructive
  /** Dimmed layer behind sheets and dialogs: ink at 32%, never pure black on paper. */
  scrim: '#2B272252',
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
  controlBorder: '#857C70', // 4.47 on bg, 4.27 surface, 4.08 surfaceRaised, 3.20 accentSoft
  editMark: '#D9A47E', // 7.64:1 on surfaceRaised
  destructive: '#F08C7C', // 7.65:1 on bg
  onDestructive: '#1E1612', // 7.42:1 on destructive (dark ink, like onAccent)
  scrim: '#0000008C',
} as const;

/**
 * Increase Contrast (iOS "Increase Contrast", Android "High contrast text").
 * Overrides applied on top of light / dark by useTheme() in apps/mobile/src/lib/a11y.ts.
 * Muted text and accent get darker (light) or lighter (dark); hairlines become control-strength.
 */
const highContrast = {
  light: {
    textMuted: '#524B43', // 8.10:1 on bg
    accent: '#6E4529', // 7.79:1 on bg
    editMark: '#6E4529',
    line: '#6B645B', // was decorative; now a visible 5.5:1 edge
    controlBorder: '#2B2722',
  },
  dark: {
    textMuted: '#D6CEC3', // 11.79:1 on bg
    accent: '#E8BC9A', // 10.58:1 on bg
    editMark: '#E8BC9A',
    line: '#B3AA9E',
    controlBorder: '#F2ECE4',
  },
} as const satisfies Record<'light' | 'dark', Partial<Record<keyof typeof light, string>>>;

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

/**
 * Font family names as registered with expo-font / @font-face. One name per face (the
 * PostScript name of the bundled file in ../fonts), so iOS, Android and web resolve the
 * same face without weight synthesis. Never combine these with fontWeight / fontStyle.
 */
const fontFamily = {
  /** UI sans. Mukta (Ek Type, SIL OFL 1.1): Latin + Devanagari in one family. */
  sans: 'Mukta-Regular',
  sansMedium: 'Mukta-Medium',
  sansSemiBold: 'Mukta-SemiBold',
  /** Reading serif, Latin. Literata (TypeTogether, SIL OFL 1.1): static cuts of the variable font. */
  serif: 'Literata-Regular', // opsz 16, wght 400: letters
  serifMedium: 'Literata-Medium', // opsz 30, wght 500: display and titles
  serifItalic: 'Literata-Italic', // opsz 16: signatures
  /** Reading serif, Devanagari. Tiro Devanagari Hindi (Tiro Typeworks, SIL OFL 1.1). */
  serifDevanagari: 'TiroDevanagariHindi-Regular',
  /** Fallback stacks for web. */
  webSans: "'Mukta-Regular', Mukta, 'Noto Sans Devanagari', -apple-system, system-ui, sans-serif",
  webSerif: "'Literata-Regular', Literata, 'TiroDevanagariHindi-Regular', 'Tiro Devanagari Hindi', 'Noto Serif Devanagari', Georgia, serif",
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
  /** First-run brand moment only (welcome, finish). */
  hero: ts(fontFamily.serifMedium, 44, 50, '500', -0.4, 'largeTitle', 1.6),
  display: ts(fontFamily.serifMedium, 34, 41, '500', -0.2, 'largeTitle', 1.6),
  title1: ts(fontFamily.serifMedium, 28, 34, '500', -0.1, 'title1', 1.8),
  title2: ts(fontFamily.serifMedium, 22, 28, '500', 0, 'title2', 2.0),
  headline: ts(fontFamily.sansSemiBold, 18, 23, '600', 0, 'headline', null),
  body: ts(fontFamily.sans, 18, 24, '400', 0, 'body', null),
  callout: ts(fontFamily.sans, 17, 22, '400', 0, 'callout', null),
  subhead: ts(fontFamily.sans, 16, 21, '400', 0, 'subheadline', null),
  footnote: ts(fontFamily.sans, 14, 19, '400', 0.1, 'footnote', null),
  caption: ts(fontFamily.sansMedium, 13, 17, '500', 0.2, 'caption1', null),
  /** Button, chip and row titles: Mukta Medium so labels hold their weight at every size. */
  label: ts(fontFamily.sansMedium, 18, 22, '500', 0, 'body', null),
  /** Small buttons and chips. */
  labelSmall: ts(fontFamily.sansMedium, 16, 20, '500', 0, 'subheadline', null),
  /** Letter text. Scales with Dynamic Type "body" and the in-app Reading Size control. */
  letterBody: ts(fontFamily.serif, 20, 32, '400', 0, 'body', null),
  /** "Month 4 · Tuesday night · Papa" line above each letter. Small caps feel via tracking. */
  letterDateline: ts(fontFamily.sansMedium, 14, 18, '500', 0.6, 'footnote', 2.4),
  /** "From Mama" at the end of a letter. Scales with letterBody and Reading Size. */
  signature: ts(fontFamily.serifItalic, 20, 32, '400', 0, 'body', null),
  /** Prompt on Tonight: the one serif line that is a question, not a letter. */
  prompt: ts(fontFamily.serif, 24, 32, '400', 0, 'title3', null),
} as const;

/** Smallest type size anywhere, at the default Dynamic Type setting (DESIGN_LANGUAGE 3). */
const minFontSize = 13;

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
  /** Reduce Motion cross-fade, and the fade that pairs with any movement (MOTION 4). */
  fadeMs: 200,
  /** Exit of transient UI (toast, inline card). Exits are quicker than entries. */
  exitMs: 160,
  /** Content entering (never controls): opacity 0 to 1, y 8 to 0, M3 standard easing. */
  enter: { dy: 8, durationMs: 280 },
  /** Cubic bezier for timed motion (Material 3 "standard", MOTION 1 M14). */
  easing: [0.2, 0, 0, 1] as const,
  staggerMs: 30,
  staggerMax: 6,
  /** Soft ceiling for any choreographed sequence; 2000 is the hard ceiling (Live Activities). */
  sequenceMaxMs: 900,
  hardCeilingMs: 2000,
  /** accentSoft wash on a newly saved letter. */
  newMarkMs: 1600,
  /** Press feedback (COMPONENTS 0.3): controls scale to 0.97, cards to 0.98, on `snappy`. */
  press: { scale: 0.97, cardScale: 0.98, opacity: 0.9 },
  /** Empty-state illustration breath (MOTION 5j, Calm's slowest pace). */
  emptyBreathMs: 8000,
  /** Line drawings draw once (MOTION 5h). */
  drawMs: 1200,
  /** Listening glow (MOTION 5b). */
  breath: { dbFloor: -55, dbCeil: -10, gamma: 0.6, attackMs: 80, releaseMs: 400, scaleMax: 0.18, opacityMin: 0.18, opacityMax: 0.4, idleAfterMs: 600, idleScale: 0.05 },
  /** Read together word highlight (MOTION 5g). */
  highlight: { leadMs: 50, minDwellMs: 120, lineAnchor: 0.4, followResumeMs: 4000 },
} as const;

/* ------------------------------------------------------------------ */
/* Targets and strokes                                                 */
/* ------------------------------------------------------------------ */

/** Minimum touch targets in pt (HIG 44; primary 56; Speak/Type 64; web 48 px). */
const target = { min: 44, primary: 56, capture: 64, web: 48 } as const;

/** Stroke widths in pt. `hairline` is decorative only; controls use `control`. */
const stroke = { hairline: 0.5, control: 1, selected: 1.5, focus: 2, editMark: 1.5 } as const;

/** Focus ring for Full Keyboard Access, Switch Control and web (WCAG 2.4.7 / 2.4.13). */
const focusRing = { width: 2, offset: 2 } as const;

export const tokens = {
  light,
  dark,
  highContrast,
  space,
  radius,
  type,
  minFontSize,
  fontFamily,
  readingScale,
  elevation,
  motion,
  target,
  stroke,
  focusRing,
} as const;

export type ColorScheme = 'light' | 'dark';
export type ColorToken = keyof typeof light;
export type SpaceToken = keyof typeof space;
export type RadiusToken = keyof typeof radius;
export type TypeToken = keyof typeof type;
export type ElevationToken = keyof typeof elevation;
export type MotionToken = 'snappy' | 'standard' | 'gentle';
export type Colors = { readonly [K in ColorToken]: string };
export type TypeStyleSpec = TypeStyle;

export default tokens;
