/// <reference types="node" />
/**
 * [G4] Module boundaries (docs/engineering/readiness-20nov/performance/CODE-QUALITY-GATES.md section 2, row G4;
 * CODE-R10 and CODE-R11 of docs/engineering/01-code-and-change.md). A source scan, no dependency. It moves to
 * ESLint `no-restricted-imports` when the lint gate (G2) lands.
 *
 *  (a) CODE-R10: `packages/* /src` imports none of `react-native`, `expo*`, `node:*`.
 *  (b) CODE-R11: `src/components/**` and `src/app/**` import neither `expo-sqlite`, `src/lib/db/*`, nor a native
 *      audio or file module (`expo-audio`, `expo-av`, `expo-file-system`, `modules/scribe-audio`, `modules/scribe-files`).
 *  (c) Nothing under `packages` imports `apps/mobile` (relative path, `@/` alias or `apps/...`).
 *  (d) `packages/core/src` imports only `packages/core`: no bare package, no path leaving the package.
 *
 * Type-only imports (`import type`, `export type ... from`) are erased at build time and are not counted.
 * Comments are ignored, so a note that names a module is fine; an import is not.
 *
 * KNOWN is the ratchet: the places that break a rule on the day this gate landed. An entry may only be removed.
 * An entry that no longer matches a real import fails the test, so the list cannot go stale. A new file, or a new
 * module in a listed file, is red.
 */
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..', '..', '..');
const MOBILE_SRC = join(ROOT, 'apps', 'mobile', 'src');

/** Rule id and "<repo-relative file>::<specifier>" of each import that breaks it today. Reason beside each. */
const KNOWN: Record<string, string[]> = {
  // Build-time scripts run by node (they write css and a png; the emails sender reads a template). Not bundled
  // into the app, Deno or Next. Question for principal-architect: move to a scripts folder or keep as known.
  a: [
    'packages/design-tokens/src/build-css.ts::node:fs',
    'packages/design-tokens/src/build-css.ts::node:path',
    'packages/design-tokens/src/build-grain.ts::node:fs',
    'packages/design-tokens/src/build-grain.ts::node:path',
    'packages/design-tokens/src/build-grain.ts::node:url',
    'packages/design-tokens/src/build-grain.ts::node:zlib',
    'packages/emails/src/send.ts::node:fs',
    'packages/emails/src/send.ts::node:path',
  ],
  // The recorder and the player screens still read and write the take through the native modules themselves.
  // CODE-R11 says they call `src/lib` instead. Finding for mobile: move both behind `lib/capture` and delete these.
  b: [
    'apps/mobile/src/app/listen.tsx::expo-audio',
    'apps/mobile/src/app/listen.tsx::expo-file-system',
    'apps/mobile/src/app/review.tsx::expo-audio',
    'apps/mobile/src/app/review.tsx::expo-file-system',
  ],
  c: [],
  d: [],
};

const NATIVE_AUDIO_FILE = ['expo-audio', 'expo-av', 'expo-file-system'];

/** Strip block comments and whole-line or trailing `//` comments (a `//` after `:` is a url, kept). */
export function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

/** Value import specifiers of a source text: static, re-export, side-effect, dynamic and require. */
export function importSpecifiers(source: string): string[] {
  const src = stripComments(source);
  const out: string[] = [];
  const add = (re: RegExp, group: number, skip?: (m: RegExpExecArray) => boolean) => {
    for (let m = re.exec(src); m; m = re.exec(src)) if (!skip?.(m)) out.push(m[group]);
  };
  add(/\b(import|export)\s+(type\b)?[^'";]*?\bfrom\s*['"]([^'"]+)['"]/g, 3, (m) => m[2] !== undefined);
  add(/\bimport\s*['"]([^'"]+)['"]/g, 1);
  add(/\b(?:import|require)\(\s*['"]([^'"]+)['"]\s*\)/g, 1);
  return out;
}

/** Absolute target of a path-like specifier, or null for a bare package. `@/` is apps/mobile/src. */
export function resolveSpecifier(file: string, spec: string): string | null {
  if (spec.startsWith('@/')) return join(MOBILE_SRC, spec.slice(2));
  if (spec.startsWith('.')) return resolve(dirname(file), spec);
  if (spec.startsWith('apps/')) return join(ROOT, spec);
  return null;
}

const inside = (path: string, dir: string) => path === dir || path.startsWith(dir + sep);

function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...sourceFiles(p));
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) && !e.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

