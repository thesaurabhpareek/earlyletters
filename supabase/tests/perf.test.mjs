// Read-path performance at launch scale: 1,000 families x 400 letters (400,000
// entries), queried as signed-in users through RLS and the book_entries view.
// Asserts (1) EXPLAIN plans use indexes, never a sequential scan of entries, and
// (2) p95 server-side execution time per query class stays inside the budgets
// documented in supabase/APPLY.md (Performance budgets).
//
// Budgets are for PGlite (single-threaded WASM Postgres) on a CI-class machine;
// native Postgres on Supabase is faster. They guard against plan regressions
// (a lost index turns 2 ms into 200+ ms), not against network latency, which
// PRD 7.2 budgets separately (read RPC p95 300 ms at the client).
//
// Scale knobs: PERF_FAMILIES (default 1000), PERF_ENTRIES (default 400), PERF_SAMPLES (default 200).
// Fictional family "Asha" only (CLAUDE.md).
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDb } from './harness.mjs';

const FAMILIES = Number(process.env.PERF_FAMILIES ?? 1000);
const PER_FAMILY = Number(process.env.PERF_ENTRIES ?? 400);
const SAMPLES = Number(process.env.PERF_SAMPLES ?? 200);
// Measured 2 Oct 2026 at 1,000 x 400 (p95 ms): book_page 6.1, book_full 8.8, search_common 4.0,
// search_rare 3.8, letter_member 1.3, letter_author 0.9. Budgets are about 2.5x that.
const BUDGET_MS = { book_page: 15, book_full: 25, search_common: 12, search_rare: 12, letter_member: 4, letter_author: 4 };

const dataDir = mkdtempSync(join(tmpdir(), 'scribe-perf-'));
const { db, check, sys, done } = await createDb(process.argv.slice(2), { dataDir });
const cleanup = () => { try { rmSync(dataDir, { recursive: true, force: true }); } catch {} };
process.on('exit', cleanup);

// ── Seed ───────────────────────────────────────────────────────────────────
const t0 = performance.now();
const uid = (tag, f) => `('00000000-0000-4000-${tag}-' || lpad(to_hex(${f}), 12, '0'))::uuid`;
await db.exec(`
  set session_replication_role = replica;   -- bulk load: skip triggers and FK checks, set derived columns here
  create temp table words as select unnest(string_to_array(
    'she walked to me today and laughed when the dog ran past the window we sat in the garden after lunch '
    || 'your grandmother sang the old song you clapped along for the first time papa made dal and rice '
    || 'you said ball very clearly then fell asleep on my shoulder the rain stopped we went to the park '
    || 'little hands reached for the spoon you tried mango and made a face we read the moon book twice', ' ')) w;
  create temp table texts as
    select n, (select string_agg(w, ' ') from (select w from words order by md5(n::text || w) limit 24) s)
              || case when n % 100 = 0 then ' giraffe' else '' end as t
      from generate_series(0, 4999) n;
  insert into auth.users select ${uid('a000', 'f')} from generate_series(1, ${FAMILIES}) f
    union all select ${uid('b000', 'f')} from generate_series(1, ${FAMILIES}) f
    union all select ${uid('c000', 'f')} from generate_series(1, ${FAMILIES}) f;
  insert into profiles (id, signs_as) select id, 'Papa' from auth.users;
  insert into children (id, name, date_of_birth, created_by)
    select ${uid('d000', 'f')}, 'Asha', date '2025-05-20', ${uid('a000', 'f')} from generate_series(1, ${FAMILIES}) f;
  insert into child_members (child_id, profile_id, role)
    select ${uid('d000', 'f')}, ${uid('a000', 'f')}, 'parent' from generate_series(1, ${FAMILIES}) f
    union all select ${uid('d000', 'f')}, ${uid('b000', 'f')}, 'parent' from generate_series(1, ${FAMILIES}) f
    union all select ${uid('d000', 'f')}, ${uid('c000', 'f')}, 'contributor' from generate_series(1, ${FAMILIES}) f;
  insert into entries (id, child_id, author_id, author_signs_as, kind, occurred_on, captured_at, capture_mode, engine_version,
                       raw_transcript, raw_sha256, final_text, machine_edits, in_book, deleted_at, deleted_reason)
    select md5('e' || f || '-' || k)::uuid,
           ${uid('d000', 'f')},
           case when k % 5 = 4 then ${uid('c000', 'f')} when k % 2 = 0 then ${uid('a000', 'f')} else ${uid('b000', 'f')} end,
           'Papa', 'letter',
           date '2025-05-20' + (k * 730 / ${PER_FAMILY}),
           (date '2025-05-20' + (k * 730 / ${PER_FAMILY}))::timestamptz + make_interval(mins => 1200 + k % 120),
           'spoken', 1,
           'um ' || x.t, sha256(convert_to('um ' || x.t, 'UTF8')), x.t, '[]'::jsonb,
           k % 10 <> 0,
           case when k % 100 = 7 then now() end,
           case when k % 100 = 7 then 'user' end
      from generate_series(1, ${FAMILIES}) f
      cross join generate_series(0, ${PER_FAMILY} - 1) k
      join texts x on x.n = (f * 7919 + k * 31) % 5000;
  set session_replication_role = origin;
  analyze;
`);
const seedS = ((performance.now() - t0) / 1000).toFixed(1);
const total = (await sys('select count(*)::int n from entries')).rows[0].n;
const size = (await sys(`select pg_size_pretty(pg_total_relation_size('public.entries')) s`)).rows[0].s;
check(`seeded ${FAMILIES} families x ${PER_FAMILY} letters = ${total} entries (${size}, ${seedS} s)`, total === FAMILIES * PER_FAMILY);

