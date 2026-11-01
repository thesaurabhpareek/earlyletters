/// <reference types="node" />
/**
 * Tonight and Plus (SR-C-08; F14-REQ-040, F14-REQ-041; catalog row RT-TON-03): when the standing "needs Plus" line
 * shows, and how held letters fold into one row. Pure parts (tonight-plus.logic.ts) run here; Node cannot load React
 * Native, so the screen's use of them is checked in its source. Fixtures: the fictional family Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { billingCopy, en } from '@scribe/content';
import type { PlanView } from '@scribe/core';
import { describe, expect, it } from 'vitest';
import { draftCard, type DraftFields } from '../src/components/tonight/draft-card.logic';
import {
  HELD_COLLAPSE_AT,
  heldRowAction,
  plusLine,
  plusLineShows,
  tonightRows,
  type HeldRow,
} from '../src/components/tonight/tonight-plus.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const NOW = '2026-10-17T20:30:00.000Z';
const plan = (over: Partial<PlanView> = {}): PlanView => ({
  state: 'none',
  effectiveUntil: null,
  verifiedAt: null,
  environment: 'production',
  ...over,
} as PlanView);
const ON = plan({ state: 'active', effectiveUntil: '2026-11-17T20:30:00.000Z', verifiedAt: NOW });
const LAPSED = plan({ state: 'expired', effectiveUntil: '2026-10-01T00:00:00.000Z', verifiedAt: NOW });

describe('[F14-REQ-040] the standing line on Tonight', () => {
  it('shows once the free letters are used and Plus is off', () => {
    expect(plusLineShows({ plan: plan(), now: NOW, lettersKept: 2, allowance: undefined })).toBe(true);
    expect(plusLineShows({ plan: plan(), now: NOW, lettersKept: 5, allowance: undefined })).toBe(true);
  });

  it('shows when Plus has ended', () => {
    expect(plusLineShows({ plan: LAPSED, now: NOW, lettersKept: 2, allowance: undefined })).toBe(true);
  });

  it('is absent while free letters remain', () => {
    expect(plusLineShows({ plan: plan(), now: NOW, lettersKept: 0, allowance: undefined })).toBe(false);
    expect(plusLineShows({ plan: plan(), now: NOW, lettersKept: 1, allowance: undefined })).toBe(false);
  });

  it('is absent with Plus on, however many letters are kept', () => {
    expect(plusLineShows({ plan: ON, now: NOW, lettersKept: 2, allowance: undefined })).toBe(false);
    expect(plusLineShows({ plan: ON, now: NOW, lettersKept: 40, allowance: undefined })).toBe(false);
  });

  it('follows a raised allowance from remote config', () => {
    expect(plusLineShows({ plan: plan(), now: NOW, lettersKept: 2, allowance: 3 })).toBe(false);
    expect(plusLineShows({ plan: plan(), now: NOW, lettersKept: 3, allowance: 3 })).toBe(true);
  });

  it('never shows before letters kept has been read', () => {
    expect(plusLineShows({ plan: plan(), now: NOW, lettersKept: null, allowance: undefined })).toBe(false);
  });

  it('says a state, not a count or a price', () => {
    const line = plusLine();
    expect(line).toBe(billingCopy.tonight.plusLine);
    expect(line).not.toMatch(/\d|\$|price|trial|left|remaining/i);
    expect(line).toMatch(/needs Plus/);
  });

  it('renders no pressable: no button, link or press handler (F14-REQ-040 "No count, no button")', () => {
    const view = code('components/tonight/plus-line.tsx');
    expect(view).toMatch(/<Text /);
    expect(view).not.toMatch(/Button|Pressable|Touchable|onPress|role=|href|Link\b/);
    expect(view).not.toMatch(/seePlus|router/);
    expect(code('app/(tabs)/index.tsx')).toMatch(/<PlusLine \/>/);
  });
});

/** A draft the way listDrafts returns one. */
function draft(id: string, over: Partial<DraftFields> = {}): DraftFields {
  return {
    id,
    captureMode: 'typed',
    audioUri: null,
    audioDurationMs: null,
    audioBytes: null,
    state: 'ready',
    rawTranscript: null,
    typedText: 'You waved at the dog on the corner.',
    recoveredAt: null,
    createdAt: '2026-10-16T19:05:00.000Z',
    ...over,
  } as DraftFields;
}
const cards = (ds: DraftFields[]) => ds.map((d) => draftCard(d, new Date(NOW)));

