/**
 * Membership engine edges (D-082, D-083; TDD 08 section 2): the boundaries
 * plan.test.ts's tables do not pin. Pure functions, no clock, fictional
 * family "Asha" only. Titles carry the requirement they prove.
 */
import { describe, expect, it } from 'vitest';
import {
  decide,
  decideKeepLetter,
  DEFAULT_FREE_LETTERS,
  freeLettersFrom,
  isAllowed,
  isGatedFeature,
  MAX_FREE_LETTERS,
  NO_PLAN,
  planActive,
  type DecideInput,
  type PlanView,
} from '../src';

const NOW = '2026-10-03T12:00:00.000Z';
const NOW_MS = Date.parse(NOW);
const iso = (ms: number) => new Date(ms).toISOString();
const plan = (over: Partial<PlanView> = {}): PlanView => ({
  state: 'active', effectiveUntil: '2026-11-03T12:00:00.000Z', verifiedAt: NOW, environment: 'production', isTester: false, ...over,
});
const OFF_STATES: PlanView['state'][] = ['none', 'billing_retry', 'expired', 'refunded', 'revoked'];
const ON_STATES: PlanView['state'][] = ['trial', 'active', 'grace'];

const keep = (over: Partial<Parameters<typeof decideKeepLetter>[0]> = {}) => decideKeepLetter({ now: NOW, plan: NO_PLAN, lettersKept: 0, ...over });

type Over = Omit<Partial<DecideInput>, 'viewer'> & { viewer?: Partial<DecideInput['viewer']> };

function input(over: Over = {}): DecideInput {
  const base: DecideInput = {
    now: NOW, feature: 'backup_upload', surface: 'normal', isBirthday: false, signedIn: true, online: true,
    viewer: { roleInBook: 'parent', own: NO_PLAN }, book: { coveredByOtherParent: false }, initiatedBy: 'user',
  };
  return { ...base, ...over, viewer: { ...base.viewer, ...(over.viewer ?? {}) } } as DecideInput;
}

describe('planActive: the instant Plus ends', () => {
  it('[C-NFR-004] the end instant is exclusive to the millisecond', () => {
    expect(planActive(plan({ effectiveUntil: iso(NOW_MS + 1) }), NOW)).toBe(true);
    expect(planActive(plan({ effectiveUntil: NOW }), NOW)).toBe(false);
    expect(planActive(plan({ effectiveUntil: iso(NOW_MS - 1) }), NOW)).toBe(false);
  });

  it('an unreadable clock or end time never turns a dated Plus on; only a lifetime (null end) stays on', () => {
    expect(planActive(plan({ effectiveUntil: 'soon' }), NOW)).toBe(false);
    expect(planActive(plan(), 'later')).toBe(false);
    expect(planActive(plan(), '')).toBe(false);
    expect(planActive(plan({ effectiveUntil: null }), 'later')).toBe(true);
  });

  it('every state outside trial, active and grace is off, whatever the end date says', () => {
    for (const state of OFF_STATES) {
      for (const effectiveUntil of [null, '2099-01-01T00:00:00.000Z']) {
        expect(planActive(plan({ state, effectiveUntil }), NOW), `${state} until ${effectiveUntil}`).toBe(false);
      }
    }
  });

  it('[TDD-08 2.4] sandbox and Xcode entitlements count for testers only, in every on state', () => {
    for (const state of ON_STATES) {
      for (const environment of ['sandbox', 'xcode'] as const) {
        expect(planActive(plan({ state, environment, isTester: false }), NOW), `${state} ${environment} not tester`).toBe(false);
        expect(planActive(plan({ state, environment, isTester: true }), NOW), `${state} ${environment} tester`).toBe(true);
      }
      expect(planActive(plan({ state, environment: 'production', isTester: true }), NOW)).toBe(true);
    }
  });
});

