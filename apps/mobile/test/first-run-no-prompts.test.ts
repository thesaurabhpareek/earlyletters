/// <reference types="node" />
/**
 * NS-39 (FP-12): first run asks the phone for nothing, shows no teaser or price, and offers no app lock. Source
 * scans, as the design says (docs/tdd/new-scope/12-first-run-4.md section 14, FS-5, FS-8). The device half of R2 (no
 * iOS prompt through "The book is open.") is a human run on the Asha-only install; it is not claimed here.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '..', 'src');
const ENTRY = join(SRC, 'app', 'onboarding.tsx');

/** The first-run modules named by the design: the screen, its components, its lib folder and the speech card. */
const FIRST_RUN_FILES = [
  'app/onboarding.tsx',
  'components/onboarding/child-step.logic.ts',
  'components/onboarding/language-row.logic.ts',
  'components/onboarding/new-phone-screens.tsx',
  'components/onboarding/outage-screen.tsx',
  'components/onboarding/promise-sample.logic.ts',
  'components/onboarding/promise-sample.tsx',
  'components/onboarding/signed-in-note.tsx',
  'components/onboarding/welcome-lockup.logic.ts',
  'components/onboarding/welcome-lockup.tsx',
  'components/onboarding/welcome-sign-in.tsx',
  'lib/first-run/account-books.logic.ts',
  'lib/first-run/gate.logic.ts',
  'lib/first-run/handoff.logic.ts',
  'lib/first-run/route.logic.ts',
  'lib/first-run/welcome.logic.ts',
  'components/speech/speech-consent-card.tsx',
];

/** What asks iOS for a permission, or authenticates the person. */
export const PROMPT_PATTERN = /request\w*PermissionsAsync|requestPermission|authenticateAsync|expo-notifications|expo-contacts|expo-location|expo-tracking-transparency|expo-camera|expo-media-library|expo-image-picker|expo-local-authentication|expo-apple-authentication/;
/** The Plus line, the "coming soon" family line and story cards (FS-8). */
export const TEASER_PATTERN = /\bbillingCopy\b|familyCopy\.soon|\bstories\b|storiesCopy/;

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const read = (f: string) => strip(readFileSync(f, 'utf8'));

/**
 * Type-only references are erased by the compiler and load nothing: `import type ... from '...'` and a type written
 * `typeof import('...')`. The walk drops them so it follows only what the bundle can evaluate. A runtime `import` or
 * `from` is still followed.
 *
 * Not followed: a non-literal import, `import(x)` or a `${}` template, because there is no path to read; the device run
 * covers those. Also not followed: `typeof import('x')` after `:` in an object value or a ternary, which cannot be told
 * from a type annotation without a parser (BL-1610, BL-1612).
 */
