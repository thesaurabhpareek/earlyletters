/// <reference types="node" />
/**
 * Review's Keep step asks the M17 gate (D-103; F14-REQ-037, F14-REQ-038; WP-F14-20, the
 * review.tsx half; go/no-go B2-7). Keep and Keep privately pass the letter's words on screen
 * (`finalText`) to keepGateFor; keeping the voice without words asks no gate. A null answer
 * means no words on screen: no sheet, no count, and Keep goes ahead. The gate and the ledger
 * share one rule for words (hasWords), so marks alone ("...") never count. Every other Keep
 * behaviour is as before (D-082, D-083): the first 2 letters kept are free, then the sheet,
 * and a held Keep writes nothing.
 *
 * Screens do not load in Node, so this runs Review's Keep order (gate, then write, then the
 * count) against the real store, ledger and gate, and pins review.tsx to that order and to
 * the values it passes. Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_PLAN, type PlanView } from '@scribe/core';
import { nodeDb } from './helpers/node-db';

const plan = vi.hoisted(() => ({ view: null as unknown }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('../src/lib/billing/plan-store', () => ({
  getPlan: () => ({ view: plan.view, details: {}, checkedAt: null }),
}));

const store = await import('../src/lib/store');
const { afterLetterKept, freeLettersAllowance, hasPlus, hasWords, keepGateFor } = await import('../src/lib/billing/gates');
const { configureLedgerStorage } = await import('../src/lib/billing/letter-ledger');

const PLUS: PlanView = { state: 'active', effectiveUntil: '2099-01-01T00:00:00Z', verifiedAt: '2026-10-03T00:00:00Z', environment: 'production', isTester: false };
const now = () => '2026-10-03T09:00:00.000Z';
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let close: () => void = () => {};
let asha = '';

beforeEach(() => {
  plan.view = NO_PLAN;
  configureLedgerStorage(null); // a fresh process: the in-memory Keychain floor starts at 0
  store.closeStore();
  const h = nodeDb();
  close = h.close;
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId }).ok).toBe(true);
  asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
});
afterEach(() => {
  store.closeStore();
  configureLedgerStorage(null);
  close();
});

const counted = () => store.ledgerDb().counts().recorded;

function spokenDraft(words?: string): string {
  const d = store.createDraft({ childId: asha, captureMode: 'spoken', promptKey: null, audioUri: `file:///Documents/${newId()}.m4a`, audioDurationMs: 9000 });
  if (words !== undefined) store.setDraftTranscript(d.id, words); // the queue sets the raw transcript once
  return d.id;
}
function typedDraft(text: string): string {
  return store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text }).id;
}

type Button = 'keep' | 'keepPrivately' | 'keepVoice';
type Gate = Awaited<ReturnType<typeof keepGateFor>>;

/**
 * One tap in Review, in review.tsx's order: `save(inBook)` asks keepGateFor with `finalText` and opens
 * the sheet only on `offer`; `keepRecordingOnly` asks no gate. Otherwise the letter is written and the
 * count mirrored. Only a save with words runs noteKept (`noted`: the second-free line and
 * free_allowance_reached, when Plus is off and the count equals the allowance); a save without words
 * runs afterLetterKept alone. On the sheet nothing is written.
 */
async function tap(draftId: string, button: Button, finalText = ''): Promise<{ outcome: 'kept' | 'sheet'; gate: Gate; noted: boolean }> {
  const d = store.getDraft(draftId)!;
  const gate = button === 'keepVoice' ? null : await keepGateFor({ wordsOnScreen: finalText });
  if (gate !== null && gate.decision.kind === 'offer') return { outcome: 'sheet', gate, noted: false };
  if (button === 'keepVoice') {
    store.saveVoiceOnlyFromDraft({ ...d, audioSha256: 'a'.repeat(64), audioBytes: 12000 }, { childId: asha, authorSignsAs: 'Mama', inBook: false, engineVersion: 5 });
  } else {
    const typed = d.typedText != null && d.typedText.trim().length > 0;
    store.saveLetterFromDraft(d.id, {
      id: d.id, kind: 'letter', occurredOn: '2026-10-03', capturedAt: d.createdAt, captureMode: typed ? 'typed' : 'spoken',
      editLevel: typed ? 'verbatim' : 'clean', promptKey: null, engineVersion: 5, rawTranscript: typed ? d.typedText! : (d.rawTranscript ?? ''),
      machineEdits: [], finalText, inBook: button === 'keep', soundsLikeMe: null, childId: asha, authorSignsAs: 'Mama',
      audioUri: d.audioUri, audioDurationMs: d.audioDurationMs, audioSha256: typed ? undefined : 'b'.repeat(64), audioBytes: typed ? undefined : 12000,
    });
  }
  const kept = await afterLetterKept();
  const noted = button !== 'keepVoice' && hasWords(finalText) && !hasPlus() && kept === freeLettersAllowance();
  return { outcome: 'kept', gate, noted };
}

