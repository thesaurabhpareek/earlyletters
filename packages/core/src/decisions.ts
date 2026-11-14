/**
 * Parent decisions logic (NX-39 v2 R20, R41, BL-860).
 *
 * What a parent has hidden: a day or a stretch (from and until). There is no
 * stored per-photo key (ML-13, R41): one unattached photo is hidden in memory
 * for the open chooser session only, by the caller, and never lands here.
 * These live in their own small store, keyed by calendar day with no local_id
 * and no asset id, OUTSIDE the disposable moments index (ML-4). A rebuild, a
 * rule-version change, a revoke and re-grant, Recently Deleted purging, "Stop
 * these", "Forget the list" and switching suggestions off all leave them.
 * Only Erase everything, Delete account and the parent's own "Clear hidden
 * choices" remove them.
 *
 * Pure logic. Persistence is BL-877. The app cannot know why a day was hidden
 * and must not guess: a hidden range simply never produces a card.
 */
import { buildMoments, dayFromNumber, dayNumberOf, type Moment, type MomentItem } from './moments';

export type DecisionErrorCode = 'INVALID_DAY' | 'INVALID_RANGE' | 'UNKNOWN_EVENT';

export class DecisionError extends Error {
  constructor(readonly code: DecisionErrorCode) {
    super(code);
    this.name = 'DecisionError';
  }
}

export type ParentDecision =
  | { readonly kind: 'day'; readonly id: string; readonly day: string }
  | { readonly kind: 'stretch'; readonly id: string; readonly from: string; readonly until: string };

export interface DecisionsState {
  readonly entries: readonly ParentDecision[];
}

/** An inclusive run of calendar days. */
export interface DayRange {
  readonly from: string;
  readonly until: string;
}

export const emptyDecisions = (): DecisionsState => ({ entries: [] });
export const listDecisions = (state: DecisionsState): readonly ParentDecision[] => state.entries;

function dayNumber(day: string): number {
  const n = dayNumberOf(day);
  if (n === null) throw new DecisionError('INVALID_DAY');
  return n;
}

