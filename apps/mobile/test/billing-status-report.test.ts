/// <reference types="node" />
/**
 * The D-080 status report on the phone (WP-F14-15a; F14 6.6; F14-REQ-006, -011, -014,
 * -032, -043, -044; contract packages/api/src/server/subscription-status.ts). Pure planner
 * and the sender with fakes for StoreKit, the server and device settings. Fictional Asha
 * family only; transaction ids here are made-up numbers and never reach JavaScript in the app.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { billingCopy } from '@scribe/content';
import { subRefReference, TERMS_VERSION_RE, type StatusReport } from '@scribe/api/server';
import type { NativeStatusRef } from '../modules/scribe-store/types';
import type { AuthState } from '../src/lib/auth/machine.logic';
import { SUBSCRIPTION_TERMS_DOC_VERSION } from '../src/lib/billing/config';
import { createStatusReporter, RETRY_AFTER_MS, type ReporterDeps, type StoreAnswer } from '../src/lib/billing/status-report';
import {
  addPendingConsent,
  afterStored,
  EMPTY_REPORT_STATE,
  errorCodeFromAnswer,
  offerTypeOf,
  parseReportState,
  planReports,
  purchaseKey,
  REPORT_FUNCTION,
  reportingUserOf,
  SALT_FUNCTION,
  saltFromAnswer,
  sanitizeRefs,
  serializeReportState,
  statusFieldsOf,
  storedFromAnswer,
  termsVersionOf,
} from '../src/lib/billing/status-report.logic';

const ASHA_MAMA = '11111111-1111-1111-1111-111111111111';
const ASHA_PAPA = '22222222-2222-2222-2222-222222222222';
const NOW = '2026-10-29T18:00:00.000Z';
const REF = 'a'.repeat(64);
const REF2 = 'b'.repeat(64);
const SALT = 'A'.repeat(43);

/** An annual free trial bought on 29 Oct 2026 (2 months), as the native module describes it. */
function annualTrial(over: Partial<NativeStatusRef> = {}): NativeStatusRef {
  return {
    subRef: REF, productId: 'plus.annual', ownership: 'purchased', environment: 'sandbox', isTrial: true, isUpgraded: false,
    offerType: 'introductory', freePeriod: true, state: 'subscribed', willAutoRenew: true,
    purchasedAt: '2026-10-29T17:59:00.000Z', originalPurchasedAt: '2026-10-29T17:59:00.000Z', expiresAt: '2026-12-29T17:59:00.000Z',
    ...over,
  };
}
const monthlyPaid = (over: Partial<NativeStatusRef> = {}): NativeStatusRef => annualTrial({
  subRef: REF2, productId: 'plus.monthly', isTrial: false, offerType: 'none', freePeriod: false,
  purchasedAt: '2026-10-20T10:00:00.000Z', originalPurchasedAt: '2026-09-20T10:00:00.000Z', expiresAt: '2026-11-20T10:00:00.000Z', ...over,
});

const CONTRACT_KEYS = ['schema_version', 'sub_ref', 'environment', 'plan', 'trial_end', 'renewal_date', 'cancelled', 'free_period_days', 'reported_at', 'consent'];
const PURCHASE_DATA = /transaction|receipt|jws|signed|price|amount|card|payment|appAccountToken|account_token|originalID/i;

