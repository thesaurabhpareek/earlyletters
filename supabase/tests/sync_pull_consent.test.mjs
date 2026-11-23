// FR-PRV-20 (20261123100000_sync_pull_consent_gate.sql): sync_pull returns no content rows without current
// consent (terms current, age attested, sensitive-data given). Closes T7-22 of the security test plan; T7-23
// (export and account deletion stay open without consent) is proved at the end.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, join } = h;
const { A, B, S } = users;
const G = B;                                      // the second parent: withdraws sensitive-data later
const E = '99999999-9999-9999-9999-999999999999'; // terms accepted, no age attestation
const F = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // sensitive-data given, terms never accepted
const U = users.U;                                // signed in, nothing recorded

await sys(`insert into auth.users values ('${A}'),('${B}'),('${S}'),('${E}'),('${F}'),('${U}')`);
await publishPolicies();
for (const u of [A, B, S]) await consent(u);
await consent(E, { age: false, sensitive: true });
await consent(F, { terms: false, sensitive: true });
const CHILD = await newChild(A, 'Asha', '2025-04-12');
await join(G, 'parent', CHILD, A);
// E, F and U cannot join through the consent-gated invite path: they are members as an older row would be.
for (const u of [E, F, U]) await sys(`insert into child_members (child_id, profile_id, role) values ($1, $2, 'parent')`, [CHILD, u]);

let n = 0;
const id7 = () => uuid7(Date.now() - 5000 + ++n);
const op = (type, id, data = {}, extra = {}) => ({ op: id7(), type, id, data, ...extra });
const NOW = new Date().toISOString();
const letter = (id, text) => ({
  id, child_id: CHILD, kind: 'letter', occurred_on: '2026-10-01', captured_at: NOW, capture_mode: 'spoken',
  edit_level: 'clean', prompt_key: null, engine_version: 5, raw_transcript: 'um ' + text, machine_edits: [], final_text: text,
  in_book: true, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: true,
});
const held = (id) => ({
  id, child_id: CHILD, kind: 'held_letter', capture_mode: 'typed', created_at: NOW, occurred_on: '2026-10-02',
  occurred_precision: 'day', base_direction: 'ltr', in_book_choice: true, typed_text: 'Pending words for Asha.',
  final_text: null, machine_edits: null, edit_level: null, engine_version: 5, audio_kept_on_device: true,
});
const push = async (uid, ops) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await one(uid, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r;
};
const pull = async (uid, since = {}, limit = 200) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await one(uid, `select public.sync_pull($1::jsonb, $2) r`, [JSON.stringify(since), limit])).r;
};

