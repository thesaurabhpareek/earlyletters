// [FR-AIS-08] The other parent cannot read the author's working material (BL-1852, split from BL-1347).
// Given the other parent's account, when they read the book, then raw_transcript, raw_sha256, stt_meta,
// machine_edits, author_edits, locked_spans, deleted_reason and the old versions of the author's letters are not
// readable by them, by the table, the version history, the book view or the pull; the author reads all of them.
// The sentinels below are unique strings, so a leak is found wherever it appears. Fictional family "Asha" only.
//
// Known gap, not asserted here (reported with this file): engine_version is a column of book_entries, so the pull
// carries it in the other parent's row. FR-AIS-08 lists it. Closing that needs its own reviewed migration.
import { createDb, users, uuid7 } from './harness.mjs';

const h = await createDb(process.argv.slice(2));
const { check, as, sys, one, codeOf, publishPolicies, consent, newChild, join, done } = h;
const { A, B, C, N } = users;
for (const u of [A, B, C, N]) await sys(`insert into auth.users (id) values ($1) on conflict do nothing`, [u]);
await publishPolicies();
for (const u of [A, B, C, N]) await consent(u);

const CHILD = await newChild(A, 'Asha', '2025-04-12');
await join(B, 'parent', CHILD, A);          // the other parent
await join(N, 'contributor', CHILD, A);     // a relative, for the same deny

const RAW = 'SENTINEL_RAW um she giggled at the rain';
const STT = 'SENTINEL_STT_ENGINE';
const EDIT = 'SENTINEL_EDIT';
const OLD = 'SENTINEL_OLDVERSION She giggled at the rain.';
const FINAL = 'She laughed at the rain.';
const ID = uuid7();
await as(A, `insert into entries (id, child_id, author_id, kind, occurred_on, captured_at, capture_mode, engine_version,
    raw_transcript, stt_meta, machine_edits, author_edits, final_text, in_book)
  values ($1, $2, $3, 'letter', '2026-10-01', now(), 'spoken', 7, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, true)`,
  [ID, CHILD, A, RAW, JSON.stringify({ model: STT }), JSON.stringify([{ type: 'filler', start: 0, end: 3, note: EDIT }]),
   JSON.stringify([{ note: EDIT }]), OLD]);
await as(A, `update entries set final_text = $2 where id = $1`, [ID, FINAL]);   // the first text goes to entry_versions

const SECRET_COLS = ['raw_transcript', 'raw_sha256', 'stt_meta', 'machine_edits', 'author_edits', 'locked_spans', 'deleted_reason'];
const SENTINELS = [RAW, STT, EDIT, OLD, 'SENTINEL_'];
const pull = async (uid) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [uid]);
  return (await one(uid, `select public.sync_pull('{}'::jsonb, 200) r`)).r;
};
const rowIn = (r) => JSON.stringify(r).includes(ID);

// The author reads everything (so the denials below are not an empty fixture).
const own = (await one(A, `select raw_transcript, stt_meta::text s, machine_edits::text m, author_edits::text a from entries where id = $1`, [ID]));
check('[FR-AIS-08] the author reads raw_transcript, stt_meta, machine_edits and author_edits of the letter',
  own.raw_transcript === RAW && own.s.includes(STT) && own.m.includes(EDIT) && own.a.includes(EDIT));
// entry_versions has no client grant at all (20261023060000), so no member reads it through the Data API; the row exists.
check('[FR-AIS-08] the old version of the letter is stored (the check below is not vacuous)',
  (await sys(`select count(*)::int n from entry_versions where entry_id = $1 and final_text = $2`, [ID, OLD])).rows[0].n === 1);
const ownPull = await pull(A);
check('[FR-AIS-08] the author\'s own pull carries raw_transcript and machine_edits',
  JSON.stringify(ownPull).includes(RAW) && JSON.stringify(ownPull).includes(EDIT));

for (const [who, uid] of [['the other parent', B], ['a contributor', N], ['a stranger', C]]) {
  check(`[FR-AIS-08] ${who} reads no row of the author's letters table`,
    (await one(uid, `select count(*)::int n from entries where id = $1`, [ID])).n === 0);
  for (const col of SECRET_COLS) {
    const rs = await as(uid, `select ${col}::text v from entries where child_id = $1`, [CHILD]);
    check(`[FR-AIS-08] ${who} reads no ${col} of the author's letters through the table`, rs.rows.length === 0);
  }
  check(`[FR-AIS-08] ${who} cannot read the version history of the author's letters (no grant)`,
    (await codeOf(() => as(uid, `select final_text from entry_versions where entry_id = $1`, [ID]))) === '42501');
  check(`[FR-AIS-08] ${who} cannot read the book view directly (no select grant; reads go through the pull)`,
    (await codeOf(() => as(uid, `select id from book_entries`))) === '42501');
}

// The book view (the only other place a member's letters are read) has none of the working columns.
const viewCols = (await sys(`select column_name from information_schema.columns where table_schema = 'public' and table_name = 'book_entries'`)).rows.map((r) => r.column_name);
check('[FR-AIS-08] the book view lists columns (the check is not vacuous)', viewCols.includes('final_text') && viewCols.length > 10);
for (const col of SECRET_COLS) check(`[FR-AIS-08] the book view has no ${col} column`, !viewCols.includes(col));
const viewJson = JSON.stringify((await sys(`select to_jsonb(b) j from book_entries b where b.id = $1`, [ID])).rows);
check('[FR-AIS-08] the book view row for the letter holds none of the sentinels', !SENTINELS.some((s) => viewJson.includes(s)));

// The pull: the other parent receives the letter, with the words as kept and none of the working material.
for (const [who, uid] of [['the other parent', B], ['a contributor', N]]) {
  const r = await pull(uid);
  const text = JSON.stringify(r);
  // A contributor reads a book only while the family can read it (off by default), so only the parent must see the letter.
  if (uid === B) check(`[FR-AIS-08] ${who}'s pull carries the letter, with its final words (the check is not vacuous)`, rowIn(r) && text.includes(FINAL));
  check(`[FR-AIS-08] ${who}'s pull holds no sentinel from the raw transcript, speech metadata, edits or old versions`,
    !SENTINELS.some((s) => text.includes(s)));
  for (const col of SECRET_COLS) check(`[FR-AIS-08] ${who}'s pull has no "${col}" key anywhere`, !text.includes(`"${col}"`));
}
const blocked = await as(B, `update entries set raw_transcript = 'x' where id = $1 returning id`, [ID]);
check('[FR-AIS-08] the other parent cannot change the author\'s raw transcript',
  blocked.rows.length === 0 && (await sys(`select raw_transcript r from entries where id = $1`, [ID])).rows[0].r === RAW);

done();
