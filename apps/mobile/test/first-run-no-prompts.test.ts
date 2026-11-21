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

// `typeof import('x')` is a type position: it is erased at build and loads nothing, so it is not an edge in the graph.
// (lib/photos/device.ts reads the lock state with a lazy require and types it this way; the walk must not call that a load.)
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/typeof\s+import\s*\(\s*['"][^'"]+['"]\s*\)/g, 'unknown');
const read = (f: string) => strip(readFileSync(f, 'utf8'));

/** Every local file the entry reaches through `@/` or relative imports, itself included. */
export function importGraph(entry: string): string[] {
  const seen = new Set<string>();
  const stack = [entry];
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const m of read(file).matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
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

  it('[NS-39-R2] control: the walk still follows a real import of the lock controller, and skips a type-only one', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ns39-walk-'));
    try {
      writeFileSync(join(dir, 'lock.ts'), 'export const x = 1;');
      writeFileSync(join(dir, 'static.ts'), "import { x } from './lock';\nexport const y = x;");
      writeFileSync(join(dir, 'dynamic.ts'), "import('./lock');\nexport const y = 1;");
      writeFileSync(join(dir, 'typeonly.ts'), "export const y = (require('./lock') as typeof import('./lock')).x;");
      expect(importGraph(join(dir, 'static.ts')).map((f) => f.slice(dir.length + 1))).toContain('lock.ts');
      expect(importGraph(join(dir, 'dynamic.ts')).map((f) => f.slice(dir.length + 1))).toContain('lock.ts');
      expect(importGraph(join(dir, 'typeonly.ts')).map((f) => f.slice(dir.length + 1))).not.toContain('lock.ts');
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
    const graph = importGraph(ENTRY);
    expect(graph.length).toBeGreaterThan(20); // the walk really walked
    // The lock offer and the lock controller (Face ID) must not be in the screen's tree at all.
    expect(graph.map((f) => f.slice(SRC.length + 1)).filter((f) => f.startsWith('components/app-lock/') || f === 'lib/app-lock/controller.ts')).toEqual([]);
    expect(offenders(graph, PROMPT_PATTERN).sort()).toEqual(REACHED_NOT_CALLED);
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
