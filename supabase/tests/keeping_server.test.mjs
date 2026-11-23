// The keeping promises the server half must never break (BL-959; NS-10-R4a, NS-10-R10):
//  - deleting an account works for a person who has not agreed to the current Terms (PRIV-R09);
//  - a lapsed plan still brings the whole book to the phone (the server has no plan check).
// Fictional family "Asha" only (CLAUDE.md); the status row holds made-up values, no receipt.
import { createDb, users, uuid7 } from './harness.mjs';

const { check, as, sys, one, done, publishPolicies, consent, newChild } = await createDb(process.argv.slice(2));
const { A, B, U } = users;

await sys(`insert into auth.users values ('${A}'),('${B}'),('${U}')`);
await publishPolicies();
await consent(A);
const CHILD = await newChild(A, 'Asha', '2025-04-12');

// ── [NS-10-R10] a lapsed plan still brings the book ───────────────────────
// Runs first: the newer Terms published below would make A's own acceptance stale for content writes.
// sync_pull checks the caller is signed in and nothing about a plan (G1). This cell pins that none is added.
const NOW = new Date().toISOString();
const op = (id) => ({ op: uuid7(), type: 'entry.upsert', id, changed: ['text', 'in_book', 'sounds_like_me', 'occurred_on', 'language'], base: null, data: {
  id, child_id: CHILD, kind: 'letter', occurred_on: '2026-10-01', captured_at: NOW, capture_mode: 'typed', edit_level: 'verbatim',
  prompt_key: null, engine_version: 5, raw_transcript: 'You laughed at the rain.', machine_edits: [], final_text: `Letter ${id.slice(-4)}: you laughed at the rain.`,
  in_book: true, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: false } });
const ids = Array.from({ length: 5 }, () => uuid7());
await sys(`delete from sync_rate_windows where profile_id = $1`, [A]);
const pushed = (await one(A, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ids.map(op))])).r;
check('[NS-10-R10] arrange: five Asha letters are on the server', pushed.results?.length === 5 && pushed.results.every((x) => x.ok === true));
const pullRows = async () => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [A]);
  const r = (await one(A, `select public.sync_pull('{}'::jsonb, 200) r`)).r;
  return ((r.books ?? []).find((b) => b.id === CHILD)?.rows ?? []).map((x) => x.id).sort();
};
const before = await pullRows();
check('[NS-10-R10] arrange: the pull brings the five letters', before.length === 5 && JSON.stringify(before) === JSON.stringify([...ids].sort()));
// An expired, cancelled plan: renewal and trial in the past (columns as in 20261016001000).
await sys(`insert into subscription_status (profile_id, sub_ref, environment, plan, trial_end, renewal_date, cancelled, reported_at, fingerprint)
           values ($1, repeat('a', 64), 'production', 'monthly', now() - interval '60 days', now() - interval '30 days', true, now() - interval '30 days', 'asha-fixture')`, [A]);
check('[NS-10-R10] arrange: the plan row is there and lapsed',
  (await sys(`select count(*)::int n from subscription_status where profile_id = $1 and cancelled and renewal_date < now()`, [A])).rows[0].n === 1);
const after = await pullRows();
check('[NS-10-R10] a lapsed plan still brings the book: the same five letters, none held back', JSON.stringify(after) === JSON.stringify(before));


// ── [NS-10-R4a] deletion works without agreeing ───────────────────────────
// U has never accepted anything. B accepted Terms 1.0.0, and a newer Terms version that needs a fresh yes
// is then published, so B's acceptance is stale. Both must still be able to ask for deletion.
await consent(B);
await sys(`insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from,
             effective_at, content_sha256, url, summary)
           values ('terms', '2.0.0', 'major', true, now() - interval '40 days', now() - interval '40 days', now() - interval '5 days',
             sha256(convert_to('terms-2', 'UTF8')), 'https://example.invalid/terms/2.0.0', 'Second version')`);
const needs = async (uid) => JSON.stringify((await as(uid, `select * from public.policy_actions_needed()`)).rows);
check('[NS-10-R4a] arrange: the person with no acceptance and the person with a stale one both owe Terms',
  (await needs(U)).includes('terms') && (await needs(B)).includes('terms'));
const ask = async (uid) => { try { return (await as(uid, `select * from public.request_account_deletion('ios')`)).rows[0]; } catch { return null; } };
let q = await ask(U);
check('[NS-10-R4a] deletion works for a caller with no terms acceptance', !!q?.request_id && !!q.scheduled_for);
q = await ask(B);
check('[NS-10-R4a] deletion works for a caller whose terms acceptance is stale', !!q?.request_id && !!q.scheduled_for);
check('[NS-10-R4a] a repeat answers the same request and makes no second one',
  (await ask(B))?.request_id === q?.request_id && !!q
  && (await sys(`select count(*)::int n from deletion_requests where profile_id = $1 and kind = 'account'`, [B])).rows[0].n === 1);

done();
