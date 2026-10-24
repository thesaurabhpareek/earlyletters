/// <reference types="node" />
/**
 * The Keep step around one save of words (lib/billing/keep-step.ts; M17, D-103; F14-REQ-037; F14 6.2 B
 * and B2), run for real: the real store on node:sqlite, the real ledger and gate, a fake Keychain, and the
 * analytics calls recorded. Review's Keep and Keep privately call keepSheetFor and afterKeep; the letter
 * page's Save words and Read it back call keepWords. Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_PLAN, type Edit, type PlanView } from '@scribe/core';
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
const { afterKeep, keepSheetFor, keepWords } = await import('../src/lib/billing/keep-step');
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
/** A recording kept without words (Review's Keep the recording asks no gate). */
function keepVoiceOnly(): string {
  const d = store.createDraft({ childId: asha, captureMode: 'spoken', promptKey: null, audioUri: `file:///Documents/${newId()}.m4a`, audioDurationMs: 9000 });
  store.saveVoiceOnlyFromDraft({ ...d, audioSha256: 'a'.repeat(64), audioBytes: 12000 }, { childId: asha, authorSignsAs: 'Mama', inBook: false, engineVersion: 5 });
  return d.id;
}
/** The machine's words arrive later (the transcription queue): they wait for the author's review. */
function wordsArrive(id: string, finalText: string): void {
  expect(store.setWordsForWaitingEntry(id, { rawTranscript: finalText, machineEdits: [] as Edit[], finalText, editLevel: 'verbatim', engineVersion: 5 })).toBe(true);
}
/** The letter page's Read it back, as letter/[id].tsx calls it. */
const readItBack = (id: string) => keepWords({ wordsOnScreen: store.getEntry(id)!.finalText, write: () => store.keepReviewedWords(id) });
/** The letter page's Save words, as letter/[id].tsx calls it. */
const saveWords = (id: string, text: string) => keepWords({ wordsOnScreen: text, write: () => store.setTypedWordsForWaitingEntry(id, text) });

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

describe('[F14-REQ-037] words that come later count at the save where they are first on screen (the letter page)', () => {
  it('3 voice-only saves: 0 sheets, 0 counted; their words arrive and 3 are read back: 2 free, the third opens the sheet', async () => {
    const ids = [keepVoiceOnly(), keepVoiceOnly(), keepVoiceOnly()];
    expect(counted()).toBe(0);
    expect(names()).toEqual([]);
    ids.forEach((id, i) => wordsArrive(id, ['You laughed.', 'You rolled over.', 'You said ba.'][i]));
    expect(counted()).toBe(0); // the words exist, but nobody has read them yet
    expect(await readItBack(ids[0])).toEqual({ kind: 'kept', secondFree: false });
    expect(await readItBack(ids[1])).toEqual({ kind: 'kept', secondFree: true });
    const third = await readItBack(ids[2]);
    expect(third.kind).toBe('sheet');
    expect(store.getEntry(ids[2])?.wordsUnreviewed).toBe(true); // not kept: the words wait on the letter
    expect(counted()).toBe(2);
    h.view = PLUS; // after Plus starts, the person taps Read it back again (D-083)
    expect(await readItBack(ids[2])).toEqual({ kind: 'kept', secondFree: false });
    expect(counted()).toBe(3);
  });

  it('Save words (typed for a recording): counts under the allowance; at the allowance the sheet opens and nothing is written', async () => {
    const a = keepVoiceOnly();
    const b = keepVoiceOnly();
    await keepTyped('One.');
    expect(await saveWords(a, 'You found your feet.')).toEqual({ kind: 'kept', secondFree: true });
    expect(counted()).toBe(2);
    const r = await saveWords(b, 'You clapped.');
    expect(r.kind).toBe('sheet');
    expect(store.getEntry(b)).toMatchObject({ transcriptStatus: 'waiting', finalText: '' });
    expect(counted()).toBe(2);
  });

  it('marks only, typed or arrived: kept with no sheet, no count and no note, before and past the allowance', async () => {
    const a = keepVoiceOnly();
    const b = keepVoiceOnly();
    wordsArrive(b, '...');
    expect(await saveWords(a, '?!')).toEqual({ kind: 'kept', secondFree: false });
    expect(await readItBack(b)).toEqual({ kind: 'kept', secondFree: false });
    expect(counted()).toBe(0);
    await keepTyped('One.');
    await keepTyped('Two.');
    h.events.length = 0;
    const c = keepVoiceOnly();
    expect(await saveWords(c, '...')).toEqual({ kind: 'kept', secondFree: false });
    expect(h.events).toEqual([]);
    expect(counted()).toBe(2);
  });

  it('a write that changes nothing (already read back) counts nothing and notes nothing', async () => {
    const a = keepVoiceOnly();
    wordsArrive(a, 'You waved.');
    await readItBack(a);
    h.events.length = 0;
    expect(await readItBack(a)).toEqual({ kind: 'unchanged' });
    expect(h.events).toEqual([]);
    expect(counted()).toBe(1);
  });
});

describe('letter/[id].tsx is wired to keepWords', () => {
  const page = readFileSync(join(__dirname, '..', 'src', 'app', 'letter', '[id].tsx'), 'utf8');
  const between = (from: string, to: string) => {
    const start = page.indexOf(from);
    if (start < 0) throw new Error(`letter/[id].tsx: anchor not found: ${from}`);
    const end = page.indexOf(to, start + from.length);
    if (end < 0) throw new Error(`letter/[id].tsx: anchor not found after ${from}: ${to}`);
    return page.slice(start, end);
  };

  it('Save words asks keepWords with the typed words and closes only when kept', () => {
    const sheet = between('function WordsSheet(', 'function ReadItBackCard(');
    expect(sheet).toMatch(/await keep\(\s*text,\s*\(\)\s*=>\s*setTypedWordsForWaitingEntry\(\s*entryId,\s*text\s*\)\s*\)\)\s*===\s*'kept'\)\s*onClose\(\)/);
    expect(sheet).not.toMatch(/if \(setTypedWordsForWaitingEntry\(/);
  });

  it('Read it back keeps words waiting for review through keepWords, and the card stays on the sheet', () => {
    const read = between('<ReadItBackCard', 'function TopBar(');
    expect(read).toMatch(/if \(entry\.wordsUnreviewed\)/);
    expect(read).toMatch(/await keeper\.keep\(\s*entry\.finalText,\s*\(\)\s*=>\s*keepReviewedWords\(\s*entry\.id\s*\)\s*\)/);
    const hold = read.search(/kept === 'sheet'[^;]*return/);
    expect(hold).toBeGreaterThan(-1);
    expect(hold).toBeLessThan(read.indexOf('clearReadItBack('));
  });

  it('the hook runs keepWords and opens the Keep sheet without the held note', () => {
    const hook = between('function useKeepWords(', 'function WaitingCard(');
    expect(hook).toMatch(/await keepWords\(\{\s*wordsOnScreen,\s*write\s*\}\)/);
    expect(hook).toMatch(/<PlusGate[\s\S]*showHeldNote=\{false\}/);
  });
});
