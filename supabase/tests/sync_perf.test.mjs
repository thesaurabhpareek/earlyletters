// Sync RPC performance on the launch-scale perf fixture: 1,000 families x 400
// letters (400,000 entries), the same seed as perf.test.mjs, with every trigger
// on for the writes. Asserts plans (index scans, no sequential scan of entries)
// and server-side p95 per call class against the budgets below (decision 17;
// packages/api ENDPOINT_CLASSES has the client-side p95 including the network:
// read_rpc 300 ms, sync_batch 800 ms; TDD 06 3.2 gives a batch 250 ms of server time).
//
// Budgets are for PGlite (single-threaded WASM Postgres); native Postgres on
// Supabase is faster. They guard against plan regressions, like perf.test.mjs.
// Scale knobs: PERF_FAMILIES (default 1000), PERF_ENTRIES (default 400),
// PERF_SAMPLES (default 120), PERF_PUSH_SAMPLES (default 40).
// Fictional family "Asha" only (CLAUDE.md).
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDb, uuid7 } from './harness.mjs';

const FAMILIES = Number(process.env.PERF_FAMILIES ?? 1000);
const PER_FAMILY = Number(process.env.PERF_ENTRIES ?? 400);
const SAMPLES = Number(process.env.PERF_SAMPLES ?? 120);
const PUSH_SAMPLES = Number(process.env.PERF_PUSH_SAMPLES ?? 40);
// Measured 3 Oct 2026 at 1,000 x 400 (p95 ms, PGlite, shared machine): pull_idle 2.1,
// pull_verify 5.2, pull_incremental 5.4, pull_first_page 15.5, push_50_inserts 36.5,
// push_50_edits 57.8. Budgets are about 3 to 4x that (machine load moves all of them
// together); the push budgets stay well inside TDD 06's 250 ms of server time.
const BUDGET_MS = {
  pull_idle: 8,          // every book at its head, nothing changed (the common foreground pull)
  pull_verify: 20,       // same, plus the digest of every letter the caller may hold
  pull_incremental: 20,  // five new letters since the cursor
  pull_first_page: 50,   // a new phone: the first 200 rows of a 400-letter book
  push_50_inserts: 120,  // 50 new letters, every trigger on
  push_50_edits: 180,    // 50 edits of the words, versions written
};

const dataDir = mkdtempSync(join(tmpdir(), 'scribe-sync-perf-'));
const { db, check, sys, done } = await createDb(process.argv.slice(2), { dataDir });
process.on('exit', () => { try { rmSync(dataDir, { recursive: true, force: true }); } catch {} });

// ── Seed (perf.test.mjs fixture, plus consent so pushes pass the gate) ─────
const t0 = performance.now();
const uid = (tag, f) => `('00000000-0000-4000-${tag}-' || lpad(to_hex(${f}), 12, '0'))::uuid`;
await db.exec(`
  set session_replication_role = replica;
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
    select ${uid('d000', 'f')}, 'Asha', date '2025-04-12', ${uid('a000', 'f')} from generate_series(1, ${FAMILIES}) f;
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
           date '2025-04-12' + (k * 730 / ${PER_FAMILY}),
           (date '2025-04-12' + (k * 730 / ${PER_FAMILY}))::timestamptz + make_interval(mins => 1200 + k % 120),
           'spoken', 1,
           'um ' || x.t, sha256(convert_to('um ' || x.t, 'UTF8')), x.t, '[]'::jsonb,
           k % 10 <> 0,
           case when k % 100 = 7 then now() end,
           case when k % 100 = 7 then 'user' end
      from generate_series(1, ${FAMILIES}) f
      cross join generate_series(0, ${PER_FAMILY} - 1) k
      join texts x on x.n = (f * 7919 + k * 31) % 5000;
  set session_replication_role = origin;
  insert into policy_versions (document, version, change_class, requires_reconsent, published_at, new_users_from, effective_at, content_sha256, url, summary)
    select d, '1.0.0', 'initial', false, now() - interval '2 days', now() - interval '2 days', now() - interval '2 days',
           sha256(convert_to(d, 'UTF8')), 'https://example.invalid/' || d, 'First version'
      from unnest(array['terms', 'sensitive-data']) d;
  insert into policy_acceptances (profile_id, document, version, action, method, surface, app_version, platform, context)
    select id, 'terms', '1.0.0', 'accept', 'signin_sheet', 'perf', '1', 'ios', '{"age_attested": true}'::jsonb from auth.users
    union all
    select id, 'sensitive-data', '1.0.0', 'accept', 'consent_sheet', 'perf', '1', 'ios', '{}'::jsonb from auth.users;
  analyze;
`);
const seedS = ((performance.now() - t0) / 1000).toFixed(1);
const total = (await sys('select count(*)::int n from entries')).rows[0].n;
check(`seeded ${FAMILIES} families x ${PER_FAMILY} letters = ${total} entries (${seedS} s)`, total === FAMILIES * PER_FAMILY);

