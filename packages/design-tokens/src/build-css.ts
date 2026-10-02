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
}
`;
}

if (process.argv[1]?.endsWith('build-css.ts')) {
  const out = join(__dirname, '..', 'dist');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'tokens.native.css'), nativeCss());
  console.log('wrote dist/tokens.native.css');
}
