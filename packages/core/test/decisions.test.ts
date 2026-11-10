/**
 * Parent decisions (NX-39 v2 R20, R41, BL-860). Hidden days and hidden
 * stretches live in their own small store, keyed by calendar day with
 * no local_id, outside the disposable index. Pure logic only; persistence is
 * BL-877. Fixtures use the fictional family "Asha".
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applyDecisions,
  clearHiddenChoices,
  DECISION_EVENTS_THAT_KEEP,
  DECISION_EVENTS_THAT_REMOVE,
  DecisionError,
  emptyDecisions,
  hiddenRanges,
  hideDay,
  hideStretch,
  isDayHidden,
  listDecisions,
  onDecisionsEvent,
  parseDecisions,
  serializeDecisions,
  undoDecision,
  type DecisionsEvent,
  type DecisionsState,
} from '../src/decisions';
import * as decisionsModule from '../src/decisions';
import { buildMoments, RULE_VERSION, type MomentItem } from '../src/moments';

const item = (day: string, cityKey: string | null = null): MomentItem => ({ day, cityKey });
const range = (m: { startDay: string; endDay: string }) => `${m.startDay}..${m.endDay}`;

const ASHA_ITEMS: MomentItem[] = [
  item('2026-03-06', 'asha-city-b'),
  item('2026-03-07', 'asha-city-b'),
  item('2026-03-08', 'asha-city-b'),
  item('2026-03-09', 'asha-city-b'),
  item('2026-03-20', 'asha-city-a'),
  item('2026-03-21', 'asha-city-a'),
];

describe('[NX-39-R41] parent decisions survive every rebuild path and go only on Erase or Clear', () => {
  const asha = (): DecisionsState =>
    hideDay(hideStretch(hideDay(emptyDecisions(), '2026-03-07'), '2026-03-20', '2026-03-21'), '2026-03-08');

  it('keeps every decision through each event that is not an erase or a clear', () => {
    const before = serializeDecisions(asha());
    for (const event of DECISION_EVENTS_THAT_KEEP) {
      expect(serializeDecisions(onDecisionsEvent(asha(), event)), event).toBe(before);
    }
  });

  it('names the rebuild paths of R41 among the events that keep', () => {
    for (const event of ['rebuild', 'rule_version_change', 'revoke_and_regrant', 'recently_deleted_purge', 'stop_these', 'forget_list', 'switch_off'] as const) {
      expect(DECISION_EVENTS_THAT_KEEP).toContain(event);
    }
    // Deleting a book, a letter or a photo copy is not an erase of the parent's choices (R31: Erase everything and Delete account only).
    for (const event of ['delete_book', 'take_it_off', 'letter_purged'] as const) {
      expect(DECISION_EVENTS_THAT_KEEP).toContain(event);
    }
  });

  it('removes decisions only on Erase everything, Delete account, or the parent clearing them', () => {
    expect([...DECISION_EVENTS_THAT_REMOVE].sort()).toEqual(['clear_hidden_choices', 'delete_account', 'erase_everything']);
    for (const event of DECISION_EVENTS_THAT_REMOVE) {
      expect(listDecisions(onDecisionsEvent(asha(), event)), event).toEqual([]);
    }
    expect(listDecisions(clearHiddenChoices(asha()))).toEqual([]);
  });

  it('the two event lists do not overlap and an unknown event is refused, not ignored', () => {
    for (const e of DECISION_EVENTS_THAT_KEEP) expect(DECISION_EVENTS_THAT_REMOVE as readonly string[]).not.toContain(e);
    expect(() => onDecisionsEvent(asha(), 'something_else' as DecisionsEvent)).toThrow(DecisionError);
  });

  it('survives the index being wiped and rebuilt: the saved text is all that is needed', () => {
    const saved = serializeDecisions(asha());
    // The index is disposable: moments are rebuilt from metadata, decisions come back from their own store.
    const rebuilt = buildMoments(ASHA_ITEMS, RULE_VERSION);
    const restored = parseDecisions(saved);
    expect(restored).not.toBeNull();
    expect(applyDecisions(rebuilt, ASHA_ITEMS, restored!).map(range)).toEqual(applyDecisions(buildMoments(ASHA_ITEMS, RULE_VERSION), ASHA_ITEMS, asha()).map(range));
    expect(serializeDecisions(restored!)).toBe(saved);
  });

  it('is keyed by calendar day and holds no local_id or asset id', () => {
    const text = serializeDecisions(asha());
    expect(text).not.toMatch(/local_?id|asset|geohash|latitude|longitude/i);
    for (const d of listDecisions(asha())) {
      expect(Object.keys(d).sort()).toEqual(
        d.kind === 'day' ? ['day', 'id', 'kind'] : ['from', 'id', 'kind', 'until'],
      );
    }
  });

  it('[NX-39-R41] the decisions store has no photo-key field and no function that stores one', () => {
    expect(Object.keys(decisionsModule).filter((k) => /photo|key/i.test(k))).toEqual([]);
    const src = readFileSync(new URL('../src/decisions.ts', import.meta.url), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/photo/i);
    expect(code).not.toMatch(/\bkey\b/);
    // An old store that holds a photo entry is not readable as a store (it reads as null, never as an empty list).
    expect(parseDecisions('{"v":1,"entries":[{"kind":"photo","day":"2026-03-01","key":"asha-photo-1"}]}')).toBeNull();
    for (const d of listDecisions(hideStretch(hideDay(emptyDecisions(), '2026-03-07'), '2026-03-20', '2026-03-21'))) {
      expect(Object.keys(d)).not.toContain('key');
    }
  });

  it('a corrupt or unknown-version store reads as null, never as an empty list that would unhide things', () => {
    for (const bad of ['', '{', 'null', '[]', '{"v":2,"entries":[]}', '{"v":1}', '{"v":1,"entries":[{"kind":"day","day":"2026-13-01"}]}',
      '{"v":1,"entries":[{"kind":"stretch","from":"2026-03-09","until":"2026-03-01"}]}', '{"v":1,"entries":[{"kind":"mystery"}]}',
      '{"v":1,"entries":[{"kind":"photo","day":"2026-03-01","key":""}]}']) {
      expect(parseDecisions(bad), bad).toBeNull();
    }
    expect(listDecisions(parseDecisions(serializeDecisions(emptyDecisions()))!)).toEqual([]);
  });
});

describe('[NX-39-R20] a range the parent excludes never produces a card', () => {
  it('a hidden day leaves no moment covering it, in any rebuild', () => {
    const state = hideDay(emptyDecisions(), '2026-03-07');
    const moments = applyDecisions(buildMoments(ASHA_ITEMS, RULE_VERSION), ASHA_ITEMS, state);
    expect(moments.map(range)).toEqual(['2026-03-08..2026-03-09', '2026-03-20..2026-03-21']);
    for (const m of moments) expect(m.startDay <= '2026-03-07' && '2026-03-07' <= m.endDay).toBe(false);
  });

  it('a hidden stretch with a from and an until removes both ends and everything between', () => {
    const state = hideStretch(emptyDecisions(), '2026-03-06', '2026-03-09');
    expect(applyDecisions(buildMoments(ASHA_ITEMS, RULE_VERSION), ASHA_ITEMS, state).map(range)).toEqual(['2026-03-20..2026-03-21']);
  });

  it('a stretch that ends mid-moment trims, and one that covers a whole moment drops it', () => {
    expect(applyDecisions(buildMoments(ASHA_ITEMS, RULE_VERSION), ASHA_ITEMS, hideStretch(emptyDecisions(), '2026-03-01', '2026-03-07')).map(range))
      .toEqual(['2026-03-08..2026-03-09', '2026-03-20..2026-03-21']);
    expect(applyDecisions(buildMoments(ASHA_ITEMS, RULE_VERSION), ASHA_ITEMS, hideStretch(emptyDecisions(), '2026-03-19', '2026-03-31')).map(range))
      .toEqual(['2026-03-06..2026-03-09']);
  });

  it('[NX-39-R20] a middle hidden day splits a moment and the hidden day is a barrier the gap rule cannot bridge', () => {
    const items = [item('2026-03-05', 'asha-city-a'), item('2026-03-06', 'asha-city-a'), item('2026-03-07', 'asha-city-a'),
      item('2026-03-08', 'asha-city-a'), item('2026-03-09', 'asha-city-a')];
    const moments = buildMoments(items, RULE_VERSION);
    expect(moments.map(range)).toEqual(['2026-03-05..2026-03-09']);
    // Without a barrier, 06 and 08 are one empty day apart and the rule would join them again.
    expect(applyDecisions(moments, items, hideDay(emptyDecisions(), '2026-03-07')).map(range)).toEqual(['2026-03-05..2026-03-06', '2026-03-08..2026-03-09']);
  });

  it('[NX-39-R20] a lone leftover day with fewer than 3 items is dropped', () => {
    const moments = applyDecisions(buildMoments(ASHA_ITEMS, RULE_VERSION), ASHA_ITEMS, hideDay(emptyDecisions(), '2026-03-07'));
    expect(moments.map(range)).not.toContain('2026-03-06..2026-03-06');
    expect(moments.map(range)).toEqual(['2026-03-08..2026-03-09', '2026-03-20..2026-03-21']);
  });

  it('[NX-39-R20] a leftover piece with 2 active days or 3 items survives with reasons from running R15 on its own items', () => {
    const items = [item('2026-03-04', 'asha-city-a'), item('2026-03-05', 'asha-city-a'), item('2026-03-06', 'asha-city-a'),
      item('2026-03-07', 'asha-city-a'), item('2026-03-07', 'asha-city-a'), item('2026-03-07', 'asha-city-a')];
    const out = applyDecisions(buildMoments(items, RULE_VERSION), items, hideDay(emptyDecisions(), '2026-03-06'));
    expect(out).toEqual([
      { startDay: '2026-03-04', endDay: '2026-03-05', cityKey: 'asha-city-a', reasons: ['DAY_RUN', 'SAME_CITY'], ruleVersion: RULE_VERSION },
      { startDay: '2026-03-07', endDay: '2026-03-07', cityKey: 'asha-city-a', reasons: ['MIN_ITEMS_MET'], ruleVersion: RULE_VERSION },
    ]);
  });

  it('[NX-39-R20] pieces do not copy the parent moment\'s reasons or city key', () => {
    const items = [item('2026-03-04', 'asha-city-a'), item('2026-03-05', 'asha-city-a'), item('2026-03-06', 'asha-city-a'),
      item('2026-03-07'), item('2026-03-08')];
    const [parent] = buildMoments(items, RULE_VERSION);
    expect(parent!.cityKey).toBe('asha-city-a');
    expect(parent!.reasons).toEqual(['DAY_RUN', 'SAME_CITY', 'NO_PLACE_JOINED', 'MIN_ITEMS_MET']);
    const [left, right] = applyDecisions([parent!], items, hideDay(emptyDecisions(), '2026-03-06'));
    expect(left).toEqual({ startDay: '2026-03-04', endDay: '2026-03-05', cityKey: 'asha-city-a', reasons: ['DAY_RUN', 'SAME_CITY'], ruleVersion: RULE_VERSION });
    expect(right).toEqual({ startDay: '2026-03-07', endDay: '2026-03-08', cityKey: null, reasons: ['DAY_RUN', 'NO_PLACE_JOINED'], ruleVersion: RULE_VERSION });
  });

  it('a moment the parent did not touch comes back as it was', () => {
    const moments = buildMoments(ASHA_ITEMS, RULE_VERSION);
    expect(applyDecisions(moments, ASHA_ITEMS, hideDay(emptyDecisions(), '2026-04-01'))).toEqual(moments);
  });

  it('hiding changes only what is shown, never the rule: the same items still make the same moments', () => {
    const before = buildMoments(ASHA_ITEMS, RULE_VERSION);
    applyDecisions(before, ASHA_ITEMS, hideStretch(emptyDecisions(), '2026-03-01', '2026-03-31'));
    expect(buildMoments(ASHA_ITEMS, RULE_VERSION)).toEqual(before);
  });

  it('does not mutate the moments it is given', () => {
    const moments = Object.freeze(buildMoments(ASHA_ITEMS, RULE_VERSION).map((m) => Object.freeze({ ...m })));
    expect(() => applyDecisions(moments, ASHA_ITEMS, hideDay(emptyDecisions(), '2026-03-07'))).not.toThrow();
  });
});

describe('[NX-39-R41] day-range algebra', () => {
  it('hiding is idempotent and order does not matter', () => {
    const a = hideStretch(hideDay(emptyDecisions(), '2026-03-07'), '2026-03-20', '2026-03-21');
    const b = hideDay(hideStretch(hideDay(emptyDecisions(), '2026-03-07'), '2026-03-20', '2026-03-21'), '2026-03-07');
    expect(serializeDecisions(a)).toBe(serializeDecisions(b));
    expect(listDecisions(b)).toHaveLength(2);
  });

  it('merges overlapping and touching ranges when asked what is hidden, and keeps the entries apart for Undo', () => {
    let s = hideStretch(emptyDecisions(), '2026-03-01', '2026-03-05');
    s = hideStretch(s, '2026-03-04', '2026-03-10');
    s = hideDay(s, '2026-03-11');
    s = hideDay(s, '2026-03-20');
    expect(hiddenRanges(s)).toEqual([
      { from: '2026-03-01', until: '2026-03-11' },
      { from: '2026-03-20', until: '2026-03-20' },
    ]);
    expect(listDecisions(s)).toHaveLength(4);
  });

  it('a one-day stretch equals a hidden day for coverage', () => {
    expect(hiddenRanges(hideStretch(emptyDecisions(), '2026-03-07', '2026-03-07'))).toEqual(hiddenRanges(hideDay(emptyDecisions(), '2026-03-07')));
  });

  it('Undo removes exactly one entry; a day hidden twice over stays hidden until both are undone', () => {
    let s = hideDay(hideStretch(emptyDecisions(), '2026-03-05', '2026-03-09'), '2026-03-07');
    const dayEntry = listDecisions(s).find((d) => d.kind === 'day')!;
    s = undoDecision(s, dayEntry.id);
    expect(isDayHidden(s, '2026-03-07')).toBe(true);
    const stretchEntry = listDecisions(s).find((d) => d.kind === 'stretch')!;
    s = undoDecision(s, stretchEntry.id);
    expect(isDayHidden(s, '2026-03-07')).toBe(false);
    expect(undoDecision(s, 'day:2030-01-01')).toEqual(s); // nothing there: no change, no error
  });

  it('handles month, year and leap-day edges', () => {
    const s = hideStretch(emptyDecisions(), '2027-12-30', '2028-01-02');
    expect(isDayHidden(s, '2027-12-31')).toBe(true);
    expect(isDayHidden(s, '2028-01-03')).toBe(false);
    expect(isDayHidden(hideDay(emptyDecisions(), '2028-02-29'), '2028-02-29')).toBe(true);
  });

  it('refuses a bad day, a backwards stretch and with a typed code', () => {
    const code = (fn: () => unknown) => {
      try { fn(); } catch (e) { return (e as DecisionError).code; }
      return 'none';
    };
    expect(code(() => hideDay(emptyDecisions(), '2026-02-30'))).toBe('INVALID_DAY');
    expect(code(() => hideStretch(emptyDecisions(), '2026-03-09', '2026-03-01'))).toBe('INVALID_RANGE');
  });

  it('does not mutate the state it is given', () => {
    const s = Object.freeze(emptyDecisions());
    expect(() => hideDay(s, '2026-03-07')).not.toThrow();
    expect(listDecisions(s)).toEqual([]);
  });

  it('imports only the shared day helpers and nothing that reads a clock, storage or the network', () => {
    const src = readFileSync(new URL('../src/decisions.ts', import.meta.url), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const imports = [...code.matchAll(/^\s*import[^;]*from\s+'([^']+)'/gm)].map((m) => m[1]);
    expect(imports).toEqual(['./moments']);
    for (const banned of [/Date\.now/, /new Date\(/, /Math\.random/, /\bIntl\b/, /toLocale|localeCompare/, /\bfetch\b/, /sqlite/i, /AsyncStorage/, /react-native/]) {
      expect(code, String(banned)).not.toMatch(banned);
    }
  });
});
