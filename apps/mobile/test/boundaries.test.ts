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
 * Type-only imports (`import type`, `export type ... from`, `import { type A }` with every name typed) are erased at
 * build time and are not counted; `import type from 'x'` (a default import named `type`) is a value import.
 * Comments are ignored, so a note that names a module is fine; an import is not. The reader is shared with
 * import-graph.test.ts (`helpers/import-reader.ts`).
 * A dynamic `import(x)` or `require(x)` whose argument is not a plain string cannot be read: it fails the test.
 * A source root that exists but is not scanned fails the test unless UNSCANNED lists it with a reason.
 *
 * KNOWN is the ratchet: the places that break a rule on the day this gate landed. An entry may only be removed.
 * An entry that no longer matches a real import fails the test, so the list cannot go stale. A new file, or a new
 * module in a listed file, is red.
 */
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dynamicImports, importSpecifiers as staticSpecifiers } from './helpers/import-reader';

const ROOT = resolve(__dirname, '..', '..', '..');
const MOBILE_SRC = join(ROOT, 'apps', 'mobile', 'src');

type Known = Array<{ at: string; reason: string }>;

/** Rule id and each "<repo-relative file>::<specifier>" that breaks it today, with the reason it is allowed. */
const KNOWN: Record<string, Known> = {
  // Build-time scripts run by node (they write css and a png; the emails sender reads a template). Not bundled
  // into the app, Deno or Next. Question for principal-architect: move to a scripts folder or keep as known.
  a: [
    ...['build-css.ts::node:fs', 'build-css.ts::node:path', 'build-grain.ts::node:fs', 'build-grain.ts::node:path', 'build-grain.ts::node:url', 'build-grain.ts::node:zlib'].map((x) => ({
      at: `packages/design-tokens/src/${x}`,
      reason: 'build-time script run by node, writes css or a png, never bundled',
    })),
    ...['send.ts::node:fs', 'send.ts::node:path'].map((x) => ({ at: `packages/emails/src/${x}`, reason: 'emails sender reads a template from disk, runs in node only' })),
  ],
  // The recorder and the player screens still read and write the take through the native modules themselves.
  // CODE-R11 says they call `src/lib` instead. Finding for mobile: move both behind `lib/capture` and delete these.
  b: ['listen.tsx::expo-audio', 'listen.tsx::expo-file-system', 'review.tsx::expo-file-system'].map((x) => ({
    at: `apps/mobile/src/app/${x}`,
    reason: 'screen still talks to the native module; move behind lib/capture (finding for mobile)',
  })),
  c: [],
  d: [],
};

/** The ratchet count per rule. Raising a number needs a written reason in the PR body; lowering it is the goal. */
const KNOWN_COUNT: Record<string, number> = { a: 8, b: 3, c: 0, d: 0 };

/** Folders under `apps/mobile/src` that no rule scans, each with why. A new folder must be scanned or listed here. */
const UNSCANNED_MOBILE: Record<string, string> = {
  lib: 'the layer that is allowed to use native and db modules (CODE-R11 points screens at it)',
  dev: 'developer-only screens and tools, not shipped in the release bundle',
  generated: 'machine-written output, no hand-written imports',
};
const SCANNED_MOBILE = ['app', 'components'];

/** Source files in a package outside `src`, each with why rule a, c and d do not read them. Key: "<pkg>/<entry>". */
const UNSCANNED_PACKAGE: Record<string, string> = {
  'api/server.ts': 'server entry point, runs in Deno and node, not in the app',
  'brand/index.ts': 'the brand package has no src folder; plain data, no imports',
  'brand/registry.ts': 'the brand package has no src folder; plain data, no imports',
  'analytics/scripts': 'ops scripts run by node, not bundled',
  'emails/scripts': 'build scripts run by node, not bundled',
};

const NATIVE_AUDIO_FILE = ['expo-audio', 'expo-av', 'expo-file-system'];

/** Value import specifiers of a source text: static, re-export, side-effect, require and dynamic with a plain string. */
export function importSpecifiers(source: string): string[] {
  return [...staticSpecifiers(source), ...dynamicImports(source).literal];
}

/** Dynamic `import(x)` and `require(x)` calls the reader cannot resolve to a module name. */
export function unresolvedCalls(source: string): string[] {
  return dynamicImports(source).unresolved;
}

/**
 * Source folders and files that exist but no rule reads: a folder under `apps/mobile/src` that is neither scanned nor
 * in `unscannedMobile`, and a source file or folder beside `src` in a package that is not in `unscannedPackage`.
 */