const hex = (f) => f.toString(16).padStart(12, '0');
const child = (f) => `00000000-0000-4000-d000-${hex(f)}`;
const parentA = (f) => `00000000-0000-4000-a000-${hex(f)}`;
const parentB = (f) => `00000000-0000-4000-b000-${hex(f)}`;
const ZERO = '00000000-0000-0000-0000-000000000000';

const signIn = (u) => db.exec(`reset role; select set_config('request.jwt.claim.sub', '${u}', false),
  set_config('request.jwt.claims', '{"sub": "${u}", "role": "authenticated"}', false); set role authenticated;`);
const signOut = () => db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false), set_config('request.jwt.claims', '', false);`);
const callAs = async (u, sql, params) => {
  await sys(`delete from sync_rate_windows where profile_id = $1`, [u]);
  await signIn(u);
  try {
    const s = performance.now();
    const r = await db.query(sql, params);
    return { ms: performance.now() - s, r: r.rows[0].r };
  } finally { await signOut(); }
};
const pull = (u, since, limit = 200) => callAs(u, `select public.sync_pull($1::jsonb, $2) r`, [JSON.stringify(since), limit]);
const push = (u, ops) => callAs(u, `select public.sync_push($1::jsonb) r`, [JSON.stringify(ops)]);

let seed = 7;
const rand = (k) => { seed = (seed * 1103515245 + 12345) % 2147483648; return 1 + (seed % k); };
const pct = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]; };
const results = {};
const measure = async (name, samples, fn) => {
  const ms = [];
  for (let i = 0; i < samples + 10; i++) { const t = await fn(i); if (i >= 10) ms.push(t); }   // 10 warm-up calls
  results[name] = { p50: pct(ms, 50), p95: pct(ms, 95), p99: pct(ms, 99), n: ms.length };
};
const xmin = async () => (await sys(`select pg_snapshot_xmin(pg_current_snapshot())::text x`)).rows[0].x;
const head = async () => `${await xmin()}:${ZERO}`;

// ── Plans ──────────────────────────────────────────────────────────────────
await signIn(parentB(1));
const planSql = `explain select e.id from entries e where e.child_id = $1 and (e.sync_xid, e.id) > ('0'::xid8, '${ZERO}'::uuid)
  and e.sync_xid < '999999'::xid8 and (e.author_id = auth.uid() or exists (select 1 from book_entries be where be.id = e.id))
  order by e.sync_xid, e.id limit 200`;
const plan = (await db.query(planSql, [child(1)])).rows.map((x) => x['QUERY PLAN']).join('\n');
await signOut();
const seqScan = /Seq Scan on (entries|children|child_members)/.test(plan);
if (seqScan || process.env.PERF_VERBOSE) console.log(plan.replace(/^/gm, '        '));
check('pull page plan: index scan on entries_sync_cursor_idx, no sequential scan', !seqScan && /entries_sync_cursor_idx/.test(plan));

// ── Pulls (co-parent B of a random family) ─────────────────────────────────
const firstRows = [];
await measure('pull_first_page', SAMPLES, async () => {
  const f = rand(FAMILIES);
  const { ms, r } = await pull(parentB(f), {});
  firstRows.push(r.books[0].rows.length);
  return ms;
});
check('a first pull returns a full page of 200 rows', firstRows.every((x) => x === 200));

const h = await head();
await measure('pull_idle', SAMPLES, async () => {
  const f = rand(FAMILIES);
  const { ms, r } = await pull(parentB(f), { epoch: 1, books: { [child(f)]: { cursor: h, access: 'parent', meta: 'x', have: { n: 1, sum: 1 } } } });
  if (r.books[0].rows.length !== 0) throw new Error('idle pull returned rows');
  return ms;
});
await measure('pull_verify', SAMPLES, async () => {
  const f = rand(FAMILIES);
  const { ms, r } = await pull(parentB(f), { epoch: 1, books: { [child(f)]: { cursor: h, access: 'parent', meta: 'x', have: { n: 1, sum: 1 }, verify: true } } });
  if (r.books[0].visible.n < 300) throw new Error('verify digest too small');
  return ms;
});

// Five new letters by A, then B pulls from just before them.
const letter = (f, id, text) => ({
  op: uuid7(), type: 'entry.upsert', id, data: {
    id, child_id: child(f), kind: 'letter', occurred_on: '2026-09-29', captured_at: '2026-09-29T20:00:00Z', capture_mode: 'typed',
    edit_level: 'verbatim', prompt_key: null, engine_version: 2, raw_transcript: text, machine_edits: [], final_text: text,
    in_book: true, sounds_like_me: null, author_signs_as: 'Mama', audio_kept_on_device: false,
  },
});
const incRows = [];
await measure('pull_incremental', SAMPLES, async () => {
  const f = rand(FAMILIES);
  const before = await head();
  await push(parentA(f), Array.from({ length: 5 }, () => { const id = uuid7(); return letter(f, id, 'We read the moon book twice.'); }));
  const { ms, r } = await pull(parentB(f), { epoch: 1, books: { [child(f)]: { cursor: before, access: 'parent', meta: 'x', have: { n: 1, sum: 1 } } } });
  incRows.push(r.books[0].rows.length);
  return ms;
});
check('an incremental pull returns exactly the new letters', incRows.every((x) => x === 5));

// ── Pushes (parent A, every trigger on) ────────────────────────────────────
const okAll = [];
await measure('push_50_inserts', PUSH_SAMPLES, async () => {
  const f = rand(FAMILIES);
  const { ms, r } = await push(parentA(f), Array.from({ length: 50 }, () => letter(f, uuid7(), 'You said ball very clearly.')));
  okAll.push(r.results.length === 50 && r.results.every((x) => x.ok));
  return ms;
});
await measure('push_50_edits', PUSH_SAMPLES, async () => {
  const f = rand(FAMILIES);
  const rows = (await sys(`select id, raw_transcript, captured_at, engine_version from entries
     where child_id = $1 and author_id = $2 and deleted_at is null order by id limit 50`, [child(f), parentA(f)])).rows;
  const ops = rows.map((x) => {
    const o = letter(f, x.id, 'x');
    Object.assign(o.data, { raw_transcript: x.raw_transcript, captured_at: new Date(x.captured_at).toISOString(), engine_version: x.engine_version,
      final_text: `Edited ${Math.random().toString(36).slice(2, 8)}.` });
    return { ...o, changed: ['text'] };
  });
  const { ms, r } = await push(parentA(f), ops);
  okAll.push(r.results.length === ops.length && r.results.every((x) => x.ok && x.applied));
  return ms;
});
check('every push op in the timed batches succeeded', okAll.every(Boolean));

// ── Report ─────────────────────────────────────────────────────────────────
console.log(`      ${'call'.padEnd(17)} ${'p50 ms'.padStart(8)} ${'p95 ms'.padStart(8)} ${'p99 ms'.padStart(8)} ${'budget'.padStart(7)}`);
for (const [name, x] of Object.entries(results)) {
  console.log(`      ${name.padEnd(17)} ${x.p50.toFixed(2).padStart(8)} ${x.p95.toFixed(2).padStart(8)} ${x.p99.toFixed(2).padStart(8)} ${String(BUDGET_MS[name]).padStart(7)}`);
}
for (const [name, x] of Object.entries(results)) {
  check(`${name}: p95 ${x.p95.toFixed(2)} ms within ${BUDGET_MS[name]} ms (${x.n} samples)`, x.p95 <= BUDGET_MS[name]);
}
await db.close();
done();