describe('status-report.logic: what a report carries', () => {
  it('[F14-REQ-006] keeps only the person\'s own Plus purchases with a well-formed sub_ref', () => {
    const raw = [
      annualTrial(),
      annualTrial({ ownership: 'familyShared' }),
      annualTrial({ productId: 'other.app' }),
      annualTrial({ subRef: 'A'.repeat(64) }),
      annualTrial({ environment: 'staging' as never }),
      'junk', null,
    ];
    expect(sanitizeRefs(raw).map((r) => r.ownership)).toEqual(['purchased']);
    expect(sanitizeRefs('not a list')).toEqual([]);
  });

  it('[F14-REQ-032] an annual free trial: trial end and renewal date at the end of the free period, not cancelled', () => {
    expect(statusFieldsOf(annualTrial())).toEqual({
      environment: 'sandbox', plan: 'annual', trial_end: '2026-12-29T17:59:00.000Z', renewal_date: '2026-12-29T17:59:00.000Z', cancelled: false,
    });
  });

  it('[F14-REQ-033] renewal turned off is cancelled; an ended or refunded plan has no dates and is cancelled', () => {
    expect(statusFieldsOf(annualTrial({ willAutoRenew: false }))?.cancelled).toBe(true);
    expect(statusFieldsOf(annualTrial({ state: 'expired' }))).toMatchObject({ trial_end: null, renewal_date: null, cancelled: true });
    expect(statusFieldsOf(annualTrial({ revokedAt: '2026-11-01T00:00:00.000Z' }))).toMatchObject({ renewal_date: null, cancelled: true });
  });

  it('a paid monthly plan has no trial end; billing retry keeps the period end it is retrying', () => {
    expect(statusFieldsOf(monthlyPaid())).toMatchObject({ plan: 'monthly', trial_end: null, renewal_date: '2026-11-20T10:00:00.000Z' });
    expect(statusFieldsOf(monthlyPaid({ state: 'inBillingRetryPeriod' }))?.renewal_date).toBe('2026-11-20T10:00:00.000Z');
  });

  it('[F14-REQ-044] a win-back offer is reported as win_back, not promotional (S07 #138 OFFER_TYPES); only an unknown kind falls back', () => {
    expect(offerTypeOf('win_back')).toBe('win_back');
    expect(offerTypeOf('other')).toBe('promotional');
    expect(offerTypeOf(undefined)).toBe('none');
    const winBack = sanitizeRefs([annualTrial({ isTrial: false, offerType: 'win_back', freePeriod: true })]);
    expect(winBack[0].offerType).toBe('win_back');
    let state = addPendingConsent(EMPTY_REPORT_STATE, {
      productId: 'plus.annual', originalPurchasedAt: '2026-10-29T17:59:00.000Z', termsVersion: '1.4.0+0a1b2c3d',
      shownAt: '2026-10-29T17:59:30.000Z', queuedAt: '2026-10-29T17:59:30.000Z', owner: null,
    });
    const [p] = planReports(winBack, state, { owner: ASHA_MAMA, now: NOW });
    expect(p.report.consent?.offer_type).toBe('win_back');
    state = afterStored(state, ASHA_MAMA, p, 'recorded');
    expect(state.pending).toEqual([]);
  });

  it('[F14-REQ-044] a free period from an offer code is a trial end too (notices key on the free period, not the product)', () => {
    const code = monthlyPaid({ offerType: 'offer_code', freePeriod: true });
    expect(statusFieldsOf(code)?.trial_end).toBe('2026-11-20T10:00:00.000Z');
  });

  it('[F14-REQ-014] a report has only contract keys, never free_period_days, and nothing that looks like purchase data', () => {
    const noisy = { ...annualTrial(), originalTransactionId: '2000000101', price: '49.99', jwsRepresentation: 'eyJ', appAccountToken: 'x' };
    const [p] = planReports(sanitizeRefs([noisy]), EMPTY_REPORT_STATE, { owner: ASHA_MAMA, now: NOW });
    expect(p).toBeDefined();
    const json = JSON.stringify(p.report);
    for (const k of Object.keys(p.report)) expect(CONTRACT_KEYS).toContain(k);
    expect('free_period_days' in p.report).toBe(false);
    expect(json).not.toMatch(PURCHASE_DATA);
    expect(json).not.toContain('2000000101');
    expect(json).not.toContain('49.99');
  });
});