function add(state: DecisionsState, entry: ParentDecision): DecisionsState {
  if (state.entries.some((e) => e.id === entry.id)) return state;
  const start = (d: ParentDecision) => (d.kind === 'stretch' ? d.from : d.day);
  const entries = [...state.entries, entry].sort((a, b) => {
    const [sa, sb] = [start(a), start(b)]; // ISO days sort as text; no locale involved
    if (sa !== sb) return sa < sb ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return { entries };
}

/** Hide one day. Hiding the same day again changes nothing. */
export function hideDay(state: DecisionsState, day: string): DecisionsState {
  dayNumber(day);
  return add(state, { kind: 'day', id: `day:${day}`, day });
}

/** Hide a stretch, both ends included. */
export function hideStretch(state: DecisionsState, from: string, until: string): DecisionsState {
  if (dayNumber(from) > dayNumber(until)) throw new DecisionError('INVALID_RANGE');
  return add(state, { kind: 'stretch', id: `stretch:${from}:${until}`, from, until });
}

/** Undo exactly one hide (the Hidden choices page). An id that is not there changes nothing. */
export function undoDecision(state: DecisionsState, id: string): DecisionsState {
  return state.entries.some((e) => e.id === id) ? { entries: state.entries.filter((e) => e.id !== id) } : state;
}

/** The parent's own "Clear hidden choices". */
export const clearHiddenChoices = (_state: DecisionsState): DecisionsState => emptyDecisions();

/** Every hidden day as sorted, merged ranges (touching ranges join). */
export function hiddenRanges(state: DecisionsState): DayRange[] {
  const spans: Array<[number, number]> = [];
  for (const e of state.entries) {
    if (e.kind === 'day') spans.push([dayNumber(e.day), dayNumber(e.day)]);
    else if (e.kind === 'stretch') spans.push([dayNumber(e.from), dayNumber(e.until)]);
  }
  spans.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: Array<[number, number]> = [];
  for (const [from, until] of spans) {
    const last = merged[merged.length - 1];
    if (last && from <= last[1] + 1) last[1] = Math.max(last[1], until);
    else merged.push([from, until]);
  }
  return merged.map(([from, until]) => ({ from: dayFromNumber(from), until: dayFromNumber(until) }));
}

export function isDayHidden(state: DecisionsState, day: string): boolean {
  const n = dayNumber(day);
  return hiddenRanges(state).some((r) => dayNumber(r.from) <= n && n <= dayNumber(r.until));
}

/**
 * Remove hidden days from moments, after the engine has run (hiding never
 * changes the rule, R15). A moment that does not touch a hidden day comes back
 * as it was. A moment that does is cut at the hidden days into leftover pieces,
 * and each piece is judged afresh (R20, ML-14): the R15 function runs on the
 * items inside the piece alone, so a hidden day is a barrier the one-empty-day
 * gap rule cannot bridge, a lone leftover day with fewer than 3 items is dropped,
 * and a piece carries the reasons and city key of its own items, never the
 * parent's. A wholly hidden moment is gone. Inputs are not changed.
 */
export function applyDecisions(
  moments: readonly Moment[],
  items: readonly MomentItem[],
  state: DecisionsState,
): Moment[] {
  const hidden = hiddenRanges(state).map((r) => [dayNumber(r.from), dayNumber(r.until)] as const);
  const dated = items.flatMap((it) => {
    const n = dayNumberOf(it.day);
    return n === null ? [] : [{ it, n }];
  });
  const out: Moment[] = [];
  for (const m of moments) {
    const first = dayNumber(m.startDay);
    const last = dayNumber(m.endDay);
    if (!hidden.some(([from, until]) => from <= last && until >= first)) {
      out.push(m);
      continue;
    }
    const pieces: Array<readonly [number, number]> = [];
    let start = first;
    for (const [from, until] of hidden) {
      if (until < start) continue;
      if (from > last) break;
      if (from > start) pieces.push([start, from - 1]);
      start = until + 1;
      if (start > last) break;
    }
    if (start <= last) pieces.push([start, last]);
    for (const [a, b] of pieces) {
      out.push(...buildMoments(dated.filter((d) => d.n >= a && d.n <= b).map((d) => d.it), m.ruleVersion));
    }
  }
  return out;
}

/** What happened to the library side or the account. Closed lists: an unknown event is refused. */
export const DECISION_EVENTS_THAT_KEEP = Object.freeze([
  'rebuild',
  'rule_version_change',
  'revoke_and_regrant',
  'recently_deleted_purge',
  'stop_these',
  'forget_list',
  'switch_off',
  'delete_book',
  'take_it_off',
  'letter_purged',
] as const);

export const DECISION_EVENTS_THAT_REMOVE = Object.freeze(['erase_everything', 'delete_account', 'clear_hidden_choices'] as const);

export type DecisionsEvent = (typeof DECISION_EVENTS_THAT_KEEP)[number] | (typeof DECISION_EVENTS_THAT_REMOVE)[number];

export function onDecisionsEvent(state: DecisionsState, event: DecisionsEvent): DecisionsState {
  if ((DECISION_EVENTS_THAT_REMOVE as readonly string[]).includes(event)) return emptyDecisions();
  if ((DECISION_EVENTS_THAT_KEEP as readonly string[]).includes(event)) return state;
  throw new DecisionError('UNKNOWN_EVENT');
}

const STORE_VERSION = 1;

/** The text a store writes. Entries only; ids are derived on the way back in. */
export function serializeDecisions(state: DecisionsState): string {
  const entries = state.entries.map((e) =>
    e.kind === 'day' ? { kind: e.kind, day: e.day }
      : { kind: e.kind, from: e.from, until: e.until },
  );
  return JSON.stringify({ v: STORE_VERSION, entries });
}

/**
 * Read a store back. Anything unreadable gives null, never an empty list: a
 * damaged store must not quietly unhide what a parent hid. The caller keeps
 * what it has and may ask the parent.
 */
export function parseDecisions(text: string): DecisionsState | null {
  try {
    const data: unknown = JSON.parse(text);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return null;
    const { v, entries } = data as { v?: unknown; entries?: unknown };
    if (v !== STORE_VERSION || !Array.isArray(entries)) return null;
    let state = emptyDecisions();
    for (const raw of entries as unknown[]) {
      if (typeof raw !== 'object' || raw === null) return null;
      const e = raw as Record<string, unknown>;
      if (e.kind === 'day' && typeof e.day === 'string') state = hideDay(state, e.day);
      else if (e.kind === 'stretch' && typeof e.from === 'string' && typeof e.until === 'string') state = hideStretch(state, e.from, e.until);
      else return null;
    }
    return state;
  } catch {
    return null;
  }
}
