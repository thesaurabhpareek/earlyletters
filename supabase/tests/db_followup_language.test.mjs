// entries.language (20261005000000): the spoken-letter language, one of the seven
// v1.0 codes, L4, written by the author only and read by the author only (sync_pull
// own rows; never book_entries), carried by sync_push in the "language" field group,
// and counted k-anonymously by insights.language_mix. Fictional family "Asha" only.
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, join } = h;
const { A, B, N } = users;

await sys(`insert into auth.users values ('${A}'),('${B}'),('${N}')`);
await publishPolicies();
for (const u of [A, B, N]) await consent(u);
const CHILD = await newChild(A);
await join(B, 'parent', CHILD, A);
await join(N, 'contributor', CHILD, A);
await sys(`update children set family_can_read = true where id=$1`, [CHILD]);

const lang = async (id) => (await sys(`select language from entries where id=$1`, [id])).rows[0]?.language ?? null;
const insert = (uid, id, language, inBook = true) => as(uid, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at,
    capture_mode, engine_version, raw_transcript, final_text, in_book, language)
  values ($1, $2, $3, 'letter', '2026-09-29', now(), 'spoken', 1, 'um she walked', 'She walked.', $4, $5)`, [id, CHILD, uid, inBook, language]);

// ── Column, values, classification ──────────────────────────────────────
const comment = (await sys(`select col_description('public.entries'::regclass, attnum) c from pg_attribute
  where attrelid = 'public.entries'::regclass and attname = 'language'`)).rows[0]?.c ?? '';
check('entries.language exists and is classified L4', /^L4\b/.test(comment));
const seven = ['en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt'];
let allOk = true;
for (const code of seven) allOk = allOk && (await codeOf(() => insert(A, uuid7(), code))) === 'ok';
check('each of the seven v1.0 codes is accepted (packages/core LANGUAGE_CODES)', allOk);
check('no language is fine (older apps, typed letters)', (await codeOf(() => insert(A, uuid7(), null))) === 'ok');
check('a code outside the closed list is refused (23514)', (await codeOf(() => insert(A, uuid7(), 'xx'))) === '23514'
  && (await codeOf(() => insert(A, uuid7(), 'EN'))) === '23514' && (await codeOf(() => insert(A, uuid7(), 'zh-Hans'))) === '23514');

// ── Author only ─────────────────────────────────────────────────────────
const a1 = uuid7();
await insert(A, a1, 'hi');
check('the author changes their letter\'s language', (await codeOf(() => as(A, `update entries set language='es' where id=$1`, [a1]))) === 'ok' && (await lang(a1)) === 'es');
const coWrite = await as(B, `update entries set language='fr' where id=$1`, [a1]);
check('the co-parent cannot (RLS: no row changes)', coWrite.affectedRows === 0 && (await lang(a1)) === 'es');
check('book_entries has no language column: co-parents and family never read it',
  (await codeOf(() => as(B, `select language from book_entries where id=$1`, [a1]))) === '42703'
  && !('language' in ((await as(B, `select * from book_entries where id=$1`, [a1])).rows[0] ?? { language: 1 })));
await as(A, `select public.record_policy_act('sensitive-data', '1.0.0', 'withdraw', 'settings_toggle', 'settings.privacy', '1', 'ios')`);
check('changing it needs current consent, like the words (SCCON)', (await codeOf(() => as(A, `update entries set language='fr' where id=$1`, [a1]))) === 'SCCON');
await consent(A);
await as(A, `select public.delete_entry($1)`, [a1]);
check('a deleted letter\'s language cannot change (SCTMB)', (await codeOf(() => as(A, `update entries set language='fr' where id=$1`, [a1]))) === 'SCTMB');
await as(A, `select public.restore_entry($1)`, [a1]);

// ── sync_push: the "language" field group ───────────────────────────────
const resetRate = (uid) => sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
const push = async (uid, ops) => { await resetRate(uid); return (await one(uid, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r; };
const pull = async (uid, since = {}) => { await resetRate(uid); return (await one(uid, `select public.sync_pull($1::jsonb, 200) r`, [JSON.stringify(since)])).r; };
const data = (id, extra = {}) => ({ id, child_id: CHILD, kind: 'letter', occurred_on: '2026-09-29', captured_at: '2026-09-29T20:00:00Z',
  capture_mode: 'spoken', edit_level: 'clean', engine_version: 2, raw_transcript: 'um she walked', machine_edits: [],
  final_text: 'She walked.', in_book: true, author_signs_as: 'Mama', audio_kept_on_device: true, ...extra });
const op = (id, d, extra = {}) => ({ op: uuid7(), type: 'entry.upsert', id, data: d, ...extra });

const p1 = uuid7();
let r = await push(A, [op(p1, data(p1, { language: 'hi' }))]);
check('entry.upsert stores the language', r.results[0].ok && (await lang(p1)) === 'hi');
r = await push(A, [op(p1, data(p1, { final_text: 'She walked to me.' }))]);
check('an older app that never sends "language" (no "changed" list) keeps it', r.results[0].ok && (await lang(p1)) === 'hi');
r = await push(A, [op(p1, data(p1, { final_text: 'She walked to me, slowly.', language: 'es' }), { changed: ['text'] })]);
check('the group must be listed when "changed" is given: a text-only change keeps it', r.results[0].ok && (await lang(p1)) === 'hi');
r = await push(A, [op(p1, data(p1, { language: 'es' }), { changed: ['language'] })]);
check('changed ["language"] sets it', r.results[0].ok && r.results[0].applied && (await lang(p1)) === 'es');
r = await push(A, [op(p1, data(p1, { language: null }), { changed: ['language'] })]);
check('an explicit null with the group clears it', r.results[0].ok && (await lang(p1)) === null);
r = await push(A, [op(p1, data(p1, { language: 'xx' }), { changed: ['language'] })]);
check('an unknown code is a per-op error (23514) and changes nothing', r.results[0].ok === false && r.results[0].code === '23514' && (await lang(p1)) === null);
await push(A, [op(p1, data(p1, { language: 'zh' }), { changed: ['language'] })]);

// ── sync_pull: own rows only ────────────────────────────────────────────
const aPull = await pull(A);
const ownRow = aPull.books.find((b) => b.id === CHILD).rows.find((x) => x.id === p1);
check('the author\'s pull carries the language on their own letter', ownRow?.own === true && ownRow?.language === 'zh');
const bPull = await pull(B);
const theirRow = bPull.books.find((b) => b.id === CHILD).rows.find((x) => x.id === p1);
check('the co-parent\'s pull has the in-book letter without its language', theirRow?.own === false && !('language' in theirRow));
const nPull = await pull(N);
const famRow = nPull.books.find((b) => b.id === CHILD).rows.find((x) => x.id === p1);
check('a family member who may read the book never gets it either', famRow?.own === false && !('language' in famRow));
// A book the caller left: own letters still come down, with their language.
const b1 = uuid7();
await push(B, [op(b1, data(b1, { language: 'pt' }))]);
await as(B, `select public.leave_child($1)`, [CHILD]);
const gone = (await pull(B, { books: { [CHILD]: {} } })).gone.find((g) => g.id === CHILD);
check('after leaving, the leaver\'s own letters still carry their language', gone?.rows.find((x) => x.id === b1)?.language === 'pt');

// ── Insights: static SQL, k = 10 unchanged ──────────────────────────────
const raw = (await sys(`select lang, n from insights._language_counts() order by lang`)).rows;
check('insights reads entries.language (the raw counts see this family under its codes)',
  (await sys(`select insights.language_mix_available() a`)).rows[0].a === true && raw.some((x) => x.lang === 'zh' && Number(x.n) === 1));
check('one family is below k = 10: language_mix publishes nothing', (await sys(`select * from insights.language_mix`)).rows.length === 0
  && (await sys(`select public.insights_aggregates(4) j`)).rows[0].j.language_mix.rows.length === 0);
check('the raw counts stay internal (granted to no one)', (await codeOf(() => as(A, `select * from insights._language_counts()`))) === '42501');

done();
