/// <reference types="node" />
/**
 * NS-39 (FP-12): first run asks the phone for nothing, shows no teaser or price, and offers no app lock. Source
 * scans, as the design says (docs/tdd/new-scope/12-first-run-4.md section 14, FS-5, FS-8). The device half of R2 (no
 * iOS prompt through "The book is open.") is a human run on the Asha-only install; it is not claimed here.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
 */
export const withoutTypeOnly = (src: string) =>
  src.replace(/typeof\s+import\s*\(\s*['"][^'"]+['"]\s*\)/g, 'unknown').replace(/^\s*(?:import|export)\s+type\b[^;]*;/gm, '');

/** Every local file the entry reaches through `@/` or relative import, dynamic import or bare require(), itself included. */
export function importGraph(entry: string, { requires = true }: { requires?: boolean } = {}): string[] {
  const seen = new Set<string>();
  const stack = [entry];
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const m of withoutTypeOnly(read(file)).matchAll(requires ? /(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"]([^'"]+)['"]/g : /(?:\bfrom|\bimport)\s*\(?\s*['"]([^'"]+)['"]/g)) {
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
