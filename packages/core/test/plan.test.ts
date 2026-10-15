/**
 * Entitlement engine (BL-036, TDD 08 section 2.3; membership D-082, D-083).
 * The tables below ARE the spec: each row becomes one test.
 *
 * Membership (4 Oct 2026): the first 2 letters kept per account are free,
 * across every book; keeping another needs Plus. Starting a book and Read
 * together are no longer gated. Reading, playing, exporting, deleting,
 * restoring and family authorship are never gated, and writing is gated only
 * at the Keep step (`keep_letter`), never while capturing or typing.
 */
import { describe, expect, it } from 'vitest';
import {
  decide,
  decideKeepLetter,
  DEFAULT_FREE_LETTERS,
  FREE_FOREVER,
  freeLettersFrom,
  GATED_FEATURES,
  isAllowed,
  MAX_FREE_LETTERS,
  NO_PLAN,
  planActive,
  type Decision,
  type DecideInput,
  type FreeForever,
  type GatedFeature,
  type KeepLetterDecision,
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
type OtherGate = Exclude<GatedFeature, 'keep_letter'>;

function input(feature: OtherGate, over: Over = {}): DecideInput {
  const base: DecideInput = {
    now: NOW,
    feature,
    surface: 'normal',
    isBirthday: false,
    signedIn: true,
    online: true,
    viewer: { roleInBook: 'parent', own: FREE },
    book: { coveredByOtherParent: false },
    initiatedBy: 'user',
  };
  return { ...base, ...over, viewer: { ...base.viewer, ...over.viewer } } as DecideInput;
}

const allow = (via: Extract<Decision, { kind: 'allow' }>['via']): Decision => ({ kind: 'allow', via });
const offer = (trigger: Extract<Decision, { kind: 'offer' }>['trigger'], needsSignIn = false): Decision => ({ kind: 'offer', trigger, needsSignIn });
const quiet = (reason: Extract<Decision, { kind: 'quiet' }>['reason']): Decision => ({ kind: 'quiet', reason });

interface Row {
  id: string;
  rule: string;
  input: DecideInput;
  expected: Decision;
}

const TABLE: Row[] = [
  // backup_upload
  { id: '1', rule: 'own Plus backs up', input: input('backup_upload', { viewer: { own: P } }), expected: allow('plus_own') },
  { id: '2', rule: 'book Plus backs up', input: input('backup_upload', { book: { coveredByOtherParent: true } }), expected: allow('plus_book') },
  { id: '3', rule: 'contributor in a covered book gets Plus features there', input: input('backup_upload', { viewer: { roleInBook: 'contributor' }, book: { coveredByOtherParent: true } }), expected: allow('plus_book') },
  { id: '4', rule: 'Free book, background uploader: quiet, audio stays on the phone', input: input('backup_upload', { initiatedBy: 'background' }), expected: quiet('free_background') },
  { id: '5', rule: 'Free book, parent taps Turn on backup', input: input('backup_upload'), expected: offer('backup') },
  { id: '6', rule: 'signed out: sign in before the Plus sheet (R-1)', input: input('backup_upload', { signedIn: false }), expected: offer('backup', true) },
  { id: '7', rule: 'contributor in a Free book: quiet, never a Plus sheet (R-2)', input: input('backup_upload', { viewer: { roleInBook: 'contributor' } }), expected: quiet('contributor') },
  { id: '8', rule: 'contributor with own Plus in a Free book is not covered', input: input('theme_extra', { viewer: { roleInBook: 'contributor', own: P } }), expected: quiet('contributor') },
  { id: '9', rule: 'birthday: no offer that day', input: input('backup_upload', { isBirthday: true }), expected: quiet('birthday') },
  { id: '10', rule: 'offline: an offer becomes quiet', input: input('backup_upload', { online: false }), expected: quiet('offline') },

  // theme_extra
  { id: '11', rule: 'Free parent taps an extra theme', input: input('theme_extra'), expected: offer('themes') },
  { id: '12', rule: 'lapsed with an extra theme: not allowed (render the default, keep the choice)', input: input('theme_extra', { viewer: { own: LAPSED } }), expected: offer('themes') },

  // plan state and cache (C-NFR-004)
  { id: '13', rule: 'cache 9 days old, effectiveUntil ahead: fail open for payers', input: input('backup_upload', { viewer: { own: plan({ verifiedAt: NINE_DAYS_AGO }) } }), expected: allow('plus_own') },
  { id: '14', rule: 'cache old, effectiveUntil passed, offline: Free, no offer until online', input: input('backup_upload', { online: false, viewer: { own: plan({ verifiedAt: NINE_DAYS_AGO, effectiveUntil: PAST }) } }), expected: quiet('offline') },
  { id: '15', rule: 'sandbox entitlement, not a tester: Free', input: input('theme_extra', { viewer: { own: plan({ environment: 'sandbox' }) } }), expected: offer('themes') },
  { id: '16', rule: 'sandbox entitlement for a TestFlight tester counts', input: input('theme_extra', { viewer: { own: plan({ environment: 'sandbox', isTester: true }) } }), expected: allow('plus_own') },
  { id: '17', rule: 'Xcode StoreKit test entitlement, not a tester: Free', input: input('backup_upload', { viewer: { own: plan({ environment: 'xcode' }) } }), expected: offer('backup') },
  { id: '18', rule: 'refunded: Free immediately (C-REQ-029)', input: input('theme_extra', { viewer: { own: plan({ state: 'refunded' }) } }), expected: offer('themes') },
  { id: '19', rule: 'revoked (Family Sharing removed): Free', input: input('backup_upload', { viewer: { own: plan({ state: 'revoked' }) } }), expected: offer('backup') },
  { id: '20', rule: 'billing retry outside grace: Free extras', input: input('theme_extra', { viewer: { own: plan({ state: 'billing_retry' }) } }), expected: offer('themes') },
  { id: '21', rule: 'trial counts as Plus', input: input('theme_extra', { viewer: { own: TRIAL } }), expected: allow('plus_own') },
  { id: '22', rule: 'billing grace keeps Plus on (C-REQ-027)', input: input('theme_extra', { viewer: { own: GRACE } }), expected: allow('plus_own') },
  { id: '23', rule: 'lifetime (no end date) counts', input: input('backup_upload', { viewer: { own: plan({ effectiveUntil: null }) } }), expected: allow('plus_own') },
  { id: '24', rule: 'both parents hold Plus: allow, no offer anywhere (R-3)', input: input('backup_upload', { viewer: { own: P }, book: { coveredByOtherParent: true } }), expected: allow('plus_own') },
  { id: '25', rule: 'first-run surface: quiet', input: input('theme_extra', { surface: 'first_run' }), expected: quiet('first_run') },
];

describe('decide(): truth table for backup and themes (TDD 08 2.3)', () => {
  it('covers every gate decide() handles, with unique ids', () => {
    for (const f of GATED_FEATURES.filter((g) => g !== 'keep_letter')) expect(TABLE.some((r) => r.input.feature === f), f).toBe(true);
    expect(new Set(TABLE.map((r) => r.id)).size).toBe(TABLE.length);
  });

  it.each(TABLE.map((r) => [r.id, r.rule, r] as const))('row %s: %s', (_id, _rule, row) => {
    expect(decide(row.input)).toEqual(row.expected);
  });

  it('keep_letter is not decided here: it needs the letter count', () => {
    expect(() => decide({ ...input('backup_upload'), feature: 'keep_letter' })).toThrow();
  });
});

// ── decideKeepLetter (D-082, D-083) ──────────────────────────────────────

const keep = (over: Partial<Parameters<typeof decideKeepLetter>[0]> = {}) => decideKeepLetter({ now: NOW, plan: FREE, lettersKept: 0, ...over });
const free = (lettersLeft: number): KeepLetterDecision => ({ kind: 'allow', via: 'free_letters', lettersLeft });
const needsPlus = (lapsed = false): KeepLetterDecision => ({ kind: 'offer', trigger: 'keep_letter', needsSignIn: false, lapsed });

describe('decideKeepLetter: the first 2 letters are free, then Plus', () => {
  it('table: letters kept 0, 1, 2, 3 on a Free phone', () => {
    expect(keep({ lettersKept: 0 })).toEqual(free(2));
    expect(keep({ lettersKept: 1 })).toEqual(free(1));
    expect(keep({ lettersKept: 2 })).toEqual(needsPlus());
    expect(keep({ lettersKept: 3 })).toEqual(needsPlus());
    expect(keep({ lettersKept: 500 })).toEqual(needsPlus());
  });

  it('the default allowance is 2', () => {
    expect(DEFAULT_FREE_LETTERS).toBe(2);
  });

  it('Plus (active, trial, grace, family shared, tester sandbox) keeps any number', () => {
    for (const p of [P, TRIAL, GRACE, plan({ effectiveUntil: null }), plan({ environment: 'sandbox', isTester: true })]) {
      for (const n of [0, 2, 3, 50]) expect(keep({ plan: p, lettersKept: n })).toEqual({ kind: 'allow', via: 'plus_own' });
    }
  });

  it('every plan state without Plus is the same as Free at the limit; only the wording (lapsed) differs', () => {
    expect(keep({ plan: FREE, lettersKept: 2 })).toEqual(needsPlus(false));
    expect(keep({ plan: LAPSED, lettersKept: 2 })).toEqual(needsPlus(true));
    expect(keep({ plan: plan({ state: 'refunded' }), lettersKept: 2 })).toEqual(needsPlus(true));
    expect(keep({ plan: plan({ state: 'revoked' }), lettersKept: 2 })).toEqual(needsPlus(true));
    expect(keep({ plan: plan({ state: 'billing_retry' }), lettersKept: 2 })).toEqual(needsPlus(false));
    expect(keep({ plan: plan({ environment: 'sandbox' }), lettersKept: 2 }).kind).toBe('offer'); // sandbox, not a tester
    expect(keep({ plan: plan({ effectiveUntil: PAST }), lettersKept: 2 }).kind).toBe('offer'); // period over
  });

  it('a lapsed member under the allowance still keeps letters (never a lock-out)', () => {
    expect(keep({ plan: LAPSED, lettersKept: 1 })).toEqual(free(1));
  });

  it('is never quiet: a gate the person triggered always answers (birthday, offline and first run change copy only)', () => {
    for (const p of [FREE, LAPSED, plan({ state: 'billing_retry' })])
      for (const n of [0, 1, 2, 3, 9]) expect(keep({ plan: p, lettersKept: n }).kind).not.toBe('quiet' as never);
  });

  it('remote allowance may only raise it: 0, 1, 2, 100, 1000, junk', () => {
    expect(keep({ lettersKept: 2, allowance: 0 })).toEqual(needsPlus());
    expect(keep({ lettersKept: 2, allowance: 1 })).toEqual(needsPlus());
    expect(keep({ lettersKept: 1, allowance: 0 })).toEqual(free(1));
    expect(keep({ lettersKept: 2, allowance: 2 })).toEqual(needsPlus());
    expect(keep({ lettersKept: 2, allowance: 5 })).toEqual(free(3));
    expect(keep({ lettersKept: 99, allowance: 100 })).toEqual(free(1));
    expect(keep({ lettersKept: 100, allowance: 1000 })).toEqual(needsPlus()); // capped at 100
    for (const junk of [undefined, null, 'lots', '5', NaN, Infinity, -4, 2.5, {}, []]) {
      expect(keep({ lettersKept: 2, allowance: junk })).toEqual(needsPlus());
      expect(keep({ lettersKept: 1, allowance: junk })).toEqual(free(1));
    }
  });

  it('a junk letter count is treated as 0: the safe side, a gift and never a lock-out', () => {
    for (const n of [NaN, -3, Infinity, undefined as unknown as number]) expect(keep({ lettersKept: n }).kind).toBe('allow');
    expect(keep({ lettersKept: 1.9 })).toEqual(free(1));
  });

  it('freeLettersFrom', () => {
    expect(freeLettersFrom(undefined)).toBe(2);
    expect(freeLettersFrom(0)).toBe(2);
    expect(freeLettersFrom(3)).toBe(3);
    expect(freeLettersFrom(10_000)).toBe(MAX_FREE_LETTERS);
    expect(freeLettersFrom(2.5)).toBe(2);
  });

  it('going from Free to Plus never takes an allow away; more letters kept never turns an offer into an allow', () => {
    for (const n of [0, 1, 2, 3, 10]) {
      if (isAllowed(keep({ lettersKept: n }))) expect(isAllowed(keep({ plan: P, lettersKept: n }))).toBe(true);
      if (!isAllowed(keep({ lettersKept: n }))) expect(isAllowed(keep({ lettersKept: n + 1 }))).toBe(false);
    }
  });
});

describe('free forever (LEGAL-REQ-050)', () => {
  const NEVER_GATED = ['read', 'play_recording', 'export', 'delete', 'restore_backup', 'family_authors', 'invite', 'download_backed_up_audio'] as const;

  it('reading, playing, exporting, deleting, restoring and family authorship are not gated features, at compile time and at run time', () => {
    for (const f of NEVER_GATED) {
      expect(FREE_FOREVER).toContain(f);
      expect((GATED_FEATURES as readonly string[]).includes(f)).toBe(false);
      // Run time: a caller that bypasses the types gets a programmer error, never a gate.
      expect(() => decide({ ...input('backup_upload'), feature: f as unknown as GatedFeature })).toThrow();
    }
    const read: FreeForever = 'read';
    // @ts-expect-error a free-forever feature cannot be passed to decide()
    const bad: DecideInput = { ...input('backup_upload'), feature: read };
    expect(() => decide(bad)).toThrow();
  });

  it('the one deliberate exception is the Keep step: writing is no longer a free-forever feature, keep_letter is the gate', () => {
    expect(FREE_FOREVER as readonly string[]).not.toContain('write');
    expect(GATED_FEATURES).toContain('keep_letter');
    expect(GATED_FEATURES).not.toContain('start_book');
    expect(GATED_FEATURES).not.toContain('read_together');
  });

  it('the Plan state never hides anything: every gate list is only things Plus adds', () => {
    expect([...GATED_FEATURES].sort()).toEqual(['backup_upload', 'keep_letter', 'theme_extra']);
  });
});

describe('decide(): properties over every combination', () => {
  const plans: PlanView[] = [FREE, P, GRACE, TRIAL, LAPSED, plan({ state: 'refunded' }), plan({ environment: 'sandbox' }), plan({ effectiveUntil: PAST })];
  const all: DecideInput[] = [];
  for (const feature of ['backup_upload', 'theme_extra'] as const)
    for (const own of plans)
      for (const roleInBook of ['parent', 'contributor', null] as const)
        for (const covered of [false, true])
          for (const surface of ['first_run', 'normal'] as const)
            for (const isBirthday of [false, true])
              for (const signedIn of [false, true])
                for (const initiatedBy of ['user', 'background'] as const)
                  all.push(input(feature, { viewer: { roleInBook, own }, book: { coveredByOtherParent: covered }, surface, isBirthday, signedIn, initiatedBy }));

  it('never offers on the first-run surface', () => {
    for (const i of all) if (i.surface === 'first_run') expect(decide(i).kind).not.toBe('offer');
  });

  it('never offers Plus to a contributor inside a book (R-2)', () => {
    for (const i of all) if (i.viewer.roleInBook === 'contributor') expect(decide(i).kind).not.toBe('offer');
  });

  it('never offers Plus where it is already on (R-3)', () => {
    for (const i of all) {
      const on = (planActive(i.viewer.own, i.now) && i.viewer.roleInBook === 'parent') || i.book?.coveredByOtherParent;
      if (on) expect(decide(i).kind).toBe('allow');
    }
  });

  it('going from Free to Plus never takes an allow away', () => {
    for (const i of all) {
      if (planActive(i.viewer.own, i.now)) continue;
      const before = decide(i);
      const after = decide({ ...i, viewer: { ...i.viewer, own: P } });
      if (isAllowed(before) && i.viewer.roleInBook === 'parent') expect(isAllowed(after)).toBe(true);
    }
  });

  it('lapsing is the same as never having had Plus', () => {
    for (const i of all) {
      if (i.viewer.own !== LAPSED) continue;
      expect(decide(i)).toEqual(decide({ ...i, viewer: { ...i.viewer, own: FREE } }));
    }
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
});