describe('status-report.logic: when to report', () => {
  it('[F14-REQ-032] reports once per change: first time, not again for the same status, again after a cancel', () => {
    let state = EMPTY_REPORT_STATE;
    let planned = planReports([annualTrial()], state, { owner: ASHA_MAMA, now: NOW });
    expect(planned).toHaveLength(1);
    state = afterStored(state, ASHA_MAMA, planned[0], 'none');
    expect(planReports([annualTrial()], state, { owner: ASHA_MAMA, now: NOW })).toEqual([]);
    planned = planReports([annualTrial({ willAutoRenew: false })], state, { owner: ASHA_MAMA, now: NOW });
    expect(planned).toHaveLength(1);
    expect(planned[0].report.cancelled).toBe(true);
  });

  it('another account signed in on this phone gets its own first report', () => {
    const [p] = planReports([annualTrial()], EMPTY_REPORT_STATE, { owner: ASHA_MAMA, now: NOW });
    const state = afterStored(EMPTY_REPORT_STATE, ASHA_MAMA, p, 'none');
    expect(planReports([annualTrial()], state, { owner: ASHA_PAPA, now: NOW })).toHaveLength(1);
  });

  it('[LEGAL-REQ-049] consent facts from a purchase in the app ride on the first report, then never again', () => {
    let state = addPendingConsent(EMPTY_REPORT_STATE, {
      productId: 'plus.annual', originalPurchasedAt: '2026-10-29T17:59:00.000Z', termsVersion: '1.4.0+0a1b2c3d',
      shownAt: '2026-10-29T17:59:30.000Z', queuedAt: '2026-10-29T17:59:30.000Z', owner: null,
    });
    const [p] = planReports([annualTrial()], state, { owner: ASHA_MAMA, now: NOW });
    expect(p.report.consent).toEqual({ product_id: 'plus.annual', offer_type: 'introductory', terms_shown: '1.4.0+0a1b2c3d', shown_at: '2026-10-29T17:59:30.000Z' });
    state = afterStored(state, ASHA_MAMA, p, 'recorded');
    expect(state.pending).toEqual([]);
    expect(state.consented).toEqual([purchaseKey('plus.annual', '2026-10-29T17:59:00.000Z')]);
    const later = planReports([annualTrial({ willAutoRenew: false })], state, { owner: ASHA_MAMA, now: NOW });
    expect(later[0].report.consent).toBeUndefined();
  });

  it('[F14-REQ-044] an offer code with no terms shown by us records none_outside_app, once', () => {
    const code = monthlyPaid({ offerType: 'offer_code', freePeriod: true });
    const [p] = planReports([code], EMPTY_REPORT_STATE, { owner: ASHA_MAMA, now: NOW });
    expect(p.report.consent).toMatchObject({ offer_type: 'offer_code', terms_shown: 'none_outside_app' });
    const state = afterStored(EMPTY_REPORT_STATE, ASHA_MAMA, p, 'recorded');
    expect(planReports([code], state, { owner: ASHA_MAMA, now: NOW })).toEqual([]);
  });

  it('never sends a report the contract would refuse, and needs the first-purchase date to key it', () => {
    expect(planReports([annualTrial({ subRef: 'XYZ' })], EMPTY_REPORT_STATE, { owner: ASHA_MAMA, now: NOW })).toEqual([]);
    expect(planReports([annualTrial({ originalPurchasedAt: undefined })], EMPTY_REPORT_STATE, { owner: ASHA_MAMA, now: NOW })).toEqual([]);
    // A date StoreKit did not give is dropped by the sanitizer, so the report carries no date rather than a bad one.
    const [p] = planReports(sanitizeRefs([annualTrial({ expiresAt: 'not a date' })]), EMPTY_REPORT_STATE, { owner: ASHA_MAMA, now: NOW });
    expect(p.report).toMatchObject({ trial_end: null, renewal_date: null });
  });

  it('the device record round-trips and holds no salt, sub_ref or id', () => {
    const [p] = planReports([annualTrial()], EMPTY_REPORT_STATE, { owner: ASHA_MAMA, now: NOW });
    const raw = serializeReportState(afterStored(EMPTY_REPORT_STATE, ASHA_MAMA, p, 'none'));
    expect(raw).not.toContain(REF);
    expect(raw).not.toContain(SALT);
    expect(parseReportState(raw).owner).toBe(ASHA_MAMA);
    for (const junk of [null, '', '{', '[]', JSON.stringify({ v: 9 })]) expect(parseReportState(junk)).toEqual(EMPTY_REPORT_STATE);
  });

  it('reads the server envelopes and nothing else', () => {
    expect(saltFromAnswer({ ok: true, data: { salt: SALT }, requestId: 'abc' })).toBe(SALT);
    expect(saltFromAnswer({ ok: true, data: { salt: 'short' } })).toBeNull();
    expect(storedFromAnswer({ ok: true, data: { stored: 'created', consent: 'none' } })).toEqual({ stored: 'created', consent: 'none' });
    expect(storedFromAnswer({ ok: true, data: { stored: 'member', consent: 'none' } })).toBeNull();
    expect(errorCodeFromAnswer({ ok: false, error: { code: 'rate_limited', retryable: true } })).toBe('rate_limited');
    expect(errorCodeFromAnswer('junk')).toBe('unavailable');
    expect([REPORT_FUNCTION, SALT_FUNCTION]).toEqual(['subscription-status/v1/report', 'subscription-status/v1/salt']);
  });
});