describe('decideKeepLetter: the boundary of the free allowance', () => {
  it('[D-082] one letter under the allowance is the last free one; at the allowance it is an offer', () => {
    for (const allowance of [2, 3, 10, MAX_FREE_LETTERS]) {
      expect(keep({ lettersKept: allowance - 1, allowance })).toEqual({ kind: 'allow', via: 'free_letters', lettersLeft: 1 });
      expect(keep({ lettersKept: allowance, allowance }).kind).toBe('offer');
    }
  });

  it('[D-082] lettersLeft counts down one per letter and is never zero on an allow', () => {
    const allowance = 7;
    for (let kept = 0; kept < allowance; kept++) {
      const d = keep({ lettersKept: kept, allowance });
      expect(d).toEqual({ kind: 'allow', via: 'free_letters', lettersLeft: allowance - kept });
    }
  });

  it('[D-082] the remote allowance stops at MAX_FREE_LETTERS, whatever the config says', () => {
    expect(keep({ lettersKept: MAX_FREE_LETTERS - 1, allowance: 1_000_000 })).toEqual({ kind: 'allow', via: 'free_letters', lettersLeft: 1 });
    expect(keep({ lettersKept: MAX_FREE_LETTERS, allowance: 1_000_000 }).kind).toBe('offer');
    expect(keep({ lettersKept: MAX_FREE_LETTERS, allowance: Number.MAX_SAFE_INTEGER }).kind).toBe('offer');
  });

  it('[D-083] the lapsed wording follows the plan state only, never the count or the allowance', () => {
    for (const state of ['expired', 'refunded', 'revoked'] as const) {
      for (const lettersKept of [2, 3, 50]) {
        expect(keep({ plan: plan({ state, effectiveUntil: '2026-09-01T00:00:00.000Z' }), lettersKept, allowance: 2 })).toMatchObject({ kind: 'offer', lapsed: true });
      }
    }
    for (const state of ['none', 'billing_retry'] as const) {
      expect(keep({ plan: plan({ state }), lettersKept: 9 })).toMatchObject({ kind: 'offer', lapsed: false });
    }
    // An "active" row whose period has ended is off, and the sheet sells rather than says "ended": the
    // device reports expiry as `expired`, so this shape never leaves StoreKit; pinned so a change is noticed.
    expect(keep({ plan: plan({ state: 'active', effectiveUntil: '2026-09-01T00:00:00.000Z' }), lettersKept: 2 })).toMatchObject({ kind: 'offer', lapsed: false });
  });

  it('is a pure function of Plus-on, letters kept and the allowance: verifiedAt and the environment of a production row change nothing', () => {
    const a = keep({ plan: plan({ verifiedAt: null }), lettersKept: 2 });
    const b = keep({ plan: plan({ verifiedAt: '2020-01-01T00:00:00.000Z', isTester: true }), lettersKept: 2 });
    expect(a).toEqual(b);
    expect(keep({ lettersKept: 1 })).toEqual(keep({ lettersKept: 1 }));
  });

  it('isAllowed answers both decision shapes', () => {
    expect(isAllowed(keep({ lettersKept: 0 }))).toBe(true);
    expect(isAllowed(keep({ lettersKept: DEFAULT_FREE_LETTERS }))).toBe(false);
    expect(isAllowed(decide(input({ viewer: { own: plan() } })))).toBe(true);
    expect(isAllowed(decide(input()))).toBe(false);
  });
});

describe('freeLettersFrom: whole numbers between the default and the cap', () => {
  it.each([
    [1, DEFAULT_FREE_LETTERS],
    [2, 2],
    [3, 3],
    [MAX_FREE_LETTERS, MAX_FREE_LETTERS],
    [MAX_FREE_LETTERS + 1, MAX_FREE_LETTERS],
    [Number.MAX_SAFE_INTEGER, MAX_FREE_LETTERS],
    ['3', DEFAULT_FREE_LETTERS],
    [true, DEFAULT_FREE_LETTERS],
    [-0, DEFAULT_FREE_LETTERS],
    [NaN, DEFAULT_FREE_LETTERS],
    [Infinity, DEFAULT_FREE_LETTERS],
    [2.999, DEFAULT_FREE_LETTERS],
    [null, DEFAULT_FREE_LETTERS],
    [[5], DEFAULT_FREE_LETTERS],
  ])('freeLettersFrom(%j) is %i', (value, expected) => {
    expect(freeLettersFrom(value)).toBe(expected);
  });

  it('isGatedFeature names exactly the three gates, case-sensitively', () => {
    expect(['keep_letter', 'backup_upload', 'theme_extra'].every(isGatedFeature)).toBe(true);
    for (const f of ['Keep_Letter', 'KEEP_LETTER', 'read', 'write', 'export', '', ' keep_letter']) expect(isGatedFeature(f), f).toBe(false);
  });
});

