/**
 * Home slips: one registry, one fixed order, at most one slip (BL-963; [FRAME-SLIP]; NS-23-R6, NS-23-R18; NS-50-R5;
 * ADR 0031; errata E36). Pure, no React Native import, so it is unit tested in test/slip-registry.test.ts.
 *
 * The order is data: SLIP_ORDER, six ranks. The higher rank shows and the others do not, so the past letter never
 * shows while a waiting card does. A slip type is a row in the registry; a type that is not in SLIP_ORDER throws
 * (development and test), and the source check in the test fails the build when Home renders a slip any other way.
 * Ranks nobody has built yet (seal-opened, a day the parent chose, Save a copy, the Days ask) are allowed to be
 * absent, so BL-942, BL-946 and BL-1014 each add one row here and one test, and nothing else moves.
 *
 * Not slips, and never in here: the reminder ask sheet and the Plus line (their own rules), and the photo start (it
 * belongs to the capture cluster). A slip never carries a count and a registry row holds ids, not words.
 */
import { resurfaced, type DraftCard, type ResurfacedCard } from './draft-card.logic';
import { tonightRows, type TonightRow } from './tonight-plus.logic';
import type { Entry } from '@/lib/store';

/** The one fixed order, highest rank first. 2b is a day the parent chose today (NS-50); 3b is the Days ask. */
export const SLIP_ORDER = ['waiting', 'sealOpened', 'day', 'saveACopy', 'daysAsk', 'pastLetter'] as const;
export type SlipType = (typeof SLIP_ORDER)[number];

/** What a rule reads. Only what Home already has; a rule that needs more adds a field here and a test. */
export type SlipState = {
  /** The waiting drafts as cards, newest first (draftCards). */
  cards: readonly DraftCard[];
  /** The few letters the past-letter slip may pick from (readTonight window). */
  window: readonly Entry[];
  /** Today, local, as `YYYY-MM-DD`. */
  today: string;
  /** This person quieted the open book (NS-23-R8). */
  quiet: boolean;
};

/** The slip that shows. One of these, or none. */
export type Slip =
  | { type: 'waiting'; rows: TonightRow[] }
  | { type: 'pastLetter'; card: ResurfacedCard };

/** A registry row: a type from SLIP_ORDER and the rule that says whether it is due. */
export type SlipRule = { type: SlipType; show: (state: SlipState) => Slip | null };

const waiting: SlipRule = {
  type: 'waiting',
  // Every waiting draft, in their existing order and folding (tonightRows): the waiting set is one slip.
  show: (s) => (s.cards.length > 0 ? { type: 'waiting', rows: tonightRows(s.cards) } : null),
};

const pastLetter: SlipRule = {
  type: 'pastLetter',
  show: (s) => {
    const card = resurfaced(s.window, s.today, s.cards.length, { quiet: s.quiet });
    return card ? { type: 'pastLetter', card } : null;
  },
};

/** Every slip Home can show today. Add a row here, in a PR with its test, and nowhere else. */
export const SLIP_REGISTRY: readonly SlipRule[] = [waiting, pastLetter];

/** Throws for a type that is not in SLIP_ORDER, or a type registered twice. Returns the rules in the fixed order. */
export function orderedRules(rules: readonly SlipRule[]): SlipRule[] {
  const seen = new Set<string>();
  for (const r of rules) {
    if (!(SLIP_ORDER as readonly string[]).includes(r.type)) throw new Error(`Unregistered slip type: ${String(r.type)}`);
    if (seen.has(r.type)) throw new Error(`Slip type registered twice: ${r.type}`);
    seen.add(r.type);
  }
  return [...rules].sort((a, b) => SLIP_ORDER.indexOf(a.type) - SLIP_ORDER.indexOf(b.type));
}

/** The one slip Home shows, or null: the first due rule in SLIP_ORDER, and no other. */
export function chooseSlip(state: SlipState, rules: readonly SlipRule[] = SLIP_REGISTRY): Slip | null {
  for (const rule of orderedRules(rules)) {
    const slip = rule.show(state);
    if (slip) return slip;
  }
  return null;
}
