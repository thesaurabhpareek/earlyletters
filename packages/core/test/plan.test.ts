/**
 * Entitlement engine (BL-036, TDD 08 section 2.3). The table below IS the
 * spec: each row becomes one test. Founder decisions of 3 Oct 2026 apply:
 * Apple-only StoreKit 2, Plus per account covering books the holder
 * parents, first book free, first-run batch free, joined books never count,
 * Read together free for 3 sessions per book (remote config), and write,
 * read, play, export and family authorship never gated.
 */
import { describe, expect, it } from 'vitest';
import {
  countStartedBooks,
  decide,
  DEFAULT_READ_TOGETHER_FREE_TRIES,
  FREE_FOREVER,
  freeTriesFrom,
  GATED_FEATURES,
  isAllowed,
  NO_PLAN,
  planActive,
  type Decision,
  type DecideInput,
  type FreeForever,
  type GatedFeature,
  type PlanView,
} from '../src';

const NOW = '2026-10-03T12:00:00Z';
const FUTURE = '2026-11-03T12:00:00Z';
const PAST = '2026-09-20T12:00:00Z';
const NINE_DAYS_AGO = '2026-09-24T12:00:00Z';

const plan = (over: Partial<PlanView> = {}): PlanView => ({
  state: 'active', effectiveUntil: FUTURE, verifiedAt: NOW, environment: 'production', isTester: false, ...over,
});
const P = plan();
const GRACE = plan({ state: 'grace' });
const TRIAL = plan({ state: 'trial' });
const LAPSED = plan({ state: 'expired', effectiveUntil: PAST });
const FREE = NO_PLAN;

type Over = Omit<Partial<DecideInput>, 'viewer'> & { viewer?: Partial<DecideInput['viewer']> };

function input(feature: GatedFeature, over: Over = {}): DecideInput {
  const inBook = feature !== 'start_book';
  const base: DecideInput = {
    now: NOW,
    feature,
    surface: 'normal',
    isBirthday: false,
    signedIn: true,
    online: true,
    viewer: { roleInBook: inBook ? 'parent' : null, own: FREE },
    book: inBook ? { coveredByOtherParent: false } : null,
    startedBooks: 1,
    inFirstRunBatch: false,
    readTogether: { triesUsedInBook: 3, freeTries: 3 },
    initiatedBy: 'user',
  };
  return { ...base, ...over, viewer: { ...base.viewer, ...over.viewer } } as DecideInput;
}

const allow = (via: Extract<Decision, { kind: 'allow' }>['via'], triesLeft?: number): Decision =>
  triesLeft === undefined ? { kind: 'allow', via } : { kind: 'allow', via, triesLeft };
const offer = (trigger: Extract<Decision, { kind: 'offer' }>['trigger'], needsSignIn = false): Decision => ({ kind: 'offer', trigger, needsSignIn });
const quiet = (reason: Extract<Decision, { kind: 'quiet' }>['reason']): Decision => ({ kind: 'quiet', reason });

interface Row {
  id: string;
  rule: string;
  input: DecideInput;
  expected: Decision;
}

const joinedOnly = countStartedBooks([{ createdByMe: false, deleted: false }]);
const hiddenOne = countStartedBooks([{ createdByMe: true, deleted: false }]); // hidden books are not deleted: they count
const onlyDeleted = countStartedBooks([{ createdByMe: true, deleted: true }, { createdByMe: false, deleted: false }]);

