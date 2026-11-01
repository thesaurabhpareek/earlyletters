/**
 * Tonight and Plus (SR-C-08; F14-REQ-040, F14-REQ-041; catalog row RT-TON-03). Pure parts, no React Native import, so
 * they are unit tested in test/tonight-plus.test.ts.
 *
 * 1. The standing line. Once the free letters are used and Plus is off, Tonight says so before the person records, not
 *    only at Review after the recording: one line above Speak and Type, `billingCopy.tonight.plusLine`, with "See Plus".
 *    A state, never a count, never a price. The rule is the Keep step's own (packages/core decideKeepLetter), read
 *    through the billing API (usePlan, lettersKeptNow, freeLettersAllowance), so the line and the gate never disagree.
 *
 * 2. Held letters. One held letter keeps its own card. Two or more fold into one row, "{count} letters waiting to be
 *    kept.", where the newest of them would be; tapping the row opens the list of their cards in place. Every other
 *    card keeps its place and order (newest first).
 */
import { decideKeepLetter, type PlanView } from '@scribe/core';
import { billingCopy } from '@scribe/content';
import { copy, fill } from '@/lib/copy';
import type { DraftCard } from './draft-card.logic';

/* ------------------------------------------------------------------ */
/* The standing line                                                   */
/* ------------------------------------------------------------------ */

export type PlusLineInput = {
  /** The engine's plan view (usePlan().view). */
  plan: PlanView;
  /** ISO time now. */
  now: string;
  /** Letters kept on this account (lettersKeptNow), or null while it has not been read yet. */
  lettersKept: number | null;
  /** The free-letter allowance (freeLettersAllowance). */
  allowance: unknown;
};

/**
 * True when Tonight shows the standing line: the next letter kept would meet the Keep sheet, because the free letters
 * are used and Plus is not on (lapsed included). Never before the ledger has been read, so a slow read shows nothing
 * rather than a wrong line.
 */
export function plusLineShows(input: PlusLineInput): boolean {
  if (input.lettersKept == null) return false;
  return decideKeepLetter({ now: input.now, plan: input.plan, lettersKept: input.lettersKept, allowance: input.allowance }).kind === 'offer';
}

/** What the line says, and its one action. No number, no price. */
export function plusLine(): { text: string; action: string } {
  return { text: billingCopy.tonight.plusLine, action: billingCopy.keepGate.seePlus };
}

/** Where "See Plus" goes: Settings, Plan, which opens Apple's own sheet (the one place a price is shown). */
export const PLUS_ROUTE = '/settings/plus' as const;

/* ------------------------------------------------------------------ */
/* Held letters                                                        */
/* ------------------------------------------------------------------ */

/** From this many held letters, they fold into one row. */
export const HELD_COLLAPSE_AT = 2;

export type HeldRow = {
  kind: 'held';
  /** Stable key for the list. */
  id: 'held';
  count: number;
  /** "2 letters waiting to be kept." */
  title: string;
  /** The held letters' own cards, newest first, shown when the row is open. */
  cards: DraftCard[];
};

export type TonightRow = { kind: 'card'; card: DraftCard } | HeldRow;

/**
 * Tonight's rows from its cards (draftCards, newest first). Fewer than HELD_COLLAPSE_AT held cards: one row per card,
 * unchanged. Otherwise the held cards become one row, placed where the newest held card was.
 */
export function tonightRows(cards: readonly DraftCard[]): TonightRow[] {
  const held = cards.filter((c) => c.state === 'held');
  if (held.length < HELD_COLLAPSE_AT) return cards.map((card) => ({ kind: 'card', card }));
  const rows: TonightRow[] = [];
  for (const card of cards) {
    if (card.state !== 'held') rows.push({ kind: 'card', card });
    else if (card === held[0]) rows.push(heldRow(held));
  }
  return rows;
}

function heldRow(cards: DraftCard[]): HeldRow {
  return { kind: 'held', id: 'held', count: cards.length, title: fill(copy.tonight.draft.heldMany, { count: String(cards.length) }), cards };
}

/** The row's action, closed or open. */
export function heldRowAction(open: boolean): string {
  return open ? copy.tonight.draft.heldHideButton : copy.tonight.draft.heldShowButton;
}
