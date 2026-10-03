import { brand } from '@scribe/brand';
import { tokens } from '@scribe/design-tokens';

/**
 * CSS custom properties built from the shared tokens, so the site and the
 * app can never drift. Brand colours come from @scribe/brand; the extra
 * roles (surface, focus, caution, dark accentSoft) from @scribe/design-tokens.
 */
const c = brand.colors;

const light = {
  ink: c.ink,
  'ink-muted': c.inkMuted,
  paper: c.paper,
  'paper-raised': c.paperRaised,
  surface: tokens.light.surface,
  accent: c.accent,
  'accent-soft': c.accentSoft,
  'on-accent': tokens.light.onAccent,
  line: c.line,
  focus: tokens.light.focus,
  caution: tokens.light.caution,
};

const dark = {
  ink: c.inkDark,
  'ink-muted': c.inkMutedDark,
  paper: c.paperDark,
  'paper-raised': c.paperRaisedDark,
  surface: tokens.dark.surface,
  accent: c.accentDark,
  'accent-soft': tokens.dark.accentSoft,
  'on-accent': tokens.dark.onAccent,
  line: c.lineDark,
  focus: tokens.dark.focus,
  caution: tokens.dark.caution,
};

const decl = (o: Record<string, string>, prefix = '') =>
  Object.entries(o)
    .map(([k, v]) => `--${prefix}${k}:${v};`)
    .join('');

/** Global theme: light by default, dark when the system asks for it. */
export const themeCss = [
  `:root{color-scheme:light dark;${decl(light)}${decl(dark, 'night-')}}`,
  `@media (prefers-color-scheme:dark){:root{${decl(dark)}}}`,
].join('');