const TABLE: Row[] = [
  // start_book: first book free, first-run batch free, joined books never count (PRD-REQ-015)
  { id: '1', rule: 'first book is free', input: input('start_book', { startedBooks: 0 }), expected: allow('free_book') },
  { id: '2', rule: 'third child of a first-run batch (twins plus sibling) is free', input: input('start_book', { startedBooks: 2, inFirstRunBatch: true, surface: 'first_run' }), expected: allow('first_run') },
  { id: '3', rule: 'second book needs Plus', input: input('start_book', { startedBooks: 1 }), expected: offer('second_child') },
  { id: '4', rule: 'a hidden book still counts', input: input('start_book', { startedBooks: hiddenOne }), expected: offer('second_child') },
  { id: '5', rule: 'a book joined as co-parent never counts', input: input('start_book', { startedBooks: joinedOnly }), expected: allow('free_book') },
  { id: '6', rule: 'a book in the delete window does not count', input: input('start_book', { startedBooks: onlyDeleted }), expected: allow('free_book') },
  { id: '7', rule: 'own Plus starts any number of books', input: input('start_book', { startedBooks: 3, viewer: { own: P } }), expected: allow('plus_own') },
  { id: '8', rule: 'billing grace keeps Plus on (C-REQ-027)', input: input('start_book', { startedBooks: 2, viewer: { own: GRACE } }), expected: allow('plus_own') },
  { id: '9', rule: 'lapsed Plus cannot start another book', input: input('start_book', { startedBooks: 2, viewer: { own: LAPSED } }), expected: offer('second_child') },
  { id: '10', rule: 'a co-parent covering one book does not fund a new book', input: input('start_book', { startedBooks: 1, book: { coveredByOtherParent: true } }), expected: offer('second_child') },
  { id: '11', rule: 'a contributor-only person may start their own first book', input: input('start_book', { startedBooks: 0, viewer: { roleInBook: 'contributor' } }), expected: allow('free_book') },
  { id: '12', rule: 'signed out: sign in before the Plus sheet (R-1)', input: input('start_book', { startedBooks: 1, signedIn: false }), expected: offer('second_child', true) },

  // read_together: free for 3 sessions per book, then Plus (PRD-REQ-020)
  { id: '13', rule: 'parent with own Plus', input: input('read_together', { viewer: { own: P } }), expected: allow('plus_own') },
  { id: '14', rule: 'Free parent, the other parent holds Plus', input: input('read_together', { book: { coveredByOtherParent: true } }), expected: allow('plus_book') },
  { id: '15', rule: 'contributor in a covered book gets Plus features there', input: input('read_together', { viewer: { roleInBook: 'contributor' }, book: { coveredByOtherParent: true } }), expected: allow('plus_book') },
  { id: '16a', rule: 'try 1 of 3', input: input('read_together', { readTogether: { triesUsedInBook: 0 } }), expected: allow('try', 3) },
  { id: '16b', rule: 'try 2 of 3', input: input('read_together', { readTogether: { triesUsedInBook: 1 } }), expected: allow('try', 2) },
  { id: '16c', rule: 'try 3 of 3', input: input('read_together', { readTogether: { triesUsedInBook: 2 } }), expected: allow('try', 1) },
  { id: '17', rule: 'fourth session in a Free book: offer', input: input('read_together', { readTogether: { triesUsedInBook: 3 } }), expected: offer('read_together') },
  { id: '18', rule: 'contributor out of tries: quiet, never a Plus sheet (R-2)', input: input('read_together', { viewer: { roleInBook: 'contributor' } }), expected: quiet('contributor') },
  { id: '19', rule: 'remote config freeTries 5', input: input('read_together', { readTogether: { triesUsedInBook: 3, freeTries: 5 } }), expected: allow('try', 2) },
  { id: '20', rule: 'lapsed, only Plus sessions used before: tries start fresh', input: input('read_together', { viewer: { own: LAPSED }, readTogether: { triesUsedInBook: 0 } }), expected: allow('try', 3) },
  { id: '21', rule: 'birthday: no offer that day', input: input('read_together', { isBirthday: true }), expected: quiet('birthday') },
  { id: '19b', rule: 'remote config missing: default 3', input: input('read_together', { readTogether: { triesUsedInBook: 2 } }), expected: allow('try', 1) },
  { id: '19c', rule: 'remote config garbage (-1): default 3', input: input('read_together', { readTogether: { triesUsedInBook: 2, freeTries: -1 } }), expected: allow('try', 1) },
  { id: '19d', rule: 'remote config 0: Plus from the first session', input: input('read_together', { readTogether: { triesUsedInBook: 0, freeTries: 0 } }), expected: offer('read_together') },
  { id: '19e', rule: 'contributor with own Plus in a Free book is not covered: tries apply', input: input('read_together', { viewer: { roleInBook: 'contributor', own: P }, readTogether: { triesUsedInBook: 1 } }), expected: allow('try', 2) },

  // backup_upload
  { id: '22', rule: 'book Plus backs up', input: input('backup_upload', { book: { coveredByOtherParent: true } }), expected: allow('plus_book') },
  { id: '23', rule: 'Free book, background uploader: quiet, audio stays on the phone', input: input('backup_upload', { initiatedBy: 'background' }), expected: quiet('free_background') },
  { id: '24', rule: 'Free book, parent taps Turn on backup', input: input('backup_upload'), expected: offer('backup') },

  // theme_extra
  { id: '25', rule: 'Free parent taps an extra theme', input: input('theme_extra'), expected: offer('themes') },
  { id: '26', rule: 'lapsed with an extra theme: not allowed (render the default, keep the choice)', input: input('theme_extra', { viewer: { own: LAPSED } }), expected: offer('themes') },

  // plan state and cache (C-NFR-004)
  { id: '27', rule: 'cache 9 days old, effectiveUntil ahead: fail open for payers', input: input('read_together', { viewer: { own: plan({ verifiedAt: NINE_DAYS_AGO }) } }), expected: allow('plus_own') },
  { id: '28', rule: 'cache old, effectiveUntil passed, offline: Free, no offer until online', input: input('read_together', { online: false, viewer: { own: plan({ verifiedAt: NINE_DAYS_AGO, effectiveUntil: PAST }) } }), expected: quiet('offline') },
  { id: '29', rule: 'sandbox entitlement, not a tester: Free', input: input('read_together', { viewer: { own: plan({ environment: 'sandbox' }) } }), expected: offer('read_together') },
  { id: '29b', rule: 'sandbox entitlement for a TestFlight tester counts', input: input('read_together', { viewer: { own: plan({ environment: 'sandbox', isTester: true }) } }), expected: allow('plus_own') },
  { id: '29c', rule: 'Xcode StoreKit test entitlement, not a tester: Free', input: input('start_book', { viewer: { own: plan({ environment: 'xcode' }) } }), expected: offer('second_child') },
  { id: '30', rule: 'refunded: Free immediately (C-REQ-029)', input: input('read_together', { viewer: { own: plan({ state: 'refunded' }) } }), expected: offer('read_together') },
  { id: '30b', rule: 'revoked (Family Sharing removed): Free', input: input('backup_upload', { viewer: { own: plan({ state: 'revoked' }) } }), expected: offer('backup') },
  { id: '30c', rule: 'billing retry outside grace: Free extras', input: input('theme_extra', { viewer: { own: plan({ state: 'billing_retry' }) } }), expected: offer('themes') },
  { id: '30d', rule: 'trial counts as Plus', input: input('theme_extra', { viewer: { own: TRIAL } }), expected: allow('plus_own') },
  { id: '30e', rule: 'lifetime (no end date) counts', input: input('backup_upload', { viewer: { own: plan({ effectiveUntil: null }) } }), expected: allow('plus_own') },
  { id: '31', rule: 'both parents hold Plus: allow, no offer anywhere (R-3)', input: input('read_together', { viewer: { own: P }, book: { coveredByOtherParent: true } }), expected: allow('plus_own') },
  { id: '32', rule: 'first-run surface: quiet', input: input('theme_extra', { surface: 'first_run' }), expected: quiet('first_run') },
  { id: '32b', rule: 'first-run surface, second book outside the batch: quiet', input: input('start_book', { surface: 'first_run', startedBooks: 1 }), expected: quiet('first_run') },
];