const LA = uuid7(), LG = uuid7(), HG = uuid7(), LE = uuid7(), LF = uuid7(), LU = uuid7();
const WORDS = { A: 'Asha waved at the dog.', G: 'Asha hummed in the car.' };
await push(A, [op('entry.upsert', LA, letter(LA, WORDS.A))]);
await push(G, [op('entry.upsert', LG, letter(LG, WORDS.G)), op('held.upsert', HG, held(HG))]);
for (const [u, id, t] of [[E, LE, 'Asha clapped.'], [F, LF, 'Asha jumped.'], [U, LU, 'Asha sang.']]) {
  await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
    values ($1, $2, $3, 'letter', '2026-10-01', now(), 'spoken', 1, $4, $4, true)`, [id, CHILD, u, t]);
}
const ids = (r) => (r.books ?? []).flatMap((b) => b.rows.map((x) => x.id));
const nameIn = (r) => JSON.stringify(r).includes('Asha');
const wordsIn = (r) => /waved|hummed|clapped|jumped|sang|Pending words/.test(JSON.stringify(r));
const empty = (r) => r.reset === false && (r.books ?? []).length === 0 && (r.gone ?? []).length === 0 && r.more === false;

// ── consent current: nothing regresses ───────────────────────────────────
const asked = { held: { cursor: null } };
let rG = await pull(G, asked);
check('[FR-PRV-20] consent current: own and other members\' letters are served', [LG, LA].every((i) => ids(rG).includes(i)));
check('[FR-PRV-20] consent current: the child name is in the book meta', rG.books[0].meta?.name === 'Asha');
check('[FR-PRV-20] consent current: the author\'s held draft is in the held section', rG.held.rows.some((x) => x.id === HG));
check('[FR-PRV-20] consent current: no withheld marker', rG.withheld === undefined);
check('[FR-PRV-20] consent current: a second parent is served the same', ids(await pull(A)).includes(LG));

// ── no consent: every way the gate can be closed ─────────────────────────
const gateOf = async (u) => (await one(u, `select * from public.my_sync_gate()`));
const cases = [
  ['no terms accepted', F, LF],
  ['no age attestation', E, LE],
  ['nothing recorded at all', U, LU],
];
for (const [label, u, own] of cases) {
  check(`[FR-PRV-20] sync_pull returns no content rows without current consent (${label}): the gate says closed`, (await gateOf(u)).content_allowed === false);
  const r = await pull(u, asked);
  check(`[FR-PRV-20] sync_pull returns no content rows without current consent (${label}): 0 rows, no books, no gone`, empty(r) && ids(r).length === 0);
  check(`[FR-PRV-20] (${label}): no child name and no letter words anywhere in the answer`, !nameIn(r) && !wordsIn(r));
  check(`[FR-PRV-20] (${label}): the held section is empty`, r.held.rows.length === 0 && r.held.more === false);
  check(`[FR-PRV-20] (${label}): the caller's own letter is withheld too`, !JSON.stringify(r).includes(own));
  check(`[FR-PRV-20] (${label}): the answer says why (withheld = consent)`, r.withheld === 'consent');
}

// sensitive-data withdrawn: the finding itself
await as(G, `select public.record_policy_act('sensitive-data', '1.0.0', 'withdraw', 'settings_toggle', 'settings.privacy', '1', 'ios')`);
check('[FR-PRV-20] sensitive-data withdrawn: my_sync_gate() says content_allowed = false', (await gateOf(G)).content_allowed === false);
rG = await pull(G, asked);
check('[FR-PRV-20] sync_pull returns no content rows without current consent (sensitive-data withdrawn): 0 rows, empty page', empty(rG));
check('[FR-PRV-20] sensitive-data withdrawn: no child name, no words, own and other members\' rows both withheld',
  !nameIn(rG) && !wordsIn(rG) && ![LG, LA].some((i) => JSON.stringify(rG).includes(i)));
check('[FR-PRV-20] sensitive-data withdrawn: the held section is empty (own held draft withheld)', rG.held.rows.length === 0 && !JSON.stringify(rG).includes(HG));
const cur = `${(await sys(`select pg_snapshot_xmin(pg_current_snapshot())::text x`)).rows[0].x}:00000000-0000-0000-0000-000000000000`;
const rC = await pull(G, { held: { cursor: cur }, books: { [CHILD]: { cursor: cur } } });
check('[FR-PRV-20] a pull with cursors: still empty, the held cursor is echoed (not advanced), no book cursor moves',
  empty(rC) && rC.held.cursor === cur);
check('[FR-PRV-20] a pull without a held section gets none', (await pull(G)).held === undefined);
const rL = await pull(G, {}, 1);
check('[FR-PRV-20] a page limit changes nothing (still empty, more = false)', empty(rL));
check('[FR-PRV-20] an epoch mismatch still answers a reset with no content',
  (await pull(G, { epoch: 999999 })).reset === true && !nameIn(await pull(G, { epoch: 999999 })));
check('a malformed request is still refused (22023)', (await codeOf(() => pull(G, { books: { x: {} } }))) === '22023');
check('a consented person with no book gets an empty page without the withheld marker',
  ids(await pull(S, asked)).length === 0 && (await pull(S, asked)).withheld === undefined);

const H = await pull(A);
check('[FR-PRV-20] a parent with consent is unaffected by the other parent\'s withdrawal (it still reads its own and the other parent\'s letters)', ids(H).includes(LA) && ids(H).includes(LG));