const isPlatform = (s: string) => s === 'react-native' || s.startsWith('react-native/') || s.startsWith('expo') || s.startsWith('node:');

/** Rule a, c and d for one file under `packages/<pkg>/src`. Returns the broken rule ids with the specifier. */
export function packageViolations(file: string, spec: string, pkg: string): string[] {
  const hit: string[] = [];
  const target = resolveSpecifier(file, spec);
  if (isPlatform(spec)) hit.push('a');
  if (target && inside(target, join(ROOT, 'apps'))) hit.push('c');
  if (pkg === 'core') {
    const core = join(ROOT, 'packages', 'core');
    if (target === null ? spec !== '@scribe/core' : !inside(target, core)) hit.push('d');
  }
  return hit;
}

/** Rule b for one file under `apps/mobile/src/app` or `components`. */
export function screenViolation(file: string, spec: string): boolean {
  const target = resolveSpecifier(file, spec);
  if (target) {
    const modules = join(ROOT, 'apps', 'mobile', 'modules');
    return inside(target, join(MOBILE_SRC, 'lib', 'db')) || inside(target, join(modules, 'scribe-audio')) || inside(target, join(modules, 'scribe-files'));
  }
  return ['expo-sqlite', ...NATIVE_AUDIO_FILE].some((m) => spec === m || spec.startsWith(m + '/'));
}

function scan(): Record<string, string[]> {
  const found: Record<string, string[]> = { a: [], b: [], c: [], d: [] };
  const rel = (f: string) => relative(ROOT, f).split(sep).join('/');
  const packagesDir = join(ROOT, 'packages');
  for (const pkg of readdirSync(packagesDir)) {
    for (const file of sourceFiles(join(packagesDir, pkg, 'src'))) {
      for (const spec of importSpecifiers(readFileSync(file, 'utf8'))) {
        for (const rule of packageViolations(file, spec, pkg)) found[rule].push(`${rel(file)}::${spec}`);
      }
    }
  }
  for (const dir of ['app', 'components']) {
    for (const file of sourceFiles(join(MOBILE_SRC, dir))) {
      for (const spec of importSpecifiers(readFileSync(file, 'utf8'))) {
        if (screenViolation(file, spec)) found.b.push(`${rel(file)}::${spec}`);
      }
    }
  }
  for (const k of Object.keys(found)) found[k] = [...new Set(found[k])].sort();
  return found;
}

describe('[G4] module boundaries (CODE-R10, CODE-R11)', () => {
  const found = scan();
  const label: Record<string, string> = {
    a: '[G4] CODE-R10: packages/*/src import no react-native, expo* or node:*',
    b: '[G4] CODE-R11: screens and components import no expo-sqlite, lib/db or native audio and file module',
    c: '[G4] nothing under packages imports apps/mobile',
    d: '[G4] packages/core imports only packages/core',
  };
  for (const rule of ['a', 'b', 'c', 'd']) {
    it(label[rule], () => {
      const known = [...KNOWN[rule]].sort();
      expect(found[rule].filter((x) => !known.includes(x)), 'new boundary break (fix the import, do not add to KNOWN)').toEqual([]);
      expect(known.filter((x) => !found[rule].includes(x)), 'listed break is gone: remove it from KNOWN (the list only shrinks)').toEqual([]);
    });
  }
  it('[G4] the scan reads real files (a scan of nothing would pass)', () => {
    expect(sourceFiles(join(ROOT, 'packages', 'core', 'src')).length).toBeGreaterThan(10);
    expect(sourceFiles(join(MOBILE_SRC, 'components')).length).toBeGreaterThan(50);
    expect(sourceFiles(join(MOBILE_SRC, 'app')).length).toBeGreaterThan(10);
  });
});