describe('[F14-REQ-041] held letters fold into one row', () => {
  it('folds from two', () => {
    expect(HELD_COLLAPSE_AT).toBe(2);
  });

  it('one held letter keeps its own card', () => {
    const rows = tonightRows(cards([draft('typed-1'), draft('held-1', { held: true })]));
    expect(rows.map((r) => (r.kind === 'card' ? r.card.id : r.kind))).toEqual(['typed-1', 'held-1']);
    expect(rows.some((r) => r.kind === 'held')).toBe(false);
  });

  it('two held letters are one row that says how many are waiting, not one card each', () => {
    const rows = tonightRows(cards([draft('held-2', { held: true }), draft('held-1', { held: true })]));
    expect(rows).toHaveLength(1);
    const row = rows[0] as HeldRow;
    expect(row.kind).toBe('held');
    expect(row.count).toBe(2);
    expect(row.title).toBe('2 letters waiting to be kept.');
    expect(row.cards.map((c) => c.id)).toEqual(['held-2', 'held-1']);
  });

  it('three held among others: one row where the newest held one was; the rest keep their place', () => {
    const rows = tonightRows(
      cards([
        draft('typed-2'),
        draft('held-3', { held: true }),
        draft('typed-1'),
        draft('held-2', { held: true }),
        draft('held-1', { held: true }),
      ]),
    );
    expect(rows.map((r) => (r.kind === 'card' ? r.card.id : `held:${r.count}`))).toEqual(['typed-2', 'held:3', 'typed-1']);
    expect((rows[1] as HeldRow).title).toBe('3 letters waiting to be kept.');
  });

  it('no held letters: one row per card, unchanged', () => {
    const cs = cards([draft('typed-2'), draft('typed-1')]);
    expect(tonightRows(cs)).toEqual(cs.map((card) => ({ kind: 'card', card })));
  });

  it('the row says Show them when closed and Hide them when open', () => {
    expect(heldRowAction(false)).toBe(en.tonight.draft.heldShowButton);
    expect(heldRowAction(true)).toBe(en.tonight.draft.heldHideButton);
  });

  it('the row uses the glossary words', () => {
    expect(en.tonight.draft.heldMany).toBe('{count} letters waiting to be kept.');
  });
});

describe('[SR-C-08] Tonight wires both', () => {
  const screen = code('app/(tabs)/index.tsx');

  it('reads the free-letter state through the billing API only', () => {
    expect(screen).toMatch(/from '@\/lib\/billing';/);
    expect(screen).toMatch(/lettersKeptNow\(\)/);
    expect(screen).toMatch(/plusLineShows\(\{ plan: plan\.view,/);
    expect(screen).not.toMatch(/@\/lib\/billing\/(?!index)/);
  });

  it('puts the line with Speak and Type, before them', () => {
    const actions = screen.slice(screen.indexOf('const actions = ('));
    expect(actions.indexOf('<PlusLine')).toBeGreaterThan(-1);
    expect(actions.indexOf('<PlusLine')).toBeLessThan(actions.indexOf('<ButtonRow>'));
  });

  it('draws rows from tonightRows, with the held row', () => {
    expect(screen).toMatch(/tonightRows\(cards\)/);
    expect(screen).toMatch(/<HeldRow /);
    expect(screen).not.toMatch(/cards\.map\(/);
  });
});