// ── sync_books: the same gate; closed answers keep only what the claim step and account deletion read ──
const books = async (uid) => { await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]); return (await one(uid, `select public.sync_books() r`)).r; };
const DROPPED = ['nickname', 'date_of_birth', 'birthday_md', 'due_date', 'family_can_read', 'created_by_me', 'joined_at', 'auto_add', 'my_signs_as', 'invites'];
const bk = await books(A);
check('[FR-PRV-20] sync_books consent current: full book (name, dates, members with profile ids, invites key)',
  bk.withheld === undefined && bk.books[0].name === 'Asha' && bk.books[0].date_of_birth === '2025-04-12' && bk.books[0].members.length >= 2
  && 'profile_id' in bk.books[0].members[0] && 'invites' in bk.books[0]);
for (const [label, u] of [['no terms accepted', F], ['no age attestation', E], ['nothing recorded at all', U]]) {
  const r = await books(u);
  const b = r.books[0];
  check(`[FR-PRV-20] sync_books closed (${label}): withheld = consent, first_run_open kept, one book`, r.withheld === 'consent' && typeof r.first_run_open === 'boolean' && r.books.length === 1);
  check(`[FR-PRV-20] sync_books closed (${label}): book keeps only id, role, name, members`, JSON.stringify(Object.keys(b).sort()) === JSON.stringify(['id', 'members', 'name', 'role']) && b.id === CHILD);
  check(`[FR-PRV-20] sync_books closed (${label}): no date of birth, due date, nickname, invites, profile ids`,
    !DROPPED.some((k) => k in b) && !JSON.stringify(r).includes('2025-04-12') && !JSON.stringify(r).includes('04-12') && b.members.every((m) => !('profile_id' in m) && !('joined_at' in m) && !('auto_add' in m)));
  check(`[FR-PRV-20] sync_books closed (${label}): members keep role, is_me, signs_as for the deletion lines`,
    b.members.length >= 2 && b.members.every((m) => 'role' in m && 'is_me' in m && 'signs_as' in m) && b.members.filter((m) => m.is_me).length === 1);
}
const bW = await books(G);
check('[FR-PRV-20] sync_books sensitive-data withdrawn: closed shape, no dates', bW.withheld === 'consent' && !JSON.stringify(bW).includes('2025-04-12') && !('due_date' in bW.books[0]));
const bN = await sys(`insert into auth.users values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb') returning id`).then(() => books('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'));
check('[FR-PRV-20] sync_books closed: a new account with no book is first_run_open = true, books = []', bN.first_run_open === true && bN.books.length === 0 && bN.withheld === 'consent');

// export and deletion are not behind the gate (T7-23)
const acts = (await as(G, `select document, action from public.policy_acceptances order by accepted_at, id`)).rows;
check('[T7-23] export: the person still reads their own consent history, withdraw included',
  acts.some((a) => a.document === 'sensitive-data' && a.action === 'withdraw'));
check('[T7-23] export: my_policy_state still reads', (await as(G, `select document, action from public.my_policy_state`)).rows.some((s) => s.action === 'withdraw'));
const del = await codeOf(() => as(G, `select * from public.request_account_deletion('ios')`));
check('[T7-23] request_account_deletion works without consent', del === 'ok');
check('[T7-23] the deletion request is recorded', (await sys(`select count(*)::int c from deletion_requests where profile_id = $1`, [G])).rows[0].c === 1);

// consent given again: served again
await as(E, `select public.record_policy_act('terms', '1.0.0', 'accept', 'signin_sheet', 'auth.sheet', '1.0.0', 'ios', 'en-US', null, null, '{"age_attested":true,"age_signal":"none"}'::jsonb)`);
const rE = await pull(E, asked);
check('[FR-PRV-20] consent made current again: rows are served again (own and others\')', ids(rE).includes(LE) && ids(rE).includes(LA) && rE.withheld === undefined);

done();