// ── Query classes ──────────────────────────────────────────────────────────
// Parent B of family f reads the book (B is a non-author for most letters).
const Q = {
  book_page: { sql: `select id, author_id, author_signs_as, kind, occurred_on, final_text, photo_path
      from book_entries where child_id = $1 and in_book and deleted_at is null
      order by occurred_on desc, captured_at desc limit 60`, args: (f) => [child(f)] },
  book_full: { sql: `select id, author_id, kind, occurred_on, final_text
      from book_entries where child_id = $1 and in_book and deleted_at is null
      order by occurred_on desc, captured_at desc`, args: (f) => [child(f)] },
  search_common: { sql: `select id, occurred_on from book_entries
      where child_id = $1 and in_book and deleted_at is null and search @@ websearch_to_tsquery('simple', $2)
      order by occurred_on desc limit 50`, args: (f) => [child(f), 'walked garden'] },
  search_rare: { sql: `select id, occurred_on from book_entries
      where child_id = $1 and in_book and deleted_at is null and search @@ websearch_to_tsquery('simple', $2)
      order by occurred_on desc limit 50`, args: (f) => [child(f), 'giraffe'] },
  letter_member: { sql: `select * from book_entries where id = $1`, args: (f, k) => [entry(f, k)] },
  letter_author: { sql: `select * from entries where id = $1`, args: (f, k) => [entry(f, k)], as: 'author' },
};
const hex = (f) => f.toString(16).padStart(12, '0');
const child = (f) => `00000000-0000-4000-d000-${hex(f)}`;
const parentB = (f) => `00000000-0000-4000-b000-${hex(f)}`;
const author = (f, k) => `00000000-0000-4000-${k % 5 === 4 ? 'c000' : k % 2 === 0 ? 'a000' : 'b000'}-${hex(f)}`;
const md5uuid = async (s) => (await sys(`select md5($1)::uuid as u`, [s])).rows[0].u;
let entryIds = new Map();
const entry = (f, k) => entryIds.get(`${f}-${k}`);

const signIn = (u) => db.exec(`reset role; select set_config('request.jwt.claim.sub', '${u}', false); set role authenticated;`);
const signOut = () => db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);

// Sample plan: random family, in-book letter (k % 10 != 0, k % 100 != 7).
let seed = 42;
const rand = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return 1 + (seed % n); };
const plan = [];
for (let i = 0; i < SAMPLES + 20; i++) {
  const f = rand(FAMILIES);
  let k = rand(PER_FAMILY) - 1; if (k % 10 === 0 || k % 100 === 7) k = (k + 1) % PER_FAMILY;
  plan.push([f, k]);
}
for (const [f, k] of plan) entryIds.set(`${f}-${k}`, await md5uuid(`e${f}-${k}`));

// ── Plans: indexes only, no sequential scan of entries ─────────────────────
const [pf, pk] = plan[0];
for (const [name, q] of Object.entries(Q)) {
  await signIn(q.as === 'author' ? author(pf, pk) : parentB(pf));
  const text = (await db.query(`explain ${q.sql}`, q.args(pf, pk))).rows.map((r) => r['QUERY PLAN']).join('\n');
  await signOut();
  const seq = /Seq Scan on (entries|children|child_members)/.test(text);
  if (seq || process.env.PERF_VERBOSE) console.log(`      plan ${name}:\n${text.replace(/^/gm, '        ')}`);
  check(`${name}: plan uses indexes (no seq scan of entries, children or members)`, !seq && /Index|Bitmap/.test(text));
}

// ── Timing ─────────────────────────────────────────────────────────────────
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]; };
const results = {};
for (const [name, q] of Object.entries(Q)) {
  const ms = [];
  let rows = 0;
  for (let i = 0; i < plan.length; i++) {
    const [f, k] = plan[i];
    await signIn(q.as === 'author' ? author(f, k) : parentB(f));
    const s = performance.now();
    const r = await db.query(q.sql, q.args(f, k));
    const e = performance.now() - s;
    await signOut();
    if (i >= 20) { ms.push(e); rows += r.rows.length; }      // first 20 are warm-up
  }
  results[name] = { p50: pct(ms, 50), p95: pct(ms, 95), p99: pct(ms, 99), rows: rows / ms.length };
}
console.log(`      ${'query'.padEnd(14)} ${'p50 ms'.padStart(8)} ${'p95 ms'.padStart(8)} ${'p99 ms'.padStart(8)} ${'budget'.padStart(7)} ${'rows'.padStart(6)}`);
for (const [name, r] of Object.entries(results)) {
  console.log(`      ${name.padEnd(14)} ${r.p50.toFixed(2).padStart(8)} ${r.p95.toFixed(2).padStart(8)} ${r.p99.toFixed(2).padStart(8)} ${String(BUDGET_MS[name]).padStart(7)} ${r.rows.toFixed(0).padStart(6)}`);
}
for (const [name, r] of Object.entries(results)) {
  check(`${name}: p95 ${r.p95.toFixed(2)} ms within ${BUDGET_MS[name]} ms (${SAMPLES} samples)`, r.p95 <= BUDGET_MS[name]);
}
check('member single-letter read returns the letter', results.letter_member.rows === 1 && results.letter_author.rows === 1);
check('a book page returns a full chapter', results.book_page.rows === 60);

await db.close();
done();
