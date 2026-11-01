/**
 * Generates CSS variables from tokens.ts for Uniwind (mobile) and shadcn/ui (web).
 * Run: npm run build -w @scribe/design-tokens
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
 *
 * `input` is the boundary of a control, so it maps to controlBorder (3:1, WCAG 1.4.11),
 * not to the decorative `line` (1.26:1). `border` stays decorative (dividers, card edges).
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
  destructive: 'destructive',
  'destructive-foreground': 'onDestructive',
  border: 'line',
  input: 'controlBorder',
  ring: 'focus',
};
/** Our names with no shadcn equivalent. */
const EXTRA: ColorKey[] = ['surface', 'surfaceRaised', 'recording', 'success', 'caution', 'controlBorder', 'editMark', 'onDestructive', 'scrim'];

export function colorVars(mode: Mode, highContrast = false): Record<string, string> {
  const c: Record<ColorKey, string> = { ...tokens[mode], ...(highContrast ? tokens.highContrast[mode] : {}) };
  const out: Record<string, string> = {};
  for (const [name, key] of Object.entries(SHADCN)) out[name] = c[key];
  for (const key of EXTRA) out[kebab(key)] = c[key];
  return out;
}

const px = (n: number) => `${n}px`;

/** Type ramp as Tailwind v4 theme variables: `text-letter-body`, `text-caption`, ... */
function typeVars(): string {
  return Object.entries(tokens.type)
    .map(([name, t]) => {
      const k = kebab(name);
      return [
        `  --text-${k}: ${px(t.fontSize)};`,
        `  --text-${k}--line-height: ${px(t.lineHeight)};`,
        `  --text-${k}--letter-spacing: ${px(t.letterSpacing)};`,
      ].join('\n');
    })
    .join('\n');
}

function radiusVars(): string {
  return Object.entries(tokens.radius)
    .map(([k, v]) => `  --radius-${k}: ${v === 9999 ? '9999px' : `${v}px`};`)
    .join('\n');
}

export function nativeCss(): string {
  const block = (mode: Mode) =>
    Object.entries(colorVars(mode))
      .map(([k, v]) => `      --color-${k}: ${v};`)
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
${radiusVars()}
${typeVars()}
}
`;
}

/**
 * Web flavour (shadcn convention: :root light, .dark class, plus prefers-color-scheme
 * and prefers-contrast). Font stacks live here only: on native, faces are applied by
 * the Text component (apps/mobile/src/components/ui/text.tsx) once the fonts load.
 */
export function webCss(): string {
  const block = (mode: Mode, hc = false, indent = '  ') =>
    Object.entries(colorVars(mode, hc))
      .map(([k, v]) => `${indent}--color-${k}: ${v};`)
      .join('\n');
  const f = tokens.fontFamily;
  return `/* GENERATED from packages/design-tokens/src/tokens.ts. Do not edit by hand. */
:root {
${block('light')}
}
.dark {
${block('dark')}
}
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
${block('dark', false, '    ')}
  }
}
@media (prefers-contrast: more) {
  :root {
${block('light', true, '    ')}
  }
  .dark {
${block('dark', true, '    ')}
  }
}

@theme {
  --font-sans: ${f.webSans};
  --font-serif: ${f.webSerif};
  --spacing: 4px;
${radiusVars()}
${typeVars()}
${Object.entries(tokens.elevation)
  .map(([k, e]) => `  --shadow-e${k}: ${e.web};`)
  .join('\n')}
  --ease-standard: cubic-bezier(${tokens.motion.easing.join(', ')});
  --duration-fade: ${tokens.motion.fadeMs}ms;
  --duration-enter: ${tokens.motion.enter.durationMs}ms;
}
`;
}

if (process.argv[1]?.endsWith('build-css.ts')) {
  const out = join(__dirname, '..', 'dist');
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'tokens.native.css'), nativeCss());
  writeFileSync(join(out, 'tokens.web.css'), webCss());
  console.log('wrote dist/tokens.native.css and dist/tokens.web.css');
}