describe('[G4] the import reader and the rules, self-tests', () => {
  const f = join(MOBILE_SRC, 'components', 'x', 'a.tsx');
  it('reads static, multi-line, re-export, side-effect, dynamic and require imports', () => {
    const src = "import a from 'one';\nimport {\n  b,\n  c,\n} from \"two\";\nexport * from 'three';\nimport 'four';\nconst d = await import('five');\nconst e = require('six');";
    expect(importSpecifiers(src)).toEqual(['one', 'two', 'three', 'four', 'five', 'six']);
  });
  it('skips type-only imports, comments and strings that only look like imports', () => {
    const src = "import type { A } from 'expo-audio';\nexport type { B } from 'expo-audio';\n// import x from 'expo-sqlite';\n/* import y from 'expo-sqlite'; */\n/**\n * import z from 'expo-sqlite'\n */\nconst u = 'https://example.com/from';";
    expect(importSpecifiers(src)).toEqual([]);
  });
  it('rule a: flags react-native, expo and node: and passes a relative path and a plain package', () => {
    const file = join(ROOT, 'packages', 'content', 'src', 'x.ts');
    for (const bad of ['react-native', 'react-native/Libraries/x', 'expo-crypto', 'expo', 'node:fs']) expect(packageViolations(file, bad, 'content')).toContain('a');
    for (const ok of ['./y', '../z', 'zod', 'nodemailer']) expect(packageViolations(file, ok, 'content')).not.toContain('a');
  });
  it('rule c: flags the @/ alias, apps/ and a relative path that leaves for apps', () => {
    const file = join(ROOT, 'packages', 'api', 'src', 'server', 'x.ts');
    for (const bad of ['@/lib/store', 'apps/mobile/src/lib/store', '../../../../apps/mobile/src/lib/store']) expect(packageViolations(file, bad, 'api')).toContain('c');
    for (const ok of ['./y', '../index', '@scribe/core']) expect(packageViolations(file, ok, 'api')).not.toContain('c');
  });
  it('rule d: core allows its own files and itself; flags another package, a bare package and a path out', () => {
    const file = join(ROOT, 'packages', 'core', 'src', 'x.ts');
    for (const bad of ['@scribe/content', 'zod', '../../content/src/index', '../../../packages/api/src/index']) expect(packageViolations(file, bad, 'core')).toContain('d');
    for (const ok of ['./verify', '../src/types', '@scribe/core']) expect(packageViolations(file, ok, 'core')).not.toContain('d');
  });
  it('rule b: flags expo-sqlite, lib/db by alias and by relative path, and the native audio and file modules', () => {
    for (const bad of ['expo-sqlite', 'expo-sqlite/next', '@/lib/db', '@/lib/db/repos/entries', '../../lib/db/sql', 'expo-audio', 'expo-av', 'expo-file-system', 'expo-file-system/legacy', '../../../modules/scribe-audio', '../../../modules/scribe-files']) {
      expect(screenViolation(f, bad), bad).toBe(true);
    }
    for (const ok of ['@/lib/store', '@/lib/dbx', '../../lib/capture', 'expo-router', 'expo-file-systems', 'expo-haptics', '../../../modules/scribe-store/types', 'react-native']) {
      expect(screenViolation(f, ok), ok).toBe(false);
    }
  });
  it('a planted forbidden import in a scratch tree is found through the whole chain', () => {
    const dir = mkdtempSync(join(tmpdir(), 'g4-'));
    try {
      mkdirSync(join(dir, 'src'));
      const file = join(dir, 'src', 'bad.ts');
      writeFileSync(file, "import { Platform } from 'react-native';\nexport const p = Platform.OS;\n");
      expect(importSpecifiers(readFileSync(file, 'utf8')).filter(isPlatform)).toEqual(['react-native']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
