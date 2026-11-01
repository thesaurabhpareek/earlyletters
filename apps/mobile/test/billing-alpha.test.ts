/// <reference types="node" />
/**
 * No letter limit in alpha (founder decision, 1 Nov 2026, "No letter limit in alpha"; proposal PL-1, S1;
 * src/lib/billing/alpha.ts). A `.preview` build cannot load the Plus products, so alpha builds (APP_ENV development
 * or preview) keep letters past the second through the existing allowance path, and every Plus surface says Plus is
 * not part of this test. The store build (APP_ENV production) is unchanged: 2 free letters, then the Keep sheet.
 *
 * Run for real where it matters: the real store on node:sqlite, the real ledger and gate (as keep-step.test.ts),
 * with the allowance source the root layout wires. Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { billingCopy, en } from '@scribe/content';
import { DEFAULT_FREE_LETTERS, MAX_FREE_LETTERS, NO_PLAN } from '@scribe/core';
import { nodeDb } from './helpers/node-db';

const h = vi.hoisted(() => ({ events: [] as { name: string; props: unknown }[] }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('../src/lib/billing/plan-store', () => ({ getPlan: () => ({ view: NO_PLAN, details: {}, checkedAt: null }) }));
vi.mock('../src/lib/analytics/track', () => ({ track: (name: string, props: unknown) => void h.events.push({ name, props }) }));

const store = await import('../src/lib/store');
const { countAfterSave, keepSheetFor } = await import('../src/lib/billing/keep-step');
const { setFreeLettersAllowanceSource } = await import('../src/lib/billing/gates');
const { configureLedgerStorage } = await import('../src/lib/billing/letter-ledger');
const { allowanceSourceFor, isAlphaBuild, plusLineFor } = await import('../src/lib/billing/alpha');
const { keepSheetView } = await import('../src/components/child/plus-gate.logic');
const { planScreen } = await import('../src/components/settings/plan.logic');

const APP = join(__dirname, '..');
const read = (p: string) => readFileSync(join(APP, p), 'utf8');
const NOTE = billingCopy.alpha.note;

/** What the root layout wires for a build of this app env, with remote config saying nothing. */
const wire = (env: 'development' | 'preview' | 'production', remote: () => unknown = () => undefined) =>
  setFreeLettersAllowanceSource(allowanceSourceFor(isAlphaBuild(env), remote));

const now = () => '2026-11-01T09:00:00.000Z';
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let close: () => void = () => {};
let asha = '';
let keychain = new Map<string, string>();

beforeEach(() => {
  h.events.length = 0;
  keychain = new Map();
  configureLedgerStorage({
    getItem: async (k) => keychain.get(k) ?? null,
    setItem: async (k, v) => void keychain.set(k, v),
    removeItem: async (k) => void keychain.delete(k),
  });
  store.closeStore();
  const db = nodeDb();
  close = db.close;
  expect(store.openStore({ open: () => ({ db: db.db, close: () => {} }), now, newId }).ok).toBe(true);
  asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
});
afterEach(() => {
  setFreeLettersAllowanceSource(() => undefined);
  store.closeStore();
  configureLedgerStorage(null);
  close();
  vi.unstubAllEnvs();
});

/** Keep one typed letter as Review does (gate, write, count). Returns the sheet's gate, or null when it was kept. */
async function keep(text: string): Promise<{ sheet: boolean; secondFree: boolean }> {
  const g = await keepSheetFor(text);
  if (g) return { sheet: true, secondFree: false };
  const d = store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
  store.saveLetterFromDraft(d.id, {
    id: d.id, kind: 'letter', occurredOn: '2026-11-01', capturedAt: now(), captureMode: 'typed', editLevel: 'verbatim', promptKey: null,
    engineVersion: 5, rawTranscript: text, machineEdits: [], finalText: text, inBook: true, soundsLikeMe: null, childId: asha, authorSignsAs: 'Mama', audioUri: null,
  });
  return { sheet: false, secondFree: await countAfterSave(text) };
}