describe('[BL-347] who a report goes to (the claim screen from #139)', () => {
  const never = () => false;
  const noOwner = () => null;
  it('a ready session with no claim waiting reports, whether or not letters sync', () => {
    expect(reportingUserOf({ status: 'ready', userId: ASHA_MAMA, sync: 'on' }, never, noOwner)).toBe(ASHA_MAMA);
    expect(reportingUserOf({ status: 'ready', userId: ASHA_MAMA, sync: 'off' }, never, () => ASHA_MAMA)).toBe(ASHA_MAMA);
  });

  it('a session waiting for "Keep in this account" gets no report, so a purchase on this phone never goes to an account the person has not confirmed', () => {
    expect(reportingUserOf({ status: 'ready', userId: ASHA_PAPA, sync: 'on' }, () => true, noOwner)).toBeNull();
  });

  it('a second account on a phone another account owns gets no report: no claim screen appears there, and sync refuses it too (review B1)', () => {
    // Mama owns this phone's letters; she signs out and Papa signs in. The claim rule says nothing is pending.
    expect(reportingUserOf({ status: 'ready', userId: ASHA_PAPA, sync: 'on' }, never, () => ASHA_MAMA)).toBeNull();
    expect(reportingUserOf({ status: 'ready', userId: ASHA_MAMA, sync: 'on' }, never, () => ASHA_MAMA)).toBe(ASHA_MAMA);
    expect(reportingUserOf({ status: 'ready', userId: ASHA_PAPA, sync: 'on' }, never, () => { throw new Error('store closed'); })).toBeNull();
  });

  it('no report before consent, while signing in or out, or signed out; the claim is not read then', () => {
    const claim = vi.fn(() => false);
    const states: AuthState[] = [
      { status: 'restoring' }, { status: 'signedOut' }, { status: 'checkingConsent', userId: ASHA_MAMA, method: null },
      { status: 'needsConsent', userId: ASHA_MAMA, method: null, steps: ['terms'] },
      { status: 'signingOut', userId: ASHA_MAMA, reason: 'user', waitingForUploads: true, sync: 'on' },
    ];
    const owner = vi.fn(() => null);
    for (const s of states) expect(reportingUserOf(s, claim, owner)).toBeNull();
    expect(claim).not.toHaveBeenCalled();
    expect(owner).not.toHaveBeenCalled();
  });
});