/** Two letters with words kept, free: the allowance is used, and the second one notes it (once). */
async function useTheFreeLetters(): Promise<void> {
  expect((await tap(spokenDraft('Asha, you sang to the cat.'), 'keep', 'Asha, you sang to the cat.')).noted).toBe(false);
  expect((await tap(typedDraft('Two teeth today.'), 'keepPrivately', 'Two teeth today.')).noted).toBe(true);
  expect(counted()).toBe(2);
}

describe('[F14-REQ-037] Review asks the gate with the words on screen', () => {
  it('1. words on screen, under the free allowance: kept and counted (spoken, then typed)', async () => {
    const a = await tap(spokenDraft('Asha, you laughed at the rain.'), 'keep', 'Asha, you laughed at the rain.');
    expect(a.outcome).toBe('kept');
    expect(a.gate?.decision).toEqual({ kind: 'allow', via: 'free_letters', lettersLeft: 2 });
    expect(counted()).toBe(1);
    const b = await tap(typedDraft('You held my thumb all night.'), 'keepPrivately', 'You held my thumb all night.');
    expect(b.gate?.decision).toEqual({ kind: 'allow', via: 'free_letters', lettersLeft: 1 });
    expect(counted()).toBe(2);
  });

  it('2. words on screen, over the allowance, no Plus: the Keep sheet, as today, and nothing is written', async () => {
    await useTheFreeLetters();
    const id = spokenDraft('You found your feet.');
    const before = store.getDraft(id);
    const r = await tap(id, 'keep', 'You found your feet.');
    expect(r.outcome).toBe('sheet');
    expect(r.gate?.decision).toEqual({ kind: 'offer', trigger: 'keep_letter', needsSignIn: false, lapsed: false });
    expect(r.gate?.lettersKept).toBe(2);
    expect(store.getDraft(id)).toEqual(before); // held: the draft is untouched
    expect(store.getEntry(id)).toBeNull();
    expect(counted()).toBe(2);
    plan.view = PLUS;
    const plus = await tap(id, 'keep', 'You found your feet.');
    expect(plus.gate?.decision).toEqual({ kind: 'allow', via: 'plus_own' });
    expect(counted()).toBe(3);
  });

  it('3. no words on screen: the gate answers null, so the letter is kept with no count and no sheet, even past the allowance', async () => {
    for (const words of [null, undefined, '', '   ']) expect(await keepGateFor({ wordsOnScreen: words })).toBeNull();
    await useTheFreeLetters();
    const r = await tap(spokenDraft(), 'keepVoice');
    expect(r).toEqual({ outcome: 'kept', gate: null, noted: false });
    expect(counted()).toBe(2);
  });

  it('3b. marks only on screen ("...", "?!", an ellipsis character, a heart): no free letter used and no sheet, before and past the allowance', async () => {
    const marks = ['...', '?!', '\u2026', '\u{1F49B}'];
    for (const m of marks) {
      const r = await tap(m === '?!' ? typedDraft(m) : spokenDraft(m), 'keep', m);
      expect(r, m).toEqual({ outcome: 'kept', gate: null, noted: false });
    }
    expect(counted()).toBe(0);
    expect(store.ledgerDb().counts().present).toBe(0); // the letters-present source agrees with the gate
    await useTheFreeLetters(); // both still free: the marks used no allowance
    // At the allowance without Plus: kept, not counted, and no second-free line or free_allowance_reached again.
    for (const m of marks) {
      expect(await tap(m === '?!' ? typedDraft(m) : spokenDraft(m), 'keepPrivately', m), m).toEqual({ outcome: 'kept', gate: null, noted: false });
    }
    expect(counted()).toBe(2);
    expect(!hasPlus() && counted() === freeLettersAllowance()).toBe(true); // noteKept's own test would fire here: only the words check stops it
    expect((await tap(typedDraft('You waved.'), 'keep', 'You waved.')).outcome).toBe('sheet');
  });

  it('4. [F14-REQ-038] a voice-only letter (no model yet, waiting for its language, nobody spoke): 3 saves, 0 sheets, 0 counted', async () => {
    const outcomes: string[] = [];
    for (let i = 0; i < 3; i++) outcomes.push((await tap(spokenDraft(), 'keepVoice')).outcome);
    expect(outcomes).toEqual(['kept', 'kept', 'kept']);
    expect(counted()).toBe(0);
    // Those 3 letters never used an allowance: the next 2 letters with words are still free.
    await useTheFreeLetters();
    expect((await tap(typedDraft('You said ba.'), 'keep', 'You said ba.')).outcome).toBe('sheet');
  });

  it('5. a held draft: reopened with its words on screen it asks again; held without words it keeps with no count or sheet', async () => {
    await useTheFreeLetters();
    const withWords = spokenDraft('You clapped for the first time.');
    expect((await tap(withWords, 'keep', 'You clapped for the first time.')).outcome).toBe('sheet');
    expect(store.holdDraft(withWords, { inBookChoice: true })).toBe(true); // "Leave it waiting"
    const held = store.getDraft(withWords);
    expect((await tap(withWords, 'keep', 'You clapped for the first time.')).outcome).toBe('sheet');
    expect(store.getDraft(withWords)).toEqual(held);
    expect(counted()).toBe(2);
    // A recording held before its words existed (an earlier build gated voice keeps): it no longer reaches the gate.
    const noWords = spokenDraft();
    expect(store.holdDraft(noWords, { inBookChoice: null })).toBe(true);
    expect(await tap(noWords, 'keepVoice')).toEqual({ outcome: 'kept', gate: null, noted: false });
    expect(counted()).toBe(2);
    // After Plus starts, the person taps Keep on the held letter with words: kept and counted.
    plan.view = PLUS;
    expect((await tap(withWords, 'keep', 'You clapped for the first time.')).outcome).toBe('kept');
    expect(store.getDraft(withWords)).toBeNull();
    expect(counted()).toBe(3);
  });
});