describe('decide(): truth table (TDD 08 2.3 with founder decisions of 3 Oct 2026)', () => {
  it('has at least 30 rows and covers every gated feature', () => {
    expect(TABLE.length).toBeGreaterThanOrEqual(30);
    for (const f of GATED_FEATURES) expect(TABLE.some((r) => r.input.feature === f), f).toBe(true);
    expect(new Set(TABLE.map((r) => r.id)).size).toBe(TABLE.length);
  });

  it.each(TABLE.map((r) => [r.id, r.rule, r] as const))('row %s: %s', (_id, _rule, row) => {
    expect(decide(row.input)).toEqual(row.expected);
  });
});

describe('free forever (LEGAL-REQ-050, row 33)', () => {
  it('free-forever features are not gated features, at compile time and at run time', () => {
    for (const f of FREE_FOREVER) {
      expect((GATED_FEATURES as readonly string[]).includes(f)).toBe(false);
      // Run time: a caller that bypasses the types gets a programmer error, never a gate.
      expect(() => decide({ ...input('read_together'), feature: f as unknown as GatedFeature })).toThrow();
    }
    const write: FreeForever = 'write';
    // @ts-expect-error a free-forever feature cannot be passed to decide()
    const bad: DecideInput = { ...input('read_together'), feature: write };
    expect(() => decide(bad)).toThrow();
  });

  it('lists exactly write, read, play, export and family authorship among the free ones', () => {
    for (const f of ['write', 'read', 'play_recording', 'export', 'family_authors'] as const) expect(FREE_FOREVER).toContain(f);
  });
});