describe('decide: rule order when several rules apply (TDD 08 2.2)', () => {
  it('first run beats a birthday, a birthday beats the contributor rule, the contributor rule beats offline', () => {
    const everything = { surface: 'first_run' as const, isBirthday: true, online: false, viewer: { roleInBook: 'contributor' as const } };
    expect(decide(input(everything))).toEqual({ kind: 'quiet', reason: 'first_run' });
    expect(decide(input({ ...everything, surface: 'normal' }))).toEqual({ kind: 'quiet', reason: 'birthday' });
    expect(decide(input({ ...everything, surface: 'normal', isBirthday: false }))).toEqual({ kind: 'quiet', reason: 'contributor' });
    expect(decide(input({ surface: 'normal', online: false }))).toEqual({ kind: 'quiet', reason: 'offline' });
  });

  it('[C-REQ-023] the background uploader in a Free book is quiet before every suppression, and allowed once the book has Plus', () => {
    expect(decide(input({ initiatedBy: 'background', surface: 'first_run', isBirthday: true }))).toEqual({ kind: 'quiet', reason: 'free_background' });
    expect(decide(input({ initiatedBy: 'background', viewer: { own: plan() } }))).toEqual({ kind: 'allow', via: 'plus_own' });
    expect(decide(input({ initiatedBy: 'background', book: { coveredByOtherParent: true } }))).toEqual({ kind: 'allow', via: 'plus_book' });
  });

  it('only backups have a background path: a theme asked for "in the background" is an ordinary offer', () => {
    expect(decide(input({ feature: 'theme_extra', initiatedBy: 'background' }))).toEqual({ kind: 'offer', trigger: 'themes', needsSignIn: false });
  });

  it('online defaults to true and initiatedBy to user when they are left out', () => {
    const i = input();
    delete (i as Partial<DecideInput>).online;
    delete (i as Partial<DecideInput>).initiatedBy;
    expect(decide(i)).toEqual({ kind: 'offer', trigger: 'backup', needsSignIn: false });
  });

  it('a contributor is never offered Plus, even signed out and online, in a book nobody covers', () => {
    expect(decide(input({ signedIn: false, viewer: { roleInBook: 'contributor' } }))).toEqual({ kind: 'quiet', reason: 'contributor' });
  });

  it('with no book and no role (an account-level surface) a Free account is offered Plus and asked to sign in first when signed out', () => {
    expect(decide(input({ viewer: { roleInBook: null }, book: null }))).toEqual({ kind: 'offer', trigger: 'backup', needsSignIn: false });
    expect(decide(input({ viewer: { roleInBook: null }, book: null, signedIn: false }))).toEqual({ kind: 'offer', trigger: 'backup', needsSignIn: true });
  });

  /**
   * packages/core/src/plan.ts:203 allows own Plus only while `roleInBook === 'parent'`, so an
   * account-level surface (`roleInBook: null`, `book: null`, which the DecideInput comments name
   * for exactly this case) offers Plus to a person whose Plus is on, against rule R-3 ("never
   * offers Plus where it is already on") and the file's own "Plus is held per account". No app
   * screen calls decide() with a null role yet (v1.0 has no themes or backup), so nothing shipped
   * shows the sheet; the test stays `fails` until plan.ts decides the account-level case.
   */
  it.fails('[R-3] own Plus on an account-level surface (no book, no role) is allowed, not offered', () => {
    expect(decide(input({ feature: 'theme_extra', viewer: { roleInBook: null, own: plan() }, book: null }))).toEqual({ kind: 'allow', via: 'plus_own' });
  });
});