export function unreadRoots(packagesDir: string, mobileSrc: string, unscannedMobile: Record<string, string>, unscannedPackage: Record<string, string>): string[] {
  const out: string[] = [];
  const hasSource = (p: string, isDir: boolean) => (isDir ? sourceFiles(p).length > 0 : /\.tsx?$/.test(p) && !p.endsWith('.d.ts'));
  const skip = /^(src|test|node_modules|dist|generated|fonts|textures|assets)$|^vitest.*\.config\.ts$/;
  if (existsSync(mobileSrc)) {
    for (const e of readdirSync(mobileSrc, { withFileTypes: true })) {
      if (e.isDirectory() && !SCANNED_MOBILE.includes(e.name) && !(e.name in unscannedMobile) && hasSource(join(mobileSrc, e.name), true)) out.push(`apps/mobile/src/${e.name}`);
    }
  }
  for (const pkg of readdirSync(packagesDir)) {
    for (const e of readdirSync(join(packagesDir, pkg), { withFileTypes: true })) {
      if (skip.test(e.name) || e.name in unscannedPackage || `${pkg}/${e.name}` in unscannedPackage) continue;
      if (hasSource(join(packagesDir, pkg, e.name), e.isDirectory())) out.push(`packages/${pkg}/${e.name}`);
    }
  }
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

export function scan(root: string = ROOT): Record<string, string[]> {
  const mobileSrc = join(root, 'apps', 'mobile', 'src');
  const found: Record<string, string[]> = { a: [], b: [], c: [], d: [], unresolved: [] };
  const rel = (f: string) => relative(root, f).split(sep).join('/');
  const packagesDir = join(root, 'packages');
  for (const pkg of existsSync(packagesDir) ? readdirSync(packagesDir) : []) {
    for (const file of sourceFiles(join(packagesDir, pkg, 'src'))) {
      found.unresolved.push(...unresolvedCalls(readFileSync(file, 'utf8')).map((c) => `${rel(file)}::${c}`));
      for (const spec of importSpecifiers(readFileSync(file, 'utf8'))) {
        for (const rule of packageViolations(file, spec, pkg)) found[rule].push(`${rel(file)}::${spec}`);
      }
    }
  }
  for (const dir of ['app', 'components']) {
    for (const file of sourceFiles(join(mobileSrc, dir))) {
      found.unresolved.push(...unresolvedCalls(readFileSync(file, 'utf8')).map((c) => `${rel(file)}::${c}`));
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
      const known = KNOWN[rule].map((k) => k.at).sort();
      expect(found[rule].filter((x) => !known.includes(x)), 'new boundary break (fix the import, do not add to KNOWN)').toEqual([]);
      expect(known.filter((x) => !found[rule].includes(x)), 'listed break is gone: remove it from KNOWN (the list only shrinks)').toEqual([]);
    });
  }
  it('[G4] every KNOWN entry carries a reason and the count is pinned (the list does not grow without a written reason)', () => {
    for (const rule of Object.keys(KNOWN)) {
      expect(KNOWN[rule].filter((k) => k.reason.trim().length < 15).map((k) => k.at), `rule ${rule}: entry without a reason`).toEqual([]);
      expect(KNOWN[rule].length, `rule ${rule}: KNOWN grew or shrank; update KNOWN_COUNT and give the reason in the PR body`).toBe(KNOWN_COUNT[rule]);
    }
  });
  it('[G4] no dynamic import() or require() with a variable or template argument (the gate cannot read where it points)', () => {
    expect(found.unresolved, 'use a plain string in import(), or add the module to a rule here with a reason').toEqual([]);
  });
  it('[G4] no source root exists that the scan does not read', () => {
    expect(unreadRoots(join(ROOT, 'packages'), MOBILE_SRC, UNSCANNED_MOBILE, UNSCANNED_PACKAGE), 'scan it, or list it in UNSCANNED_* with a reason').toEqual([]);
  });
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
    expect(importSpecifiers(src)).toEqual(['one', 'two', 'three', 'four', 'six', 'five']);
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

describe('[G4] hardening, self-tests', () => {
  it('a dynamic import or require with a variable, template or concatenation is unresolved; a plain string is read', () => {
    const src = "const a = await import(name);\nconst b = await import(`./x/${n}`);\nconst c = require('p' + q);\nconst d = await import('expo-audio');\nconst e = await import(`expo-av`);\nfoo.import(z);";
    expect(unresolvedCalls(src)).toEqual(['import(name)', 'import(`./x/${n}`)', "require('p' + q)"]);
    expect(importSpecifiers(src)).toEqual(['expo-audio', 'expo-av']);
  });
  it('import type: erased forms are skipped, a default import named type and a mixed list are values', () => {
    expect(importSpecifiers("import type { A } from 'expo-audio';\nimport { type B, type C } from 'expo-av';\nexport type * from 'expo-sqlite';\nimport type D from 'expo-file-system';")).toEqual([]);
    expect(importSpecifiers("import type from 'expo-audio';\nimport { type A, b } from 'expo-av';\nimport d, { type E } from 'expo-sqlite';")).toEqual(['expo-audio', 'expo-av', 'expo-sqlite']);
  });
  it('a "/*" inside a string or a regex does not hide a later import', () => {
    const src = "const g = 'src/*';\nconst r = /a\\/*/;\nimport a from 'expo-audio';\nconst h = \"x/*\";\nimport b from 'expo-av';";
    expect(importSpecifiers(src)).toEqual(['expo-audio', 'expo-av']);
  });
  it('a "/*" in JSX text does not hide a later import; a real JSX comment still does not count', () => {
    expect(importSpecifiers("const a = <Text>packages/* are shared</Text>;\nimport a from 'expo-audio';\nconst c = 1; /* closes here */")).toEqual(['expo-audio']);
    expect(importSpecifiers("const a = <Text>/* note</Text>;\nimport a from 'expo-av';")).toEqual(['expo-av']);
    expect(importSpecifiers("const a = <View>{/* import x from 'expo-sqlite'; */}</View>;\nimport b from 'expo-av';")).toEqual(['expo-av']);
    expect(importSpecifiers("const s='/*'; import a from 'expo-audio'; const t='*/';")).toEqual(['expo-audio']);
  });
  it('a require() with a backtick string is read; one with ${} is unresolved', () => {
    expect(importSpecifiers('const a = require(`expo-audio`);\nconst b = require("expo-av");')).toEqual(['expo-audio', 'expo-av']);
    expect(importSpecifiers('const a = require(`./x/${n}`);')).toEqual([]);
    expect(unresolvedCalls('const a = require(`./x/${n}`);')).toEqual(['require(`./x/${n}`)']);
  });
  it('scan() reads a given root: a planted break under packages and components is found, and an unresolved call in each is listed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'g4-'));
    try {
      for (const d of [join(dir, 'packages', 'p', 'src'), join(dir, 'apps', 'mobile', 'src', 'components'), join(dir, 'apps', 'mobile', 'src', 'app')]) mkdirSync(d, { recursive: true });
      writeFileSync(join(dir, 'packages', 'p', 'src', 'a.ts'), "import { Platform } from 'react-native';\nconst m = await import(name);\n");
      writeFileSync(join(dir, 'apps', 'mobile', 'src', 'components', 'b.tsx'), "import { open } from 'expo-sqlite';\nconst m = await import(other);\n");
      writeFileSync(join(dir, 'apps', 'mobile', 'src', 'app', 'c.tsx'), "import { open } from 'expo-audio';\n");
      const got = scan(dir);
      expect(got.a).toEqual(['packages/p/src/a.ts::react-native']);
      expect(got.b).toEqual(['apps/mobile/src/app/c.tsx::expo-audio', 'apps/mobile/src/components/b.tsx::expo-sqlite']);
      expect(got.unresolved).toEqual(['apps/mobile/src/components/b.tsx::import(other)', 'packages/p/src/a.ts::import(name)']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('a regex literal after if(), while(), for() or return does not hide an import on the same line', () => {
    expect(importSpecifiers("if (x) /\\/\\//.test(s); import a from 'expo-audio';")).toEqual(['expo-audio']);
    expect(importSpecifiers("while (x) /\\/\\//.test(s); import a from 'expo-av';")).toEqual(['expo-av']);
    expect(importSpecifiers("function f() { return /\\/\\//.test(s); } import a from 'expo-sqlite';")).toEqual(['expo-sqlite']);
    expect(importSpecifiers("const q = (a + b) / 2; // import z from 'expo-audio'\nimport c from 'expo-av';")).toEqual(['expo-av']);
  });
  it('an unread root is reported: a new folder under src, a new file beside a package src; a listed one is not', () => {
    const dir = mkdtempSync(join(tmpdir(), 'g4-'));
    try {
      const pk = join(dir, 'packages');
      const ms = join(dir, 'mobile-src');
      for (const d of [join(pk, 'p', 'src'), join(pk, 'p', 'tools'), join(pk, 'p', 'test'), join(ms, 'app'), join(ms, 'lib'), join(ms, 'extra')]) mkdirSync(d, { recursive: true });
      for (const f of [join(pk, 'p', 'src', 'a.ts'), join(pk, 'p', 'tools', 'b.ts'), join(pk, 'p', 'test', 'c.ts'), join(pk, 'p', 'main.ts'), join(pk, 'p', 'vitest.x.config.ts'), join(ms, 'lib', 'd.ts'), join(ms, 'extra', 'e.ts')]) writeFileSync(f, 'export const x = 1;\n');
      expect(unreadRoots(pk, ms, { lib: 'why' }, {}).sort()).toEqual(['apps/mobile/src/extra', 'packages/p/main.ts', 'packages/p/tools']);
      expect(unreadRoots(pk, ms, { lib: 'why', extra: 'why' }, { 'p/main.ts': 'why', 'p/tools': 'why' })).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