describe('review.tsx is wired to the M17 gate', () => {
  const review = readFileSync(join(__dirname, '..', 'src', 'app', 'review.tsx'), 'utf8');
  /** The source from one anchor up to the next; fails loudly when either anchor is gone. */
  const between = (from: string, to: string) => {
    const start = review.indexOf(from);
    if (start < 0) throw new Error(`review.tsx: anchor not found: ${from}`);
    const end = review.indexOf(to, start + from.length);
    if (end < 0) throw new Error(`review.tsx: anchor not found after ${from}: ${to}`);
    return review.slice(start, end);
  };
  const gate = between('const keepNeedsPlus = async', 'const noteKept = async');
  const save = between('const save = async', 'const keepRecordingOnly = async');
  const voice = between('const keepRecordingOnly = async', 'const dismissFirstNote');

  it('asks keepGateFor with the words on screen; keepLetterGate is not called here', () => {
    expect(review).toMatch(/keepGateFor\(\{\s*wordsOnScreen\b/);
    expect(review).not.toMatch(/keepLetterGate/);
  });

  it('a null answer lets Keep go ahead (no sheet)', () => {
    expect(gate).toMatch(/(=== null|!\s*\w+\s*\|\||\?\.decision)[^;]*return false/);
  });

  it('Keep and Keep privately ask the gate with finalText before writing the letter', () => {
    const ask = save.search(/(keepNeedsPlus|keepGateFor)\(\s*(\{\s*wordsOnScreen:\s*)?finalText\b/);
    expect(ask).toBeGreaterThan(-1);
    expect(ask).toBeLessThan(save.indexOf('saveLetterFromDraft('));
  });

  it('after the save, only a letter with words runs noteKept (marks only never repeat the second-free line)', () => {
    expect(save).toMatch(/hasWords\(\s*finalText\s*\)[^;]*noteKept\(/);
    expect(save).not.toMatch(/^\s*await noteKept\(\);/m);
  });

  it('keeping the voice without words asks no gate with words, and never notes a free letter it did not count', () => {
    expect(voice).toMatch(/saveVoiceOnlyFromDraft\(/);
    expect(voice).not.toMatch(/keepGateFor\(|keepLetterGate|keepNeedsPlus\((?!\s*null\s*\))/);
    expect(voice).not.toMatch(/noteKept\(/);
    expect(voice).toMatch(/afterLetterKept\(/);
  });
});
