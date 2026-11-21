// DSR-R09 (docs/engineering/08-data-rights-and-legal-requests.md): a purged id never comes back,
// so a stale phone cannot resurrect a deleted letter. Test plan B13 risk 13, case T7-35.
// Row-level proof after a delete: the id is never in a later pull, a stale upload and a restore
// re-upload are refused (SCDEL), also after the 60 day ledger trim, and a restore replay removes a
// ghost row so the next pull does not show it. The permanent guard for a purged BOOK id after the
// ledger trim is not built (data-security 06 finding 9); that one is a red-today case below.
// Fictional family "Asha" only (CLAUDE.md).
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, done, publishPolicies, consent, newChild, join } = h;
const { A, B } = users;

await sys(`insert into auth.users values ('${A}'),('${B}')`);
await publishPolicies();
for (const u of [A, B]) await consent(u);
const CHILD = await newChild(A, 'Asha', '2025-04-12');
await join(B, 'parent', CHILD, A);

let n = 0;
const id7 = () => uuid7(Date.now() - 5000 + ++n);
const op = (type, id, data = {}, extra = {}) => ({ op: id7(), type, id, data, ...extra });
const push = async (uid, ops) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await one(uid, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)])).r;
};
const pull = async (uid, since = {}) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await one(uid, `select public.sync_pull($1::jsonb, 200) r`, [JSON.stringify(since)])).r;
};
const NOW = new Date().toISOString();
const letter = (id, text) => ({
  id, child_id: CHILD, kind: 'letter', occurred_on: '2026-10-01', captured_at: NOW, capture_mode: 'spoken',
  edit_level: 'clean', prompt_key: null, engine_version: 5, raw_transcript: text, machine_edits: [], final_text: text,
  in_book: true, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: true,
});
const rowOf = async (id) => (await sys(`select 1 from entries where id = $1`, [id])).rows.length === 1;
const trimLedger = (id) => sys(`delete from purge_ledger where entity_type = 'entry' and entity_id = $1`, [id]);
// Every id a reader's pull names, whatever the shape of the answer: the id must be in none of it.
const everywhere = async (uid, id) => JSON.stringify(await pull(uid)).includes(id);

// 1. Erase, then a later pull, a stale upload and a restore re-upload.
const E = id7();
await push(A, [op('entry.upsert', E, letter(E, 'You hummed at the window.'))]);
check('[DSR-R09] the co-parent sees the letter before it is erased', await everywhere(B, E));
await push(A, [op('entry.delete', E)]);
const er = (await push(A, [op('entry.erase', E)])).results[0];
check('[DSR-R09] Erase now removes the row', er.ok && er.erased === true && !(await rowOf(E)));
check('[DSR-R09] a later full pull by the author and by the co-parent never names the id',
  !(await everywhere(A, E)) && !(await everywhere(B, E)));
let r = await push(A, [op('entry.upsert', E, letter(E, 'You hummed at the window, again.'), { changed: ['text'], base: '1' })]);
check('[DSR-R09] a stale phone pushing the purged id is refused as gone (SCDEL), nothing stored',
  r.results[0].code === 'SCDEL' && r.results[0].gone === true && !(await rowOf(E)));
await trimLedger(E);   // the 60 day trim: only the erasure record is left
r = await push(A, [op('entry.reupload', E, letter(E, 'You hummed at the window.'), { known_at: new Date().toISOString() })]);
check('[DSR-R09] after the ledger trim, a restore re-upload is still refused (SCDEL)', r.results[0].code === 'SCDEL' && !(await rowOf(E)));
check('[DSR-R09] and the next pull still never names the id', !(await everywhere(A, E)) && !(await everywhere(B, E)));

// 2. A restore brings the row back; the replay of the ledger removes it before anyone pulls it.
const G = id7();
await push(A, [op('entry.upsert', G, letter(G, 'Your first wave.'))]);
await push(A, [op('entry.delete', G)]);
await push(A, [op('entry.erase', G)]);
await sys(`set session_replication_role = replica`);   // a restored database holds the row, no trigger runs
await sys(`insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version, raw_transcript, final_text, in_book)
  values ($1, $2, $3, 'letter', '2026-10-01', now(), 'spoken', 1, 'Your first wave.', 'Your first wave.', true)`, [G, CHILD, A]);
await sys(`set session_replication_role = origin`);
await sys(`select public.ops_replay_ledger($1::jsonb)`, [JSON.stringify([{ t: 'entry', id: G }])]);
check('[DSR-R09] the restore replay removes the ghost row, and no pull names it', !(await rowOf(G)) && !(await everywhere(B, G)));

// 3. Red today: the purged BOOK id after the 60 day trim has no permanent guard (finding 9).
// Flips to a failure when the guard lands, so the case is promoted to a plain check then.
const BOOK = '0192e000-0000-7000-8000-0000000000ab';
await sys(`insert into purge_ledger (entity_type, entity_id) values ('child', $1)`, [BOOK]);
check('[DSR-R09] a purged book id cannot be recreated while the ledger holds it',
  (await codeOf(() => as(B, `select public.create_child($1, 'Asha', '2025-04-12')`, [BOOK]))) === 'SCDEL');
await sys(`delete from purge_ledger where entity_type = 'child' and entity_id = $1`, [BOOK]);
const stillRefused = (await codeOf(() => as(B, `select public.create_child($1, 'Asha', '2025-04-12')`, [BOOK]))) === 'SCDEL';
check('[DSR-R09][KNOWN GAP, flips to a failure when the SCPRG guard ships] a purged book id is refused after the trim', !stillRefused);
done();
