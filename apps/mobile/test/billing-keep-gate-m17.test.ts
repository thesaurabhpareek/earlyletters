/// <reference types="node" />
/**
 * The M17 gate (D-103; F14-REQ-037, F14-REQ-038; WP-F14-20, gate half). A letter counts,
 * and the Keep sheet can open, only at a save with the letter's words on screen. Saving
 * a recording with no words never reads the ledger and never opens the sheet. The ledger
 * query that decides what counts is S03's (db/repos/ledger.ts, PR #146); this pins the
 * gate the Review screen calls. Fictional Asha family only.
 */
import { NO_PLAN } from '@scribe/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const counts = vi.fn(() => ({ recorded: 2, present: 2 }));
vi.mock('../src/lib/store', () => ({
  ledgerDb: () => ({ counts, raiseTo: () => {}, clear: () => {} }),
  listChildren: () => [],
  listHiddenChildren: () => [],
}));
vi.mock('../src/lib/billing/plan-store', () => ({
  getPlan: () => ({ view: NO_PLAN, details: {}, checkedAt: null }),
  planReadiness: async () => 'read', // StoreKit has answered (RT-PAY-17 is pinned in billing-keep-gate-plan-read.test.ts)
}));

const { hasWords, keepGateFor, keepLetterGate } = await import('../src/lib/billing/gates');
const { configureLedgerStorage } = await import('../src/lib/billing/letter-ledger');

beforeEach(() => {
  counts.mockReset().mockReturnValue({ recorded: 2, present: 2 }); // no mockReturnValueOnce carries into the next test
  configureLedgerStorage(null); // a fresh process: the in-memory Keychain floor starts at 0
});

describe('[F14-REQ-037] words seen: the gate opens only with words on screen', () => {
  it('words are any letter or digit in any script; blank, spaces and punctuation are not words', () => {
    for (const t of ['Asha, you laughed at the rain.', 'आशा', '3', ' ok ']) expect(hasWords(t), t).toBe(true);
    for (const t of ['', '   ', '\n\t', '.,?!', null, undefined]) expect(hasWords(t as string | null | undefined), String(t)).toBe(false);
    // Arabic with vowel marks and Chinese are words; an emoji, an ellipsis character or a combining mark alone are not.
    for (const t of ['\u0643\u064E\u062A\u064E\u0628\u064E', '\u4F60\u597D']) expect(hasWords(t), t).toBe(true);
    for (const t of ['\u{1F49B}', '\u2026', '\u0301']) expect(hasWords(t), t).toBe(false);
    // Accepted (#268): text holding a digit counts even when it reads as a symbol.
    for (const t of ['<3', '1\uFE0F\u20E3', '\u00B2']) expect(hasWords(t), t).toBe(true);
  });

  it('[F14-REQ-038] a save with no words (no speech model yet, nobody spoke) never reads the ledger and never offers Plus', async () => {
    for (const words of ['', '   ', null, undefined]) {
      expect(await keepGateFor({ wordsOnScreen: words })).toBeNull();
    }
    expect(counts).not.toHaveBeenCalled();
  });

  it('a save with words on screen is the counting moment: with 2 kept and no Plus, the Keep sheet is offered', async () => {
    const g = await keepGateFor({ wordsOnScreen: 'Asha, you sang to the cat.' });
    expect(counts).toHaveBeenCalled();
    expect(g?.decision).toEqual({ kind: 'offer', trigger: 'keep_letter', needsSignIn: false, lapsed: false });
    expect(g?.lettersKept).toBe(2);
  });

  it('a save with words and 1 kept is still free', async () => {
    counts.mockReturnValueOnce({ recorded: 1, present: 1 });
    const g = await keepGateFor({ wordsOnScreen: 'Two teeth today.' });
    expect(g?.decision).toMatchObject({ kind: 'allow', via: 'free_letters' });
  });

  it('keepLetterGate itself is unchanged for callers that already know words are on screen', async () => {
    expect((await keepLetterGate()).decision.kind).toBe('offer');
  });
});