describe('which builds are alpha', () => {
  it('development and preview are alpha; production is the store build', () => {
    expect(isAlphaBuild('development')).toBe(true);
    expect(isAlphaBuild('preview')).toBe(true);
    expect(isAlphaBuild('production')).toBe(false);
  });

  it('PLUS_ALPHA follows EXPO_PUBLIC_APP_ENV at bundle time, and nothing else', async () => {
    for (const [raw, alpha] of [['production', false], ['preview', true], ['development', true], ['', true], ['nonsense', true]] as const) {
      vi.stubEnv('EXPO_PUBLIC_APP_ENV', raw);
      vi.resetModules();
      const m = await import('../src/lib/billing/alpha');
      expect(m.PLUS_ALPHA, raw).toBe(alpha);
    }
  });

  it('eas.json: the production profile is the store build; testflight and preview are alpha', () => {
    const eas = JSON.parse(read('eas.json')) as { build: Record<string, { env?: Record<string, string> }> };
    const envOf = (p: string) => eas.build[p]?.env?.EXPO_PUBLIC_APP_ENV;
    expect(envOf('production')).toBe('production');
    expect(isAlphaBuild(envOf('production') as 'production')).toBe(false);
    for (const p of ['testflight', 'preview']) expect(isAlphaBuild(envOf(p) as 'preview'), p).toBe(true);
  });
});