export const withoutTypeOnly = (src: string) =>
  src
    // A type alias line: everything after `=` is a type, so `typeof import('x')` there loads nothing.
    .replace(/^([ \t]*(?:export\s+)?(?:declare\s+)?type\s+[A-Za-z_$][\w$]*[^=\n]*=)[^;\n]*/gm, '$1 unknown')
    // After `:` or `as` it is a type. In a value position (`const m = typeof import('x')`) it still names a real module.
    .replace(/(?<=(?::|\bas)\s*)typeof\s+import\s*\(\s*['"][^'"]+['"]\s*\)/g, 'unknown')
    // Anchored on the `from '...'` clause, so a missing `;` cannot run on into the next statement.
    // The text before `from` may span lines only inside `{ }`, so `export type A = 1` cannot run on into the next import.
    .replace(/^[ \t]*(?:import|export)\s+type\b(?:[^'"\n{}]|\{[^{}'"]*\})*?\bfrom\s*['"][^'"\n]+['"][ \t]*;?/gm, '');

/** Not followed: `import(x)` and `${}` template specifiers (see `withoutTypeOnly`). Every local file the entry reaches through `@/` or relative import, dynamic import or bare require(), itself included. */
export function importGraph(entry: string, { requires = true }: { requires?: boolean } = {}): string[] {
  const seen = new Set<string>();
  const stack = [entry];
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const m of withoutTypeOnly(read(file)).matchAll(requires ? /(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"`]([^'"`$\n]+)['"`]/g : /(?:\bfrom|\bimport)\s*\(?\s*['"`]([^'"`$\n]+)['"`]/g)) {
      const spec = m[1]!;
      const base = spec.startsWith('@/') ? join(SRC, spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(file), spec) : null;
      if (!base) continue;
      const hit = ['.ts', '.tsx', '/index.ts', '/index.tsx'].map((e) => base + e).find(existsSync);
      if (hit) stack.push(hit);
    }
  }
  return [...seen];
}

const offenders = (files: string[], pattern: RegExp) => files.filter((f) => pattern.test(read(f))).map((f) => f.slice(SRC.length + 1));

describe('[NS-39-R2] no permission prompt in first run', () => {
  it('[NS-39-R2] the scan flags a module that asks (positive control)', () => {
    expect(PROMPT_PATTERN.test('await Notifications.requestPermissionsAsync()')).toBe(true);
    expect(PROMPT_PATTERN.test("import * as LocalAuthentication from 'expo-local-authentication'")).toBe(true);
  });

  it('[NS-39-R2] the walk drops a type-only reference but keeps a runtime one (positive control)', () => {
    const typed = "const f = require('../a') as typeof import('../app-lock/controller');\nimport type { X } from './x';";
    expect(withoutTypeOnly(typed)).not.toMatch(/app-lock\/controller|\.\/x/);
    expect(withoutTypeOnly("import { y } from '../app-lock/controller';")).toMatch(/app-lock\/controller/);
    expect(withoutTypeOnly("const m = await import('../app-lock/controller');")).toMatch(/app-lock\/controller/);
  });

  // The walk must follow a bare require() too: Metro bundles `require('./x')` like an import, and a first-run module that
  // reached an asking module through one would otherwise hide from the scan (follow-up of the NS-39 fix, #1353).
  it('[NS-39-R2] the walk follows a bare require() and a require inside a function (positive control)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'asha-walk-'));
    try {
      const w = (name: string, body: string) => writeFileSync(join(dir, name), body);
      w('entry.ts', "export const a = () => require('./viaRequire');\nconst typed = require('./typedOnly') as typeof import('./typeRef');\n");
      w('viaRequire.ts', "export const b = require(\"./deep\");\n");
      w('deep.ts', "export const c = 1;\n");
      w('typedOnly.ts', "export const d = 1;\n");
      w('typeRef.ts', "export const e = 1;\n");
      const reached = importGraph(join(dir, 'entry.ts')).map((f) => f.slice(dir.length + 1)).sort();
      expect(reached).toEqual(['deep.ts', 'entry.ts', 'typedOnly.ts', 'viaRequire.ts']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('[NS-39-R2] the walk does not read a word that merely ends in require as a require', () => {
    const dir = mkdtempSync(join(tmpdir(), 'asha-walk-'));
    try {
      writeFileSync(join(dir, 'entry.ts'), "export const a = required('./other');\nexport const b = prerequire('./other');\n");
      writeFileSync(join(dir, 'other.ts'), 'export const o = 1;\n');
      expect(importGraph(join(dir, 'entry.ts')).map((f) => f.slice(dir.length + 1))).toEqual(['entry.ts']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  /** Builds a throwaway tree, walks it from entry.ts and returns the reached file names. */
  const reach = (files: Record<string, string>, requires = true) => {
    const dir = mkdtempSync(join(tmpdir(), 'asha-walk-'));
    try {
      for (const [name, body] of Object.entries(files)) {
        mkdirSync(dirname(join(dir, name)), { recursive: true });
        writeFileSync(join(dir, name), body);
      }
      return importGraph(join(dir, 'entry.ts'), { requires }).map((f) => f.slice(dir.length + 1)).sort();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  };
  const ASKS = "import * as N from 'expo-notifications';\nexport const ask = () => N.requestPermissionsAsync();\n";

  // BL-1478 gap 1: require('./x') with a string literal. A regression guard, not a failing-first test: develop already
  // followed a bare require('./x'), so it passes on the old walk too (BL-1613). The failing-first tests are gaps 2 and 3.
  it('[BL-1613] regression guard (gap 1): a hidden asking module behind require("./x") is reached', () => {
    const got = reach({ 'entry.ts': "export const a = () => require('./hidden');\n", 'hidden.ts': ASKS });
    expect(got).toContain('hidden.ts');
  });

  // BL-1478 gap 2: typeof import() is a type only after `:` or `as` or in a type alias.
  it('[BL-1478] gap 2: typeof import() in a value position is followed; after ":", "as" or in a type alias it is not', () => {
    expect(reach({ 'entry.ts': "export const m = typeof import('./hidden');\n", 'hidden.ts': ASKS })).toContain('hidden.ts');
    expect(reach({ 'entry.ts': "export const m = [typeof import('./hidden')];\n", 'hidden.ts': ASKS })).toContain('hidden.ts');
    expect(reach({ 'entry.ts': "export const m = f(typeof import('./hidden'));\n", 'hidden.ts': ASKS })).toContain('hidden.ts');
    expect(reach({ 'entry.ts': "export let m: typeof import('./hidden');\n", 'hidden.ts': ASKS })).toEqual(['entry.ts']);
    expect(reach({ 'entry.ts': "export const m = x as typeof import('./hidden');\n", 'hidden.ts': ASKS })).toEqual(['entry.ts']);
    expect(reach({ 'entry.ts': "export type M = typeof import('./hidden');\n", 'hidden.ts': ASKS })).toEqual(['entry.ts']);
    expect(reach({ 'entry.ts': "type M = typeof import('./hidden')\nexport const a = 1;\n", 'hidden.ts': ASKS })).toEqual(['entry.ts']);
  });

  // BL-1478 gap 3: an `import type` with no trailing semicolon must not swallow the next import.
  it('[BL-1478] gap 3: an import type with no semicolon does not hide the import after it', () => {
    const files = { 'a.ts': 'export type A = 1;\n', 'hidden.ts': ASKS };
    expect(reach({ ...files, 'entry.ts': "import type { A } from './a'\nimport { ask } from './hidden'\nexport const x = ask;\n" })).toEqual(['entry.ts', 'hidden.ts']);
    expect(reach({ ...files, 'entry.ts': "import type {\n  A,\n} from './a'\nexport * from './hidden'\n" })).toEqual(['entry.ts', 'hidden.ts']);
    expect(reach({ ...files, 'entry.ts': "export type { A } from './a'\nexport { ask } from './hidden'\n" })).toEqual(['entry.ts', 'hidden.ts']);
  });

  // BL-1611: `export type A = 1` with no semicolon, then a runtime import on the next line. The type-import regex must
  // not cross a newline outside braces, or the alias line swallows the import.
  it('[BL-1611] a type alias with no semicolon does not hide the runtime import on the next line', () => {
    const hidden = { 'hidden.ts': ASKS };
    expect(reach({ ...hidden, 'entry.ts': "export type A = 1\nimport { ask } from './hidden'\nexport const x = ask;\n" })).toEqual(['entry.ts', 'hidden.ts']);
    expect(reach({ ...hidden, 'entry.ts': "export type Asha = 'Asha B'\nexport * from './hidden'\n" })).toEqual(['entry.ts', 'hidden.ts']);
    expect(withoutTypeOnly("export type A = 1\nimport { ask } from './hidden'")).toMatch(/from '\.\/hidden'/);
  });

  // BL-1610: a non-literal import is NOT followed. A computed `import(x)` and a `${}` template have no path to read, so
  // the walk cannot reach what they load. They are covered only by the device run (D13), not by this scan.
  it('[BL-1610] import(x) and a ${} template are not followed (named limit, covered by the device run only)', () => {
    const hidden = { 'hidden.ts': ASKS };
    expect(reach({ ...hidden, 'entry.ts': "const x = './hidden';\nexport const l = () => import(x);\n" })).toEqual(['entry.ts']);
    expect(reach({ ...hidden, 'entry.ts': 'const n = "hidden";\nexport const l = () => import(`./${n}`);\n' })).toEqual(['entry.ts']);
    expect(reach({ ...hidden, 'entry.ts': 'const n = "hidden";\nexport const l = () => require(`./${n}`);\n' })).toEqual(['entry.ts']);
  });

  // BL-1612: the walk reads a `typeof import(...)` after `:` as a type. An object-literal value and the false arm of a
  // ternary also sit after `:`, so they are dropped too. A named limit, not a fix: a type annotation and these two cannot
  // be told apart without a parser. Asserted so a change either way is a decision, not an accident.
  it('[BL-1612] known limit: typeof import() after ":" in an object value or a ternary is read as a type and not followed', () => {
    const hidden = { 'hidden.ts': ASKS };
    expect(reach({ ...hidden, 'entry.ts': "export const o = { m: typeof import('./hidden') };\n" })).toEqual(['entry.ts']);
    expect(reach({ ...hidden, 'entry.ts': "export const t = c ? 1 : typeof import('./hidden');\n" })).toEqual(['entry.ts']);
  });

  // The two comments above and the guard name are load-bearing (BL-1610, BL-1613): this fails if one is renamed away.
  it('[BL-1613] the require guard keeps its name and the walk doc comment still names what it does not follow', () => {
    const self = readFileSync(__filename, 'utf8');
    // Patterns are written so this test's own text cannot satisfy them.
    expect(self).toMatch(/it\('\[BL-1613\] regression guard \(gap 1\):/);
    expect(self).toMatch(/\* Not followed: a non-literal import, `import\(x\)` or a `\$\{\}` template[\s\S]*?\*\/\s*export const withoutTypeOnly/);
  });

  // The rest of the ways a module can be pulled in. Each hides an asking module one hop away; the walk must reach it.
  it('[BL-1478] a hidden asking module is reached through a dynamic import, a template import, a re-export and a barrel', () => {
    const hidden = { 'hidden.ts': ASKS };
    expect(reach({ ...hidden, 'entry.ts': "export const l = () => import('./hidden');\n" })).toContain('hidden.ts');
    expect(reach({ ...hidden, 'entry.ts': 'export const l = () => import(`./hidden`);\n' })).toContain('hidden.ts');
    expect(reach({ ...hidden, 'entry.ts': "export { ask } from './hidden';\n" })).toContain('hidden.ts');
    expect(reach({ ...hidden, 'entry.ts': "export * from './hidden';\n" })).toContain('hidden.ts');
    expect(reach({ ...hidden, 'entry.ts': "export * as h from './hidden';\n" })).toContain('hidden.ts');
    expect(reach({ ...hidden, 'entry.ts': "import './hidden';\n" })).toContain('hidden.ts');
    expect(reach({ ...hidden, 'entry.ts': "import { ask } from './lib';\n", 'lib/index.ts': "export * from '../hidden';\n" })).toContain('hidden.ts');
    expect(reach({ ...hidden, 'entry.ts': "import { ask } from './lib';\n", 'lib/index.tsx': "export { ask } from '../hidden';\n" })).toContain('hidden.ts');
  });

  it('[BL-1478] a type-only import, export or typeof import() is not followed (no false alarm)', () => {
    const hidden = { 'hidden.ts': ASKS };
    expect(reach({ ...hidden, 'entry.ts': "import type { A } from './hidden';\nexport type { B } from './hidden';\nimport type * as H from './hidden';\n" })).toEqual(['entry.ts']);
    expect(reach({ ...hidden, 'entry.ts': "import type A from './hidden'\nexport const x = 1;\n" })).toEqual(['entry.ts']);
  });

  it('[NS-39-R2] no first-run module asks for a permission or authenticates', () => {
    expect(offenders(FIRST_RUN_FILES.map((f) => join(SRC, f)), PROMPT_PATTERN)).toEqual([]);
  });

  // Import reach is coarser than a call. These four are imported by the screen's graph and ask only on a person's tap
  // elsewhere (Apple sign-in on its button; turnOnReminders from Settings). They are named so a fifth, or the lock code,
  // shows up red. The call-level proof is the device run (D13). Question FP-12-2 on the PR.
  const REACHED_NOT_CALLED = ['lib/auth/apple.ts', 'lib/auth/ui.tsx', 'lib/billing/plan-reminders.ts', 'lib/reminders/scheduler.ts'];

  it('[NS-39-R2] nothing else the first-run screen imports, at any depth, asks or authenticates', () => {
    const graph = importGraph(ENTRY, { requires: false });
    expect(graph.length).toBeGreaterThan(20); // the walk really walked
    // The lock offer and the lock controller (Face ID) must not be in the screen's tree at all.
    expect(graph.map((f) => f.slice(SRC.length + 1)).filter((f) => f.startsWith('components/app-lock/') || f === 'lib/app-lock/controller.ts')).toEqual([]);
    expect(offenders(graph, PROMPT_PATTERN).sort()).toEqual(REACHED_NOT_CALLED);
  });

  // With bare require() followed (Metro bundles it like an import) the walk reaches one more asking module: the lock
  // controller, through the one lazy `require` in lib/photos/device.ts (appLocked), which runs only when a photo pick lands
  // and so never in first run. It is named here, not allowed in general: a second lazy edge, or a lock offer, shows red.
  const REACHED_ONLY_BY_REQUIRE = ['lib/app-lock/controller.ts'];
  const LAZY_EDGE = 'lib/photos/device.ts';

  it('[NS-39-R2] following require() adds only the lock controller, and only through the one lazy edge in photos/device.ts', () => {
    const rel = (fs: string[]) => fs.map((f) => f.slice(SRC.length + 1));
    const importsOnly = new Set(importGraph(ENTRY, { requires: false }));
    const full = importGraph(ENTRY);
    const added = full.filter((f) => !importsOnly.has(f));
    expect(rel(added)).toContain('lib/app-lock/controller.ts');
    expect(rel(full).filter((f) => f.startsWith('components/app-lock/'))).toEqual([]); // the lock offer is still not in the tree
    expect(offenders(full, PROMPT_PATTERN).sort()).toEqual([...REACHED_NOT_CALLED, ...REACHED_ONLY_BY_REQUIRE].sort());
    // The edge is the one require of the lock controller in device.ts, and it sits inside a function (the other require there
    // is the native photo module, which is not an asking module).
    const device = read(join(SRC, LAZY_EDGE));
    expect([...device.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]/g)].map((m) => m[1]).filter((x) => /app-lock/.test(x!))).toEqual(['../app-lock/controller']);
    expect(device).toMatch(/function appLocked\(\)[^{]*\{\s*return \(require\(/);
    // And no other file reaches the controller through a require.
    const others = full.filter((f) => f !== join(SRC, LAZY_EDGE) && /\brequire\s*\(\s*['"][^'"]*app-lock\/controller['"]/.test(read(f))).map((f) => f.slice(SRC.length + 1));
    expect(others).toEqual([]);
  });
});

// ---- device.ts: the one file that may name the lock controller, and only lazily -------------------------------------
// lib/photos/device.ts reads the lock state when a pick lands, through one lazy `require` inside appLocked() and its
// `typeof import` type. Nothing else in it may reach app-lock. Derived from the source on develop: line 81 of device.ts
// holds exactly two "app-lock" strings (the require specifier and the typeof import specifier) and no other line holds one.
const DEVICE = join(SRC, 'lib', 'photos', 'device.ts');
export const EXPECTED_APP_LOCK_MATCHES_IN_DEVICE = 2;
/** What asks for Face ID, opens the lock, or starts the lock's own flows. */
export const LOCK_CALL_PATTERN = /authenticateAsync|\b(?:unlock|turnOn|turnOff|confirmForExport|whileSharing|startAppLock|markPrompted|readLockAbility)\w*\(/;

/** Which of the device.ts lock rules a source breaks. Empty means it keeps all of them. Comments are stripped first. */
export function lockRuleBreaks(raw: string): string[] {
  const src = strip(raw);
  const breaks: string[] = [];
  if ((src.match(/app-lock/g) ?? []).length !== EXPECTED_APP_LOCK_MATCHES_IN_DEVICE) breaks.push('NS-39-R2-1');
  if (/\bexport\b[^;]*?\bfrom\s*['"][^'"]*app-lock/.test(src)) breaks.push('NS-39-R2-2');
  if (/^(?=\S).*?\brequire\s*\(\s*['"][^'"]*app-lock/m.test(src)) breaks.push('NS-39-R2-3');
  if (LOCK_CALL_PATTERN.test(src)) breaks.push('NS-39-R2-4');
  return breaks;
}

describe('[NS-39-R2] device.ts reaches the lock only through its lazy read', () => {
  const GOOD = "function appLocked(): boolean {\n  return (require('../app-lock/controller') as typeof import('../app-lock/controller')).getAppLockState().locked;\n}\n";

  it('[NS-39-R2] positive control: the lazy read passes, and an extra app-lock mention is counted', () => {
    expect(lockRuleBreaks(GOOD)).toEqual([]);
    expect(lockRuleBreaks(GOOD + "import { getAppLockState } from '../app-lock/controller';\n")).toContain('NS-39-R2-1');
    expect(lockRuleBreaks(GOOD + "const m = await import('../app-lock/prefs');\n")).toContain('NS-39-R2-1');
  });

  it('[NS-39-R2] device.ts holds exactly the expected number of app-lock matches', () => {
    const src = strip(readFileSync(DEVICE, 'utf8'));
    expect((src.match(/app-lock/g) ?? []).length).toBe(EXPECTED_APP_LOCK_MATCHES_IN_DEVICE);
    // After type-only references are erased, one runtime reference is left: the lazy require.
    expect((withoutTypeOnly(src).match(/app-lock/g) ?? []).length).toBe(1);
  });

  it('[NS-39-R2] positive control: a re-export of the lock is caught', () => {
    expect(lockRuleBreaks(GOOD + "export { getAppLockState } from '../app-lock/controller';\n")).toContain('NS-39-R2-2');
    expect(lockRuleBreaks(GOOD + "export * from '../app-lock/controller';\n")).toContain('NS-39-R2-2');
    expect(lockRuleBreaks(GOOD + "export {\n  getAppLockState,\n} from \"../app-lock/controller\";\n")).toContain('NS-39-R2-2');
  });

  it('[NS-39-R2] device.ts re-exports nothing from the lock', () => {
    expect(strip(readFileSync(DEVICE, 'utf8'))).not.toMatch(/\bexport\b[^;]*?\bfrom\s*['"][^'"]*app-lock/);
  });

  it('[NS-39-R2] positive control: a top-level require of the lock is caught, an indented lazy one is not', () => {
    expect(lockRuleBreaks(GOOD + "const lock = require('../app-lock/controller');\n")).toContain('NS-39-R2-3');
    expect(lockRuleBreaks(GOOD + "require('../app-lock/controller');\n")).toContain('NS-39-R2-3');
    expect(lockRuleBreaks(GOOD).includes('NS-39-R2-3')).toBe(false);
  });

  it('[NS-39-R2] device.ts has no require of the lock at the top level of the file', () => {
    expect(strip(readFileSync(DEVICE, 'utf8'))).not.toMatch(/^(?=\S).*?\brequire\s*\(\s*['"][^'"]*app-lock/m);
  });

  it('[NS-39-R2] positive control: the lock calls are flagged, a name that only looks similar is not', () => {
    for (const call of ['authenticateAsync(opts)', 'unlockApp()', 'turnOnAppLock()', 'turnOffLock()', 'confirmForExport()', 'whileSharing(fn)', 'startAppLock()', 'markPrompted()', 'readLockAbility()']) {
      expect(LOCK_CALL_PATTERN.test(call), call).toBe(true);
    }
    expect(LOCK_CALL_PATTERN.test('getAppLockState().locked')).toBe(false);
    expect(LOCK_CALL_PATTERN.test('const unlocked = false;')).toBe(false);
  });

  it('[NS-39-R2] device.ts makes none of those calls', () => {
    expect(strip(readFileSync(DEVICE, 'utf8'))).not.toMatch(LOCK_CALL_PATTERN);
  });

  it('[NS-39-R2] the whole file keeps every rule (Asha photo path)', () => {
    expect(lockRuleBreaks(readFileSync(DEVICE, 'utf8'))).toEqual([]);
    // mutant in memory: each offending line added to the real source is caught by the rule it targets
    const real = readFileSync(DEVICE, 'utf8');
    expect(lockRuleBreaks(real + "\nexport { getAppLockState } from '../app-lock/controller';\n")).toContain('NS-39-R2-2');
    expect(lockRuleBreaks(real + "\nconst lock = require('../app-lock/controller');\n")).toContain('NS-39-R2-3');
    expect(lockRuleBreaks(real + "\nconst ok = await LocalAuthentication.authenticateAsync();\n")).toContain('NS-39-R2-4');
    expect(lockRuleBreaks(real + "\nconst a = '../app-lock/prefs';\n")).toContain('NS-39-R2-1');
  });
});

describe('[NS-39-R12] first run shows no teaser and no price', () => {
  it('[NS-39-R12] the scan flags a teaser (positive control)', () => {
    expect(TEASER_PATTERN.test("import { billingCopy } from '@/lib/billing/copy'")).toBe(true);
    expect(TEASER_PATTERN.test('familyCopy.soon.title')).toBe(true);
  });

  it('[NS-39-R12] no first-run module reads billingCopy, familyCopy.soon or a story card', () => {
    expect(offenders(FIRST_RUN_FILES.map((f) => join(SRC, f)), TEASER_PATTERN)).toEqual([]);
  });
});

describe('[NS-39-R9] no lock offer at the end of first run', () => {
  it('[NS-39-R9] "The book is open." mounts no LockOffer and imports no lock code', () => {
    const body = read(ENTRY);
    expect(body).not.toMatch(/LockOffer|lock-offer|app-lock\//);
  });
});
