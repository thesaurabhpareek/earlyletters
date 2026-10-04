/**
 * Pure maths for LampWash, kept free of React Native so it can be unit tested
 * (including the light-mode contrast guarantee).
 */
import { tokens } from '@scribe/design-tokens';

export type LampTone = 'amber' | 'rose' | 'dusk';
export type LampScheme = 'light' | 'dark';

/**
 * The ONE documented colour default (the website lamp, Aurora.module.css).
 * TODO(tokens): replace with the lamp / lampRose / lampDusk colour tokens
 * (lamp #F3C98B, lampGold #FFE2A8, lampRose #F08C7C, lampDusk #8076E2) once
 * they exist. Until then LampWash also accepts them as the `colors` prop.
 */
export const LAMP_DEFAULTS: Record<LampTone, string> = {
  amber: tokens.atmosphere.lamp,
  rose: tokens.atmosphere.lampRose,
  dusk: tokens.atmosphere.lampDusk,
};

/** Peak opacity of the whole wash at intensity 1. Light is a whisper so text pairs hold 4.5:1. */
export const WASH_PEAK: Record<LampScheme, number> = { light: 0.08, dark: 0.42 };

export const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

/** Opacity applied to the whole SVG. */
export const washOpacity = (scheme: LampScheme, intensity: number) => WASH_PEAK[scheme] * clamp01(intensity);

/** Gradient geometry per anchor, as fractions of the box. */
export const ANCHORS = {
  top: { cx: 0.5, cy: 0, r: 0.95 },
  center: { cx: 0.5, cy: 0.45, r: 0.8 },
} as const;
export type LampAnchor = keyof typeof ANCHORS;

/** Gradient stops: strong core, long soft tail, like the website. */
export const STOPS = [
  { offset: 0, opacity: 1 },
  { offset: 0.38, opacity: 0.45 },
  { offset: 0.66, opacity: 0.12 },
  { offset: 1, opacity: 0 },
] as const;

/* ---- contrast helpers (WCAG 2.x) ---- */
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
export function blend(fg: string, bg: string, alpha: number): string {
  const f = rgb(fg);
  const b = rgb(bg);
  return '#' + f.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0')).join('');
}
const lum = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function contrast(a: string, b: string): number {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