describe('the switch cannot come from runtime config', () => {
  it('alpha.ts reads only the bundle-time APP_ENV: no settings, storage, remote config or links', () => {
    const src = read('src/lib/billing/alpha.ts');
    expect(src).toMatch(/export const PLUS_ALPHA: boolean = isAlphaBuild\(APP_ENV\);/);
    const imports = [...src.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
    expect(imports.sort()).toEqual(['../build-env', '@scribe/content', '@scribe/core']);
    expect(read('src/lib/build-env.ts')).toMatch(/export const APP_ENV: AppEnv = resolveAppEnv\(process\.env\.EXPO_PUBLIC_APP_ENV\)/);
  });

  it('in the store build the allowance source is remote config itself, untouched', () => {
    const remote = () => 7;
    expect(allowanceSourceFor(false, remote)).toBe(remote);
  });

  it('in alpha no remote value moves the allowance, high or low', () => {
    for (const v of [undefined, 0, 1, 2, 5, 1000, 'many']) expect(allowanceSourceFor(true, () => v)()).toBe(MAX_FREE_LETTERS);
  });

  it('the root layout wires the allowance through PLUS_ALPHA and the remote config path', () => {
    expect(read('src/app/_layout.tsx')).toMatch(
      /setFreeLettersAllowanceSource\(allowanceSourceFor\(PLUS_ALPHA, \(\) => effectiveFreeLetters\(getRemoteConfig\(\)\)\)\);/,
    );
  });
});

describe('the Keep step, through the real gate and ledger', () => {
  it('production: the allowance stays 2; the second letter shows the second-free line; the third opens the Keep sheet', async () => {
    wire('production');
    expect(DEFAULT_FREE_LETTERS).toBe(2);
    expect(await keep('One.')).toEqual({ sheet: false, secondFree: false });
    expect(await keep('Two.')).toEqual({ sheet: false, secondFree: true });
    expect((await keep('Three.')).sheet).toBe(true);
  });

  it('preview: three letters and more are kept, no Keep sheet, no second-free line', async () => {
    wire('preview');
    for (const t of ['One.', 'Two.', 'Three.', 'Four.', 'Five.']) expect(await keep(t), t).toEqual({ sheet: false, secondFree: false });
    expect(h.events.map((e) => e.name)).not.toContain('keep_gate_shown');
  });

  it('development: the same as preview', async () => {
    wire('development');
    for (const t of ['One.', 'Two.', 'Three.']) expect((await keep(t)).sheet, t).toBe(false);
  });
});

describe('Plus surfaces in alpha say Plus is not part of this test, and offer nothing', () => {
  it('the note follows the content rules this test can see: short, no count, no price, no trial', () => {
    expect(NOTE).toBe('Plus is not part of this test. Every letter is free while you test.');
    expect(NOTE).not.toMatch(/\d|\$|trial|[–—‘’“”…]/);
  });

  it('Welcome footnote and Settings Plan row: the note in alpha, the store words otherwise', () => {
    expect(plusLineFor(true, en.onboarding.welcome.freeLine)).toBe(NOTE);
    expect(plusLineFor(false, en.onboarding.welcome.freeLine)).toBe(en.onboarding.welcome.freeLine);
    expect(plusLineFor(true, en.settingsHome.planHelp)).toBe(NOTE);
    expect(plusLineFor(false, en.settingsHome.planHelp)).toBe(en.settingsHome.planHelp);
    expect(read('src/app/onboarding.tsx')).toMatch(/plusLineFor\(PLUS_ALPHA, o\.welcome\.freeLine\)/);
    expect(read('src/app/settings/index.tsx')).toMatch(/subtitle=\{plusLineFor\(PLUS_ALPHA, h\.planHelp\)\}/);
  });

  it('Keep sheet (reached in alpha only past 100 letters): the alpha note as its body, no store and no Plus wording', () => {
    const base = { lapsed: false, heldOn: 'tonight' as const, synced: false, offline: false, storeSupport: 'available' as const };
    const k = billingCopy.keepGate;
    for (const lapsed of [false, true]) {
      for (const offline of [false, true]) {
        for (const heldOn of ['tonight', 'letter'] as const) {
          const v = keepSheetView({ ...base, lapsed, offline, heldOn, alpha: true });
          expect(v).toEqual({ body: NOTE, heldNote: heldOn === 'letter' ? k.heldNoteLetter : k.heldNote, note: null, canOpenStore: false });
          // Every line the sheet shows besides its title: none names Plus except the note itself.
          for (const line of [v.heldNote, v.note, k.title, k.holdButton, k.heldChip]) if (line) expect(line).not.toMatch(/Plus/);
        }
      }
    }
    expect(keepSheetView({ ...base, alpha: false })).toEqual(keepSheetView(base));
    expect(keepSheetView(base)).toEqual({ body: k.body, heldNote: k.heldNote, note: null, canOpenStore: true });
    expect(read('src/components/child/plus-gate.tsx')).toMatch(/keepSheetView\(\{[^}]*alpha: PLUS_ALPHA \}\)/);
  });

  it('Settings, Plan in alpha: only the alpha note, in every plan state; no promise, status, Manage or Redeem', () => {
    const longDate = (d: string) => d;
    const states = [
      { line: { kind: 'off' } as const, details: { status: 'none' as const, period: null, ownership: null }, plusOn: false },
      { line: { kind: 'on' } as const, details: { status: 'active' as const, period: 'month' as const, ownership: 'purchased' as const }, plusOn: true },
      { line: { kind: 'retry' } as const, details: { status: 'billing_retry' as const, period: 'year' as const, ownership: 'purchased' as const }, plusOn: false },
    ];
    for (const st of states) {
      for (const storeSupport of ['available', 'needs_ios_17', 'unsupported'] as const) {
        const s = planScreen({ ...st, storeSupport, noteLines: [], longDate, alpha: true } as Parameters<typeof planScreen>[0]);
        expect(s).toEqual({ status: null, seePlans: { kind: 'unavailable', title: NOTE }, promise: null, manage: false, redeem: false, alpha: true });
      }
    }
    const storeBuild = planScreen({ ...states[0], storeSupport: 'available', noteLines: [], longDate } as Parameters<typeof planScreen>[0]);
    expect(storeBuild).toMatchObject({ seePlans: { kind: 'open', title: billingCopy.plan.seePlans }, promise: billingCopy.store.promise, redeem: true, alpha: false });
  });

  it('Settings, Plan in alpha renders the note row alone: no purchase, restore, redeem, manage or refund control, no payment line', () => {
    const src = read('src/app/settings/plus.tsx');
    expect(src).toMatch(/alpha: PLUS_ALPHA,/);
    const start = src.indexOf('if (screen.alpha) {');
    expect(start).toBeGreaterThan(-1);
    const block = src.slice(start, src.indexOf('\n  }\n', start));
    // The alpha return comes before the store screen's render, after every hook.
    expect(start).toBeLessThan(src.lastIndexOf('  return (\n    <ScrollView'));
    expect(src.slice(start)).not.toMatch(/^\s+(?:const|let) \[?\w+.*= use[A-Z]/m);
    expect(block).toMatch(/testID="plan\.alpha"/);
    expect((block.match(/<ListRow/g) ?? []).length).toBe(1);
    expect(block).not.toMatch(/onPress|presentPlusStore|restorePurchases|redeemOfferCode|manageSubscription|requestRefund|p\.payment|p\.restore|p\.redeem|p\.manage|p\.refund|screen\.promise|footer=/);
  });
});
