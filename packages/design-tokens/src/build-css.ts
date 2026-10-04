/**
 * Generates CSS variables from tokens.ts for Uniwind (mobile) and, later,
 * shadcn/ui (web). Run: npm run build -w @scribe/design-tokens
 * The output is committed; a test fails if it drifts from tokens.ts.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tokens } from './tokens';

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

type Mode = 'light' | 'dark';
type ColorKey = keyof (typeof tokens)['light'];

/**
 * CSS color names follow shadcn/ui, so React Native Reusables (mobile) and
 * shadcn/ui (web) components work without edits. Mapping to our tokens:
 * note shadcn's "accent" is a subtle hover wash, so OUR brand accent is
 * shadcn's "primary".
 */
const SHADCN: Record<string, ColorKey> = {
  background: 'bg',
  foreground: 'text',
  card: 'surfaceRaised',
  'card-foreground': 'text',
  popover: 'surfaceRaised',
  'popover-foreground': 'text',
  primary: 'accent',
  'primary-foreground': 'onAccent',
  secondary: 'accentSoft',
  'secondary-foreground': 'text',
  muted: 'surface',
  'muted-foreground': 'textMuted',
  accent: 'accentSoft',
  'accent-foreground': 'text',
  destructive: 'recording',
  border: 'line',
  input: 'line',
  ring: 'focus',
};
/** Our names with no shadcn equivalent. */
const EXTRA: ColorKey[] = ['surface', 'surfaceRaised', 'recording', 'success', 'caution'];

export function colorVars(mode: Mode): Record<string, string> {
  const c = tokens[mode];
  const out: Record<string, string> = {};
  for (const [name, key] of Object.entries(SHADCN)) out[name] = c[key];
  for (const key of EXTRA) out[kebab(key)] = c[key];
  return out;
}

export function nativeCss(): string {
  const block = (mode: Mode) =>
    Object.entries(colorVars(mode))
      .map(([k, v]) => `      --color-${k}: ${v};`)
      .join('\n');
  const radii = Object.entries(tokens.radius)
    .map(([k, v]) => `  --radius-${k}: ${v === 9999 ? '9999px' : `${v}px`};`)
    .join('\n');
  const atmosphere = Object.entries(tokens.atmosphere)
    .map(([k, v]) => `  --color-${kebab(k)}: ${v};`)
    .join('\n');
  return `/* GENERATED from packages/design-tokens/src/tokens.ts. Do not edit by hand. */
@layer theme {
  :root {
    @variant light {
${block('light')}
    }

    @variant dark {
${block('dark')}
    }
  }
}

@theme {
${radii}
  /* lamp atmosphere (dark-mode glows and gradients only; never text) */
${atmosphere}
}
`;
}

/**
 * Web variable names (match apps/web/src/app/globals.css). Light values are the
 * unprefixed names, dark values are `--night-*`; lamp atmosphere is dark-only.
 */
const WEB_LIGHT: Record<string, ColorKey> = {
  paper: 'bg',
  surface: 'surface',
  'surface-raised': 'surfaceRaised',
  ink: 'text',
  'ink-muted': 'textMuted',
  accent: 'accent',
  'accent-soft': 'accentSoft',
  'on-accent': 'onAccent',
  line: 'line',
  focus: 'focus',
  recording: 'recording',
  success: 'success',
  caution: 'caution',
};
const WEB_DARK: Record<string, ColorKey> = {
  night: 'bg',
  'night-surface': 'surface',
  'night-raised': 'surfaceRaised',
  'night-ink': 'text',
  'night-ink-muted': 'textMuted',
  'night-accent': 'accent',
  'night-accent-soft': 'accentSoft',
  'night-on-accent': 'onAccent',
  'night-line': 'line',
  'night-focus': 'focus',
  'night-recording': 'recording',
  'night-success': 'success',
  'night-caution': 'caution',
};

export function webColorVars(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, key] of Object.entries(WEB_LIGHT)) out[name] = tokens.light[key].toLowerCase();
  for (const [name, key] of Object.entries(WEB_DARK)) out[name] = tokens.dark[key].toLowerCase();
  out.dusk = tokens.atmosphere.duskSurface.toLowerCase();
  out.lamp = tokens.atmosphere.lamp.toLowerCase();
  out['lamp-gold'] = tokens.atmosphere.lampGold.toLowerCase();
  out['lamp-rose'] = tokens.atmosphere.lampRose.toLowerCase();
  out['lamp-dusk'] = tokens.atmosphere.lampDusk.toLowerCase();
  return out;
}

export function webCss(): string {
  const decl = (o: Record<string, string>) =>
    Object.entries(o)
      .map(([k, v]) => `  --${k}: ${v};`)
      .join('\n');
  const radii: Record<string, string> = {};
  for (const [k, v] of Object.entries(tokens.radius)) radii[`radius-${k}`] = v === 9999 ? '9999px' : `${v}px`;
  const { easing, reduceMotion, enter } = tokens.motion;
  const motion: Record<string, string> = {
    'ease-standard': `cubic-bezier(${easing.join(', ')})`,
    'fade-ms': `${reduceMotion.durationMs}ms`,
    'enter-ms': `${enter.durationMs}ms`,
    'enter-dy': `${enter.dy}px`,
    'stagger-ms': `${enter.staggerMs}ms`,
  };
  return `/* GENERATED from packages/design-tokens/src/tokens.ts. Do not edit by hand. */
:root {
${decl(webColorVars())}
${decl(radii)}
${decl(motion)}
}
`;
}

if (process.argv[1]?.endsWith('build-css.ts')) {
  const out = join(__dirname, '..', 'dist');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'tokens.native.css'), nativeCss());
  console.log('wrote dist/tokens.native.css');
  writeFileSync(join(out, 'tokens.web.css'), webCss());
  console.log('wrote dist/tokens.web.css');
}