describe('decide(): properties over every combination', () => {
  const plans: PlanView[] = [FREE, P, GRACE, TRIAL, LAPSED, plan({ state: 'refunded' }), plan({ environment: 'sandbox' }), plan({ effectiveUntil: PAST })];
  const all: DecideInput[] = [];
  for (const feature of GATED_FEATURES)
    for (const own of plans)
      for (const roleInBook of ['parent', 'contributor', null] as const)
        for (const covered of [false, true])
          for (const surface of ['first_run', 'normal'] as const)
            for (const isBirthday of [false, true])
              for (const startedBooks of [0, 1, 3])
                for (const inFirstRunBatch of [false, true])
                  for (const triesUsedInBook of [0, 2, 3, 7])
                    for (const signedIn of [false, true])
                      for (const initiatedBy of ['user', 'background'] as const)
                        all.push(
                          input(feature, {
                            viewer: { roleInBook: feature === 'start_book' ? null : roleInBook, own },
                            book: feature === 'start_book' ? null : { coveredByOtherParent: covered },
                            surface, isBirthday, startedBooks, inFirstRunBatch, signedIn, initiatedBy,
                            readTogether: { triesUsedInBook },
                          }),
                        );

  it('never offers on the first-run surface', () => {
    for (const i of all) if (i.surface === 'first_run') expect(decide(i).kind).not.toBe('offer');
  });

  it('never offers Plus to a contributor inside a book (R-2)', () => {
    for (const i of all) if (i.viewer.roleInBook === 'contributor') expect(decide(i).kind).not.toBe('offer');
  });

  it('never offers Plus where it is already on (R-3)', () => {
    for (const i of all) {
      const on = (planActive(i.viewer.own, i.now) && (i.feature === 'start_book' || i.viewer.roleInBook === 'parent')) || i.book?.coveredByOtherParent;
      if (on) expect(decide(i).kind).toBe('allow');
    }
  });

  it('going from Free to Plus never takes an allow away', () => {
    for (const i of all) {
      if (planActive(i.viewer.own, i.now)) continue;
      const before = decide(i);
      const after = decide({ ...i, viewer: { ...i.viewer, own: P } });
      if (isAllowed(before)) expect(isAllowed(after)).toBe(true);
    }
  });

  it('lapsing is the same as never having had Plus', () => {
    for (const i of all) {
      if (i.viewer.own !== LAPSED) continue;
      expect(decide(i)).toEqual(decide({ ...i, viewer: { ...i.viewer, own: FREE } }));
    }
  });

  it('a first-run batch child is always free', () => {
    for (const i of all) if (i.feature === 'start_book' && i.inFirstRunBatch) expect(decide(i)).toEqual(allow('first_run'));
  });

  it('runs in well under 1 ms per decision', () => {
    const t = performance.now();
    for (const i of all) decide(i);
    expect((performance.now() - t) / all.length).toBeLessThan(1);
  });
});

describe('helpers', () => {
  it('planActive: the end instant is exclusive', () => {
    expect(planActive(plan({ effectiveUntil: NOW }), NOW)).toBe(false);
    expect(planActive(plan({ effectiveUntil: FUTURE }), NOW)).toBe(true);
  });

  it('countStartedBooks counts mine and hidden, never joined or deleted', () => {
    expect(
      countStartedBooks([
        { createdByMe: true, deleted: false },
        { createdByMe: true, deleted: false },
        { createdByMe: true, deleted: true },
        { createdByMe: false, deleted: false },
      ]),
    ).toBe(2);
  });

  it('freeTriesFrom sanitises remote config', () => {
    expect(freeTriesFrom(undefined)).toBe(DEFAULT_READ_TOGETHER_FREE_TRIES);
    expect(freeTriesFrom('5')).toBe(3);
    expect(freeTriesFrom(2.5)).toBe(3);
    expect(freeTriesFrom(NaN)).toBe(3);
    expect(freeTriesFrom(5)).toBe(5);
    expect(freeTriesFrom(0)).toBe(0);
    expect(freeTriesFrom(10_000)).toBe(100);
  });
});