describe('[F14-REQ-011] the Subscription Terms version in the consent record', () => {
  it('names the document version and changes when any store sheet text changes', () => {
    const v = termsVersionOf(SUBSCRIPTION_TERMS_DOC_VERSION, billingCopy.store);
    expect(v).toMatch(TERMS_VERSION_RE);
    expect(v.startsWith(`${SUBSCRIPTION_TERMS_DOC_VERSION}+`)).toBe(true);
    const changed = termsVersionOf(SUBSCRIPTION_TERMS_DOC_VERSION, { ...billingCopy.store, renewal: `${billingCopy.store.renewal} ` });
    expect(changed).not.toBe(v);
    expect(termsVersionOf('1.5.0', billingCopy.store)).not.toBe(v);
  });

  it('the document version in code matches docs/legal/subscription-terms.md', () => {
    const doc = readFileSync(new URL('../../../docs/legal/subscription-terms.md', import.meta.url), 'utf8');
    expect(doc.match(/^version:\s*(\S+)/m)?.[1]).toBe(SUBSCRIPTION_TERMS_DOC_VERSION);
  });
});

describe('[R2 AR-13] sub_ref is the salted hash the native module makes', () => {
  it('SHA-256 over the 32 salt bytes then the decimal original transaction id, as Swift StatusRef does', async () => {
    const salt = Buffer.alloc(32, 7).toString('base64url');
    const id = '2000000101';
    const swiftLayout = createHash('sha256').update(Buffer.concat([Buffer.alloc(32, 7), Buffer.from(id, 'utf8')])).digest('hex');
    expect(await subRefReference(salt, id)).toBe(swiftLayout);
    const swift = readFileSync(new URL('../modules/scribe-store/ios/ScribeStoreModule.swift', import.meta.url), 'utf8');
    expect(swift).toMatch(/input\.append\(contentsOf: Array\(String\(originalID\)\.utf8\)\)/);
    expect(swift).toMatch(/SHA256\.hash\(data: input\)/);
  });
});

// ── The sender, with fakes ──────────────────────────────────────────────

function harness(over: Partial<ReporterDeps> & { items?: unknown[]; answers?: StoreAnswer[] } = {}) {
  let stored: string | null = null;
  let clock = Date.parse(NOW);
  let keyN = 0;
  const sent: Array<{ report: StatusReport; key: string }> = [];
  const answers = [...(over.answers ?? [])];
  let user: string | null = ASHA_MAMA;
  let phoneOwner: string | null = null;
  let on = true;
  const deps: ReporterDeps = {
    mayRun: () => on,
    userId: () => user,
    phoneOwner: () => phoneOwner,
    readState: () => stored,
    writeState: (v) => {
      stored = v;
    },
    fetchSalt: vi.fn(async () => ({ ok: true as const, salt: SALT })),
    nativeRefs: vi.fn(async () => over.items ?? [annualTrial()]),
    sendReport: vi.fn(async (report: StatusReport, key: string) => {
      sent.push({ report, key });
      return answers.shift() ?? { ok: true as const, stored: 'created' as const, consent: report.consent ? ('recorded' as const) : ('none' as const) };
    }),
    newKey: () => `0199a5b0-0000-7000-8000-${String(++keyN).padStart(12, '0')}`,
    now: () => new Date(clock).toISOString(),
    termsVersion: () => termsVersionOf(SUBSCRIPTION_TERMS_DOC_VERSION, billingCopy.store),
    ...over,
  };
  return {
    deps, sent, reporter: createStatusReporter(deps),
    signOut: () => (user = null), signIn: (u = ASHA_MAMA) => (user = u), off: () => (on = false), on: () => (on = true),
    ownPhone: (u: string | null) => (phoneOwner = u), tick: (ms: number) => (clock += ms),
    state: () => parseReportState(stored),
  };
}

