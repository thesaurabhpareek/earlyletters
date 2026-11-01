/// <reference types="node" />
/**
 * RT-PAY-17: the Keep gate never says "needs Plus" before StoreKit has answered. It waits, briefly, for the first
 * entitlement read of this process (plan-store planReadiness, KEEP_PLAN_WAIT_MS); on timeout it decides from the cached
 * snapshot; with no read and no snapshot it holds the letter and opens no Plus sheet. Free letters never wait on any of
 * this. The plan store is a fake; the ledger is the real one over a fake database. Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NO_PLAN, type PlanView } from '@scribe/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  view: null as unknown as PlanView,
  readiness: 'read' as 'read' | 'cached' | 'none' | 'no_store',
  waits: [] as number[],
  events: [] as { name: string; props: unknown }[],
}));

const counts = vi.fn(() => ({ recorded: 2, present: 2 }));
vi.mock('../src/lib/store', () => ({
  ledgerDb: () => ({ counts, raiseTo: () => {}, clear: () => {} }),
  listChildren: () => [],
  listHiddenChildren: () => [],
}));
vi.mock('../src/lib/billing/plan-store', () => ({
  getPlan: () => ({ view: h.view, details: {}, checkedAt: null }),
  planReadiness: async (ms: number) => {
    h.waits.push(ms);
    return h.readiness;
  },
}));
vi.mock('../src/lib/analytics/track', () => ({ track: (name: string, props: unknown) => void h.events.push({ name, props }) }));

const { keepGateFor, keepLetterGate, KEEP_PLAN_WAIT_MS } = await import('../src/lib/billing/gates');
const { keepSheetFor } = await import('../src/lib/billing/keep-step');
const { configureLedgerStorage } = await import('../src/lib/billing/letter-ledger');

const NOW = new Date('2026-11-01T12:00:00.000Z');
const PLUS: PlanView = { state: 'active', effectiveUntil: '2026-12-01T00:00:00.000Z', verifiedAt: '2026-10-20T00:00:00.000Z', environment: 'production', isTester: false };

beforeEach(() => {
  h.view = NO_PLAN;
  h.readiness = 'read';
  h.waits = [];
  h.events = [];
  counts.mockReset().mockReturnValue({ recorded: 2, present: 2 });
  configureLedgerStorage(null);
});

describe('[RT-PAY-17] the Keep gate waits for the first StoreKit read', () => {
  it('asks the plan store to wait for the first read, with a short bounded timeout', async () => {
    await keepLetterGate(NOW);
    expect(h.waits).toEqual([KEEP_PLAN_WAIT_MS]);
    expect(KEEP_PLAN_WAIT_MS).toBeGreaterThan(0);
    expect(KEEP_PLAN_WAIT_MS).toBeLessThanOrEqual(1500);
  });

  it('StoreKit answered: the decision is as before (2 kept, no Plus: the Keep sheet)', async () => {
    expect((await keepLetterGate(NOW)).decision).toEqual({ kind: 'offer', trigger: 'keep_letter', needsSignIn: false, lapsed: false });
  });

  it('timed out with a cached snapshot: decides from the cache, so a payer is never asked', async () => {
    h.readiness = 'cached';
    h.view = PLUS;
    expect((await keepLetterGate(NOW)).decision).toEqual({ kind: 'allow', via: 'plus_own' });
    // A cached Free plan is Apple's last answer: the sheet may open.
    h.view = NO_PLAN;
    expect((await keepLetterGate(NOW)).decision.kind).toBe('offer');
  });

  it('no read and no snapshot: the letter is held and no Plus sheet opens', async () => {
    h.readiness = 'none';
    const g = await keepLetterGate(NOW);
    expect(g.decision).toEqual({ kind: 'hold', reason: 'plan_unread' });
    expect(g.lettersKept).toBe(2);
    // Through the Keep step: Review gets the hold (it holds the draft), and keep_gate_shown is not noted.
    const step = await keepSheetFor('Asha, you clapped for the bus.');
    expect(step?.decision.kind).toBe('hold');
    expect(h.events.filter((e) => e.name === 'keep_gate_shown')).toEqual([]);
  });

  it('free letters never wait on the read: with 1 kept the save goes ahead even before StoreKit answers', async () => {
    h.readiness = 'none';
    counts.mockReturnValue({ recorded: 1, present: 1 });
    expect((await keepLetterGate(NOW)).decision).toMatchObject({ kind: 'allow', via: 'free_letters' });
    expect(await keepSheetFor('Asha found the moon.')).toBeNull();
  });

  it('no StoreKit on this device (Expo Go, web, Android): nothing to wait for, the decision is as before', async () => {
    h.readiness = 'no_store';
    expect((await keepLetterGate(NOW)).decision.kind).toBe('offer');
  });

  it('a save with no words still never asks anything (M17)', async () => {
    h.readiness = 'none';
    expect(await keepGateFor({ wordsOnScreen: '   ' })).toBeNull();
    expect(h.waits).toEqual([]);
  });

  it('Review holds the letter on `hold` and draws the Keep sheet only on `offer`', () => {
    const review = readFileSync(join(__dirname, '..', 'src', 'app', 'review.tsx'), 'utf8');
    const hold = review.slice(review.indexOf("if (g.decision.kind === 'hold')"), review.indexOf('setGate(g);'));
    expect(hold).toMatch(/holdOnce\(holding, \(\) => \(later \|\| !draft \? true : holdDraft\(draft\.id, \{ inBookChoice: heldInBook\.current \}\)\)\)/);
    expect(hold).toMatch(/return true;/); // the caller returns without saving: nothing is kept, nothing is lost
    expect(review).toMatch(/if \(gate && gate\.decision\.kind === 'offer' && phase !== 'saved'\)/);
  });
});
