/**
 * Dark-mode leak guard (QA journey J18, design critique "_journey" finding 1).
 *
 * The leaks were light values on a dark page: tab bar, Settings gear (1.24:1), lock (1.13:1),
 * back arrow (3.16:1), recording disc (3.29:1). Cause: JS-styled colours were read with
 * `tokens[useColorScheme()]`, and on web Uniwind.setTheme() does not move useColorScheme(),
 * so only class-based colours flipped. The fix is one source of truth (useScheme / useTheme in
 * lib/a11y.ts). This test keeps it that way by scanning the source:
 *   - useColorScheme() is read in one file only
 *   - tokens.light / tokens.dark / tokens[...] are read in a short, reasoned allowlist
 *   - no hex or rgb() colour literals in app code
 * Contrast of the token pairs themselves is proven in packages/design-tokens/test/tokens.test.ts.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) && !name.endsWith('.d.ts') ? [p] : [];
  });
}

const files = walk(SRC).map((p) => ({ rel: relative(SRC, p).split(sep).join('/'), text: readFileSync(p, 'utf8') }));
/** Comments are not code: strip them so a doc line that names the rule does not trip it. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const offenders = (re: RegExp, allow: string[] = []) =>
  files.filter((f) => !allow.includes(f.rel) && re.test(code(f.text))).map((f) => f.rel);

describe('theme: one source of truth for the colour scheme', () => {
  it('useColorScheme() is only read in lib/a11y.ts (everything else uses useScheme / useTheme)', () => {
    expect(offenders(/\buseColorScheme\b/, ['lib/a11y.ts'])).toEqual([]);
  });

  it('tokens.light, tokens.dark and tokens[scheme] are only read where both schemes are meant', () => {
    expect(
      offenders(/\btokens\s*(\.\s*(light|dark)\b|\[)/, [
        'lib/a11y.ts', // paletteFor(): the one place a scheme picks a palette
        'lib/billing/actions.ts', // paywall config takes explicit light and dark values
        'components/platform/toggle.tsx', // paper-white switch thumb in both themes, as iOS draws it
      ]),
    ).toEqual([]);
  });

  it('no hard-coded colour literals in app code (hex, rgb, rgba, hsl, named white and black)', () => {
    const hex = /(['"`])#[0-9a-fA-F]{3,8}\1|\[#[0-9a-fA-F]{3,8}\]|\b(?:rgba?|hsla?)\(|(?:Color|color|backgroundColor|fill|stroke)\s*[=:]\s*\{?\s*['"](?:white|black)['"]/;
    expect(
      offenders(hex, [
        'lib/auth/ui.tsx', // Google's "G" mark: brand artwork whose colours the guidelines fix
        'dev/asha-seed.ts', // fixture data, not UI
      ]),
    ).toEqual([]);
  });

  it('the navigation chrome (root stack, tabs, settings stack) takes its colours from useTheme', () => {
    for (const rel of ['app/_layout.tsx', 'app/(tabs)/_layout.tsx', 'app/settings/_layout.tsx', 'app/invite/_layout.tsx', 'app/(auth)/_layout.tsx']) {
      const f = files.find((x) => x.rel === rel)!;
      expect(f, rel).toBeDefined();
      expect(f.text, rel).toMatch(/useTheme\(\)/);
    }
  });
});