describe('the sender', () => {
  afterEach(() => vi.restoreAllMocks());

  it('[F14-REQ-032] off (kill switch): no salt, no StoreKit call, no request; a purchase meanwhile keeps its consent facts and sends them once it clears (review B2)', async () => {
    const h = harness();
    h.off();
    expect(await h.reporter.flush()).toBe('off');
    h.reporter.recordPurchase({ productId: 'plus.annual', originalPurchasedAt: '2026-10-29T17:59:00.000Z' });
    expect(await h.reporter.flush()).toBe('off');
    expect(h.deps.fetchSalt).not.toHaveBeenCalled();
    expect(h.deps.nativeRefs).not.toHaveBeenCalled();
    expect(h.sent).toEqual([]);
    expect(h.state().pending).toHaveLength(1);
    h.on();
    expect(await h.reporter.flush()).toBe('sent');
    expect(await h.reporter.flush()).toBe('nothing');
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].report.consent).toMatchObject({ product_id: 'plus.annual', offer_type: 'introductory' });
    expect(h.sent[0].report.consent?.terms_shown).toMatch(/^4\.0\.0\+[0-9a-f]{8}$/);
    expect(h.state().pending).toEqual([]);
  });

  it('[BL-347] consent facts recorded while one account owned the phone never ride on another account\'s report (review B1)', async () => {
    const h = harness();
    h.ownPhone(ASHA_MAMA);
    h.signOut();
    h.reporter.recordPurchase({ productId: 'plus.annual', originalPurchasedAt: '2026-10-29T17:59:00.000Z' });
    expect(h.state().pending[0]?.owner).toBe(ASHA_MAMA);
    h.signIn(ASHA_PAPA);
    await h.reporter.flush();
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].report.consent).toBeUndefined();
    expect(h.state().pending).toHaveLength(1);
    h.signIn(ASHA_MAMA);
    await h.reporter.flush();
    expect(h.sent.at(-1)?.report.consent).toBeDefined();
    expect(h.state().pending).toEqual([]);
  });

  it('[F14-REQ-043] a purchase while signed out: 0 requests until sign-in, exactly 1 after, carrying the consent facts', async () => {
    const h = harness();
    h.signOut();
    h.reporter.recordPurchase({ productId: 'plus.annual', originalPurchasedAt: '2026-10-29T17:59:00.000Z' });
    expect(await h.reporter.flush()).toBe('signed_out');
    expect(await h.reporter.flush()).toBe('signed_out');
    expect(h.deps.fetchSalt).not.toHaveBeenCalled();
    expect(h.sent).toHaveLength(0);
    h.signIn();
    expect(await h.reporter.flush()).toBe('sent');
    expect(await h.reporter.flush()).toBe('nothing');
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0].report.consent?.terms_shown).toMatch(/^4\.0\.0\+[0-9a-f]{8}$/);
    expect(h.state().pending).toEqual([]);
  });

  it('[F14-REQ-006] a phone with Plus through Family Sharing sends 0 reports', async () => {
    const h = harness({ items: [annualTrial({ ownership: 'familyShared' })] });
    expect(await h.reporter.flush()).toBe('nothing');
    expect(h.sent).toHaveLength(0);
  });

  it('[F14-REQ-032] every request has its own idempotency key; the salt is fetched once per account', async () => {
    const h = harness({ items: [annualTrial(), monthlyPaid()] });
    await h.reporter.flush();
    expect(h.sent.map((s) => s.key)).toEqual(['0199a5b0-0000-7000-8000-000000000001', '0199a5b0-0000-7000-8000-000000000002']);
    await h.reporter.flush();
    expect(h.deps.fetchSalt).toHaveBeenCalledTimes(1);
    h.signIn(ASHA_PAPA);
    await h.reporter.flush();
    expect(h.deps.fetchSalt).toHaveBeenCalledTimes(2);
  });

  it('a retryable failure keeps the report for later, at most one try a minute', async () => {
    const h = harness({ answers: [{ ok: false, code: 'unavailable' }] });
    expect(await h.reporter.flush()).toBe('retry_later');
    expect(await h.reporter.flush()).toBe('retry_later');
    expect(h.sent).toHaveLength(1);
    h.tick(RETRY_AFTER_MS + 1);
    expect(await h.reporter.flush()).toBe('sent');
    expect(h.sent).toHaveLength(2);
  });

  it('a retry of the same report sends the same body under the same idempotency key, so the server can answer a duplicate (review N2)', async () => {
    const h = harness({ answers: [{ ok: false, code: 'network' }] });
    h.reporter.recordPurchase({ productId: 'plus.annual', originalPurchasedAt: '2026-10-29T17:59:00.000Z' });
    expect(await h.reporter.flush()).toBe('retry_later');
    h.tick(RETRY_AFTER_MS + 1);
    expect(await h.reporter.flush()).toBe('sent');
    expect(h.sent).toHaveLength(2);
    expect(h.sent[1].key).toBe(h.sent[0].key);
    expect(h.sent[1].report).toEqual(h.sent[0].report);
    // A later, different report gets its own key.
    h.tick(RETRY_AFTER_MS + 1);
    (h.deps.nativeRefs as ReturnType<typeof vi.fn>).mockResolvedValue([annualTrial({ willAutoRenew: false })]);
    expect(await h.reporter.flush()).toBe('sent');
    expect(h.sent[2].key).not.toBe(h.sent[0].key);
  });

  it('a refused report (bad_request) is never resent for the same status, and consent facts keep waiting', async () => {
    const h = harness({ answers: [{ ok: false, code: 'bad_request' }] });
    h.reporter.recordPurchase({ productId: 'plus.annual', originalPurchasedAt: '2026-10-29T17:59:00.000Z' });
    expect(await h.reporter.flush()).toBe('sent');
    expect(h.state().pending).toHaveLength(1);
    const n = h.sent.length;
    await h.reporter.flush();
    expect(h.sent.length).toBe(n + 1); // only the waiting consent facts are retried
    expect(h.sent.at(-1)?.report.consent).toBeDefined();
  });

  it('two flushes at once make one round of requests', async () => {
    const h = harness();
    const [a, b] = await Promise.all([h.reporter.flush(), h.reporter.flush()]);
    expect([a, b]).toEqual(['sent', 'sent']);
    expect(h.sent).toHaveLength(1);
  });

  it('a salt that cannot be fetched sends nothing and waits', async () => {
    const h = harness({ fetchSalt: vi.fn(async () => ({ ok: false as const })) });
    expect(await h.reporter.flush()).toBe('retry_later');
    expect(h.deps.nativeRefs).not.toHaveBeenCalled();
  });

  it('[CLAUDE.md privacy] logs nothing at all', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    const h = harness({ answers: [{ ok: false, code: 'unavailable' }] });
    await h.reporter.flush();
    h.tick(RETRY_AFTER_MS + 1);
    await h.reporter.flush();
    for (const s of spies) expect(s).not.toHaveBeenCalled();
  });
});

