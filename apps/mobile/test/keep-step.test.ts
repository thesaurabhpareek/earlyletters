/// <reference types="node" />
/**
 * The Keep step around one save of words in Review (lib/billing/keep-step.ts; M17, D-103; F14-REQ-037; F14
 * 6.2 B), run for real: the real store on node:sqlite, the real ledger and gate, a fake Keychain, and the
 * analytics calls recorded. Review's Keep and Keep privately call keepSheetFor before the write and afterKeep
 * after it (pinned in review-keep-m17.test.ts). Fictional Asha family only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_PLAN, type PlanView } from '@scribe/core';
import { nodeDb } from './helpers/node-db';

const h = vi.hoisted(() => ({ view: null as unknown, events: [] as { name: string; props: unknown }[] }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('../src/lib/billing/plan-store', () => ({ getPlan: () => ({ view: h.view, details: {}, checkedAt: null }) }));
vi.mock('../src/lib/analytics/track', () => ({ track: (name: string, props: unknown) => void h.events.push({ name, props }) }));

const store = await import('../src/lib/store');
const { afterKeep, keepSheetFor } = await import('../src/lib/billing/keep-step');
const { configureLedgerStorage } = await import('../src/lib/billing/letter-ledger');
const { LEDGER_KEYCHAIN_KEY, parseLedger } = await import('../src/lib/billing/letter-ledger.logic');

const PLUS: PlanView = { state: 'active', effectiveUntil: '2099-01-01T00:00:00Z', verifiedAt: '2026-10-03T00:00:00Z', environment: 'production', isTester: false };
const now = () => '2026-10-03T09:00:00.000Z';
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let close: () => void = () => {};
let asha = '';
let keychain = new Map<string, string>();

beforeEach(() => {
  h.view = NO_PLAN;
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
  store.closeStore();
  configureLedgerStorage(null);
  close();
});

const counted = () => store.ledgerDb().counts().recorded;
const keychainCount = () => parseLedger(keychain.get(LEDGER_KEYCHAIN_KEY) ?? null).n;
const names = () => h.events.map((e) => e.name);

/** A letter kept with its words, as Review does it (gate, write, count). */
async function keepTyped(text: string): Promise<boolean> {
  expect(await keepSheetFor(text)).toBeNull();
  const d = store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text });
  store.saveLetterFromDraft(d.id, {
    id: d.id, kind: 'letter', occurredOn: '2026-10-03', capturedAt: now(), captureMode: 'typed', editLevel: 'verbatim', promptKey: null,
    engineVersion: 5, rawTranscript: text, machineEdits: [], finalText: text, inBook: true, soundsLikeMe: null, childId: asha, authorSignsAs: 'Mama', audioUri: null,
  });
  return afterKeep(text);
}

describe('keepSheetFor: the gate before the write', () => {
  it('words under the allowance: no sheet, no event', async () => {
    expect(await keepSheetFor('Asha, you sang.')).toBeNull();
    expect(h.events).toEqual([]);
  });

  it('words at the allowance without Plus: the sheet, and keep_gate_shown with numbers only', async () => {
    await keepTyped('One.');
    await keepTyped('Two.');
    h.events.length = 0;
    const g = await keepSheetFor('Three.');
    expect(g?.decision).toEqual({ kind: 'offer', trigger: 'keep_letter', needsSignIn: false, lapsed: false });
    expect(h.events).toEqual([{ name: 'keep_gate_shown', props: { letters_kept: 2, allowance: 2, lapsed: 0 } }]);
  });

  it('no words on screen (empty, blank, marks only) never asks and never opens the sheet, even past the allowance', async () => {
    await keepTyped('One.');
    await keepTyped('Two.');
    h.events.length = 0;
    for (const t of ['', '   ', '...', '?!']) expect(await keepSheetFor(t), t).toBeNull();
    expect(h.events).toEqual([]);
  });

  it('with Plus: no sheet at any count', async () => {
    await keepTyped('One.');
    await keepTyped('Two.');
    h.view = PLUS;
    expect(await keepSheetFor('Three.')).toBeNull();
  });
});

describe('afterKeep: the count and the allowance note after the write', () => {
  it('the save that reaches the allowance notes it once: free_allowance_reached and the second-free line', async () => {
    expect(await keepTyped('One.')).toBe(false);
    expect(names()).toEqual([]);
    expect(await keepTyped('Two.')).toBe(true);
    expect(h.events).toEqual([{ name: 'free_allowance_reached', props: { allowance: 2 } }]);
    expect(keychainCount()).toBe(2);
  });

  it('marks only at the allowance: no line and no event again, but the count still reaches the Keychain', async () => {
    await keepTyped('One.');
    await keepTyped('Two.');
    keychain.clear(); // the Keychain lost its copy: the next save must still mirror the count
    h.events.length = 0;
    expect(await afterKeep('...')).toBe(false);
    expect(h.events).toEqual([]);
    expect(keychainCount()).toBe(2);
  });

  it('with Plus: never the line or the event', async () => {
    await keepTyped('One.');
    h.view = PLUS;
    expect(await keepTyped('Two.')).toBe(false);
    expect(names()).not.toContain('free_allowance_reached');
  });
});
