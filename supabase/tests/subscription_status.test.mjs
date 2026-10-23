// WP-F14-15b: the subscription status report and the purchase consent record
// (D-080, D-081; PRD V2 F14 6.6; F14-REQ-014, -032, -043; LEGAL-REQ-049; R2 AR-13).
// Runs the two RPCs as signed-in people, anonymous and anon, the way the
// subscription-status Edge Function forwards them (the caller's JWT, the
// idempotency-key header). Fictional family "Asha" only (CLAUDE.md); no real
// purchase ids anywhere: transaction ids here are made-up numbers.
import { createHash, randomUUID } from 'node:crypto';
import { createDb, users } from './harness.mjs';

const { check, as, asAnon, sys, codeOf, done, consent, publishPolicies } = await createDb(process.argv.slice(2));
const { A, B, C, W } = users;

await sys(`insert into auth.users values ('${A}'),('${B}'),('${C}'),('${W}')`);
await publishPolicies();
for (const u of [A, B, C]) await consent(u);

// ── Helpers ──────────────────────────────────────────────────────────────
const setHeaders = (h) => sys(`select set_config('request.headers', $1, false)`, [h ? JSON.stringify(h) : '']);
const report = async (uid, body, { key, anonymous = false } = {}) => {
  await setHeaders(key ? { 'idempotency-key': key } : null);
  try {
    return (await as(uid, `select public.status_report_store($1::jsonb) as r`, [JSON.stringify(body)], { anonymous })).rows[0].r;
  } finally {
    await setHeaders(null);
  }
};
const reportCode = (uid, body, opts) => codeOf(() => report(uid, body, opts));
const salt = async (uid, opts) => (await as(uid, `select public.status_salt() as s`, [], opts)).rows[0].s;
const bytesOf = (b64url) => Buffer.from(b64url.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
// The reference the native module matches (packages/api subRefReference): hex(SHA-256(salt bytes || UTF-8 id)).
const subRef = (saltB64, originalTransactionId) =>
  createHash('sha256').update(Buffer.concat([bytesOf(saltB64), Buffer.from(String(originalTransactionId), 'utf8')])).digest('hex');
const iso = (d) => new Date(d).toISOString();
const DAY = 86_400_000;
const NOW = Date.now();
const base = (ref, over = {}) => ({
  schema_version: 1, sub_ref: ref, environment: 'production', plan: 'annual',
  trial_end: iso(NOW + 60 * DAY), renewal_date: iso(NOW + 60 * DAY), cancelled: false, reported_at: iso(NOW - 60_000), ...over,
});
const consentFacts = (over = {}) => ({ product_id: 'plus.annual', offer_type: 'introductory', terms_shown: '1.4.0+0a1b2c3d', shown_at: iso(NOW - 120_000), ...over });
const statusRows = (uid) => sys(`select * from subscription_status where profile_id = $1 order by first_received_at`, [uid]).then((r) => r.rows);
const consentRows = () => sys(`select * from subscription_consents order by recorded_at`).then((r) => r.rows);

// ── 1. Nothing here is readable or writable by a client (D-080 rule 4) ───
for (const t of ['subscription_salts', 'subscription_status', 'subscription_consents', 'subscription_report_rates']) {
  check(`[D-080] ${t}: a signed-in person cannot read it`, (await codeOf(() => as(A, `select 1 from ${t}`))) === '42501');
  check(`[D-080] ${t}: a signed-in person cannot write it`, (await codeOf(() => as(A, `delete from ${t}`))) === '42501');
}
const cols = (await sys(`select table_name, column_name from information_schema.columns
  where table_schema = 'public' and table_name like 'subscription%'`)).rows;
const purchaseLike = cols.filter((c) => /transaction|receipt|jws|signed|price|amount|card|payment|token|apple|account_token/i.test(c.column_name));
check('[F14-REQ-014] no column can hold a receipt, transaction id, price, card or token', cols.length > 20 && purchaseLike.length === 0);

// ── 1b. The server-side switch fails closed (SCKIL, detail statusReport) ──
const switchError = async (fn) => { try { await fn(); return null; } catch (e) { return `${e.code}:${e.detail}`; } };
check('[F19 6.5] with app.status_report_enabled unset, status_salt is paused (SCKIL statusReport)', (await switchError(() => salt(A))) === 'SCKIL:statusReport');
check('[F19 6.5] with app.status_report_enabled unset, status_report_store is paused and stores nothing',
  (await switchError(() => report(A, base('c'.repeat(64))))) === 'SCKIL:statusReport'
  && (await sys(`select count(*)::int n from subscription_status`)).rows[0].n === 0);
await sys(`select set_config('app.status_report_enabled', 'off', false)`);
check('[F19 6.5] any value but on keeps it paused', (await switchError(() => salt(A))) === 'SCKIL:statusReport');
await sys(`select set_config('app.status_report_enabled', 'on', false)`);

// ── 2. The salt (R2 AR-13) ───────────────────────────────────────────────
const sA = await salt(A);
check('[F14-REQ-043] status_salt answers 32 bytes as base64url without padding', /^[A-Za-z0-9_-]{43}$/.test(sA) && bytesOf(sA).length === 32);
check('[F14-REQ-043] the salt is stable for an account', (await salt(A)) === sA);
const sB = await salt(B);
check('[F14-REQ-043] each account has its own salt, so one purchase gives different sub_refs', sB !== sA && subRef(sA, 2000000101) !== subRef(sB, 2000000101));
check('[K-08] status_salt refuses an anonymous session (SCANO)', (await codeOf(() => salt(W, { anonymous: true }))) === 'SCANO');
check('[K-08] status_salt is not callable by anon', (await codeOf(() => asAnon(`select public.status_salt()`))) === '42501');

// ── 3. Storing a report: created, unchanged, updated, older ──────────────
const refA = subRef(sA, 2000000101);
let r = await report(A, base(refA), { key: randomUUID() });
check('[F14-REQ-032] a first report is created and answers only how the write went', JSON.stringify(r) === JSON.stringify({ stored: 'created', consent: 'none' }));
let rows = await statusRows(A);
check('[F14-REQ-032] one status row with the four D-080 facts and the AR-13 fields',
  rows.length === 1 && rows[0].plan === 'annual' && rows[0].cancelled === false && rows[0].environment === 'production'
  && rows[0].trial_end !== null && rows[0].renewal_date !== null && rows[0].sub_ref === refA);
r = await report(A, base(refA, { reported_at: iso(NOW - 30_000) }), { key: randomUUID() });
check('[F14-REQ-032] the same status read again is unchanged', r.stored === 'unchanged' && (await statusRows(A)).length === 1);
r = await report(A, base(refA, { cancelled: true, reported_at: iso(NOW - 20_000) }), { key: randomUUID() });
rows = await statusRows(A);
check('[F14-REQ-033] renewal turned off is stored as cancelled', r.stored === 'updated' && rows[0].cancelled === true);
r = await report(A, base(refA, { cancelled: false, reported_at: iso(NOW - 5 * DAY) }), { key: randomUUID() });
rows = await statusRows(A);
check('[F16 C12] the server receive order decides: a report from a phone whose clock is behind still updates', r.stored === 'updated' && rows[0].cancelled === false);
r = await report(A, base(refA, { reported_at: iso(NOW + 5 * DAY), cancelled: true }), { key: randomUUID() });
rows = await statusRows(A);
check('a phone clock running ahead is never refused and never stores a reading later than the server time', r.stored === 'updated' && Date.parse(rows[0].reported_at) <= Date.now() + 1000);
check('the contract\'s older outcome is never produced', !JSON.stringify(r).includes('older'));
r = await report(A, base(refA, { cancelled: true, subscribed_since: '2026-10-15', reported_at: iso(NOW) }), { key: randomUUID() });
check('subscribed_since (optional, a date) is stored and counts as a change', r.stored === 'updated' && String((await statusRows(A))[0].subscribed_since).length > 0);

// Two Apple Accounts on two phones for one account: two rows (F14-U44).
const refA2 = subRef(sA, 2000000777);
await report(A, base(refA2, { plan: 'monthly', trial_end: null, renewal_date: iso(NOW + 20 * DAY) }), { key: randomUUID() });
check('[F14-REQ-043] status is stored per (profile, sub_ref): two purchases, two rows', (await statusRows(A)).length === 2);
// A sandbox purchase (TestFlight, App Review) is stored with its environment; the scheduler emails production only.
const refB = subRef(sB, 2000000202);
await report(B, base(refB, { environment: 'sandbox' }), { key: randomUUID() });
check('[F14-REQ-043] a sandbox report is stored with environment = sandbox', (await statusRows(B))[0]?.environment === 'sandbox');
const due = (await sys(`select count(*)::int n from subscription_status where environment = 'production'`)).rows[0].n;
check('[F14-REQ-043] only production rows are in the scheduler index scope', due === 2);
// A cancelled plan keeps its end date; an ended one may report no date.
r = await report(A, base(refA2, { plan: 'monthly', trial_end: null, renewal_date: null, cancelled: true, reported_at: iso(NOW - 1_000) }), { key: randomUUID() });
check('an ended plan may report renewal_date null', r.stored === 'updated');

// ── 4. Strict shape: purchase data and anything else is refused ──────────
const refC = subRef(await salt(C), 2000000303);
for (const [label, extra] of [
  ['an original transaction id', { original_transaction_id: '2000000303' }],
  ['a transaction id', { transaction_id: '2000000303' }],
  ['a receipt', { receipt: 'MIIT...' }],
  ['a signed transaction (JWS)', { jws: 'eyJhbGciOi' }],
  ['a price', { price: 49.99 }],
  ['an app account token', { appAccountToken: randomUUID() }],
]) {
  check(`[F14-REQ-014] a report with ${label} is refused (22023) and stores nothing`, (await reportCode(C, { ...base(refC), ...extra })) === '22023');
}
check('[F14-REQ-014] consent facts with an extra key are refused', (await reportCode(C, base(refC, { consent: { ...consentFacts(), price: 4.99 } }))) === '22023');
check('a report over 2 KiB is refused', (await reportCode(C, base(refC, { trial_end: 'x'.repeat(2100) }))) === '22023');
check('a sub_ref that is not 64 lowercase hex is refused', (await reportCode(C, base(refC.toUpperCase()))) === '22023');
check('an unknown environment is refused', (await reportCode(C, base(refC, { environment: 'staging' }))) === '22023');
check('an unknown plan is refused', (await reportCode(C, base(refC, { plan: 'lifetime' }))) === '22023');
check('another schema_version is refused', (await reportCode(C, base(refC, { schema_version: 2 }))) === '22023');
check('a date that is not ISO 8601 is refused', (await reportCode(C, base(refC, { renewal_date: '1 March 2027' }))) === '22023');
check('an impossible date is refused as 22023, not a server error', (await reportCode(C, base(refC, { renewal_date: '2027-02-30T10:00:00Z' }))) === '22023');
check('cancelled must be a boolean', (await reportCode(C, base(refC, { cancelled: 'no' }))) === '22023');
check('a free period that ends after the period it sits in is refused', (await reportCode(C, base(refC, { trial_end: iso(NOW + 90 * DAY), renewal_date: iso(NOW + 30 * DAY) }))) === '22023');
const withoutReportedAt = base(refC);
delete withoutReportedAt.reported_at;
check('a missing reported_at is refused', (await reportCode(C, withoutReportedAt)) === '22023');
check('free_period_days outside 1 to 366 is refused', (await reportCode(C, base(refC, { free_period_days: 400 }))) === '22023');
check('subscribed_since with a time is refused (a date only)', (await reportCode(C, base(refC, { subscribed_since: '2025-03-01T10:00:00Z' }))) === '22023');
check('an impossible subscribed_since is refused as 22023', (await reportCode(C, base(refC, { subscribed_since: '2025-02-30' }))) === '22023');
const oldKeyConsent = { ...consentFacts(), terms_version: '1.4.0' };
delete oldKeyConsent.terms_shown;
check('consent facts under the old key terms_version are refused (the contract says terms_shown)',
  (await reportCode(C, base(refC, { consent: oldKeyConsent }))) === '22023');
check('nothing was stored for any refused report', (await statusRows(C)).length === 0);
check('[K-08] status_report_store refuses an anonymous session (SCANO)', (await reportCode(W, base(refC), { anonymous: true })) === 'SCANO');

// ── 5. D-081 consent facts: one record per original purchase ─────────────
const refConsent = subRef(sA, 2000000909);
r = await report(A, base(refConsent, { consent: consentFacts() }), { key: randomUUID() });
check('[LEGAL-REQ-049] the first report after a purchase records the consent facts', r.consent === 'recorded');
r = await report(A, base(refConsent, { consent: consentFacts({ terms_shown: 'none_outside_app' }), reported_at: iso(NOW - 10_000) }), { key: randomUUID() });
check('[LEGAL-REQ-049] a second report with consent facts keeps the first record', r.consent === 'already_recorded');
let cs = await consentRows();
check('[LEGAL-REQ-049] exactly one consent record, with product, offer type, terms version and time, and no transaction id',
  cs.length === 1 && cs[0].product_id === 'plus.annual' && cs[0].offer_type === 'introductory' && cs[0].terms_shown === '1.4.0+0a1b2c3d'
  && cs[0].shown_at !== null && cs[0].profile_id === A && !Object.keys(cs[0]).some((k) => /transaction|receipt|price/.test(k)));
r = await report(B, base(subRef(sB, 2000000505), { consent: consentFacts({ product_id: 'plus.monthly', offer_type: 'offer_code', terms_shown: 'none_outside_app' }) }), { key: randomUUID() });
check('[F14-REQ-044] an offer code redeemed outside the app records terms_shown none_outside_app', r.consent === 'recorded'
  && (await consentRows()).some((c) => c.terms_shown === 'none_outside_app' && c.offer_type === 'offer_code'));
r = await report(B, base(subRef(sB, 2000000808), { consent: consentFacts({ offer_type: 'win_back' }) }), { key: randomUUID() });
check('[F14-REQ-044] a win-back offer is recorded as its own offer type (contract OFFER_TYPES, S07 #138)', r.consent === 'recorded'
  && (await consentRows()).some((c) => c.offer_type === 'win_back'));
check('an offer type outside the contract is still refused', (await reportCode(B, base(subRef(sB, 2000000809), { consent: consentFacts({ offer_type: 'winback' }) }))) === '22023');
check('consent rows are append-only (an update is refused)', (await codeOf(() => sys(`update subscription_consents set terms_shown = '9.9.9'`))) !== 'ok');
check('consent rows are append-only (a delete outside the retention purge is refused)', (await codeOf(() => sys(`delete from subscription_consents`))) !== 'ok');
check('consent rows are append-only (a TRUNCATE is refused, SCIMM) and every record stays',
  (await codeOf(() => sys(`truncate subscription_consents`))) === 'SCIMM' && (await consentRows()).length === 3);

// ── 6. Idempotency (ADR 0017 rule 3) ─────────────────────────────────────
const key = randomUUID();
const refIdem = subRef(sB, 2000000606);
const first = await report(B, base(refIdem), { key });
const again = await report(B, base(refIdem), { key });
check('[F14-REQ-032] a retried request with the same key answers the stored result and stores one status',
  first.stored === 'created' && again.stored === 'created' && (await statusRows(B)).filter((x) => x.sub_ref === refIdem).length === 1);
let conflict = null;
try { await report(B, base(refIdem, { cancelled: true }), { key }); } catch (e) { conflict = e; }
check('the same key with another body is 22023 with detail idempotency (idempotency_conflict)', conflict?.code === '22023' && conflict?.detail === 'idempotency');
let malformed = null;
try { await report(B, base(refIdem), { key: 'not-a-uuid' }); } catch (e) { malformed = e; }
check('a malformed key is a plain 22023 (bad_request)', malformed?.code === '22023' && malformed?.detail !== 'idempotency');

// ── 7. Rate limits: 30 per person per rolling hour, each RPC ─────────────
await sys(`delete from subscription_report_rates`);
const refRate = subRef(sB, 2000000707);
let rateCodes = [];
for (let i = 0; i < 31; i++) rateCodes.push(await reportCode(B, base(refRate, { reported_at: iso(NOW - 100_000 + i) })));
check('[F14 section 9] the 31st report in an hour is SCRAT', rateCodes.slice(0, 30).every((c) => c === 'ok') && rateCodes[30] === 'SCRAT');
check('a refused report changes nothing', (await statusRows(B)).filter((x) => x.sub_ref === refRate).length === 1);
await sys(`update subscription_report_rates set window_start = now() - interval '61 minutes' where profile_id = $1`, [B]);
check('the window rolls after an hour', (await reportCode(B, base(refRate, { reported_at: iso(NOW - 1) }))) === 'ok');
rateCodes = [];
for (let i = 0; i < 31; i++) rateCodes.push(await codeOf(() => salt(C)));
check('[F14 section 9] the 31st salt request in an hour is SCRAT', rateCodes.slice(0, 30).every((c) => c === 'ok') && rateCodes[30] === 'SCRAT');
check('the rate counters are other accounts\' business only through the functions', (await codeOf(() => as(B, `update subscription_report_rates set hits = 0`))) === '42501');

// ── 8. Account deletion (D-080: status deleted with the account; D-081: consent pseudonymised) ──
// The harness sets a test pepper for every file (since #140, BL-334), so "no pepper" is made here.
await sys(`select set_config('app.consent_pepper', '', false)`);
check('[D-081] deleting an account with consent records and no pepper is refused (fails closed, 55000)',
  (await codeOf(() => sys(`delete from auth.users where id = $1`, [A]))) === '55000');
check('nothing was deleted by the refused attempt', (await statusRows(A)).length === 3);
await sys(`select set_config('app.consent_pepper', $1, false)`, ['f'.repeat(64)]);
check('deleting the account succeeds with the pepper set', (await codeOf(() => sys(`delete from auth.users where id = $1`, [A]))) === 'ok');
check('[D-080] the status rows go with the account', (await statusRows(A)).length === 0);
check('[R2 AR-13] the salt goes with the account, so its sub_refs can no longer be made', (await sys(`select 1 from subscription_salts where profile_id = $1`, [A])).rows.length === 0);
cs = (await consentRows()).filter((c) => c.sub_ref === refConsent);
const expectHash = createHash('sha256').update(A + 'f'.repeat(64), 'utf8').digest();
check('[D-081] the consent record stays, pseudonymised with the same hash as policy_acceptances',
  cs.length === 1 && cs[0].profile_id === null && cs[0].pseudonymised_at !== null && Buffer.compare(Buffer.from(cs[0].subject_hash), expectHash) === 0);
// W never accepted a policy nor bought anything, so no pseudonymise trigger has work to do
// (policy_acceptances fails closed the same way from S02's PR #140, so a consented account would not do here).
check('an account with no consent records deletes without the pepper', await (async () => {
  await sys(`select set_config('app.consent_pepper', '', false)`);
  const code = await codeOf(() => sys(`delete from auth.users where id = $1`, [W]));
  return code === 'ok';
})());

// ── 9. Retention: 3 years after pseudonymisation (D-081, Privacy Policy section 10) ──
const purge = async (at) => (await sys(`select public.subscription_retention_purge($1::timestamptz) n`, [at])).rows[0].n;
check('the retention purge keeps a record younger than 3 years', (await purge(iso(Date.now() + 2 * 365 * DAY))) === 0 && (await consentRows()).length === 3);
check('the retention purge deletes it 3 years after pseudonymisation, and only the pseudonymised one',
  (await purge(iso(Date.now() + 3 * 366 * DAY))) === 1 && (await consentRows()).every((c) => c.profile_id === B));
check('the retention purge is service role only', (await codeOf(() => as(B, `select public.subscription_retention_purge()`))) === '42501');

done();