describe('[M14] the report is loaded only behind capabilities.statusReport', () => {
  const SRC = new URL('../src/', import.meta.url);
  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? files(join(dir, d.name)) : /\.(ts|tsx)$/.test(d.name) ? [join(dir, d.name)] : []));

  it('no static import of the report modules outside lib/billing/status-report*', () => {
    const offenders = files(SRC.pathname)
      .filter((f) => !/lib\/billing\/status-report/.test(f))
      .filter((f) => /from\s+['"][^'"]*status-report(\.app|\.logic)?['"]/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('plan-store and actions import it dynamically inside a capabilities.statusReport check', () => {
    for (const f of ['lib/billing/plan-store.ts', 'lib/billing/actions.ts']) {
      const text = readFileSync(new URL(f, SRC), 'utf8');
      const at = text.indexOf("import('./status-report.app')");
      expect(at, f).toBeGreaterThan(0);
      const before = text.slice(Math.max(0, at - 300), at);
      expect(before, f).toMatch(/if \(capabilities\.statusReport\) \{/);
    }
  });

  it('[F14-REQ-014] no app file handles a transaction id, receipt, signed transaction or app account token', () => {
    const offenders = files(SRC.pathname).filter((f) => /originalTransactionId|appAccountToken|jwsRepresentation|appStoreReceipt/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
