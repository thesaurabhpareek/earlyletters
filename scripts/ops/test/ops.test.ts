// Pure logic of the ops scripts (Deno). The SQL they call is tested in
// supabase/tests/ops_deletion_worker.test.mjs; the scripts themselves run on Node 22.
// Run: npx -y deno@2.9.6 test --no-prompt --allow-read scripts/ops
import assert from 'node:assert/strict';
import { buildScope, categoryCounts, clocks, toCsv } from '../lib/affected.ts';
import { parseArgs } from '../lib/cli.ts';
import { chunk, compareCounts, compareSamples, drillVerdict, ledgerFileNames, parseLedger } from '../lib/drill.ts';
import { projectRefOf, resolveTarget } from '../lib/target.ts';
import { evaluateDeletion, type Gathered } from '../lib/verify.ts';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

Deno.test('args: values, flags, repeats', () => {
  const { flags, lists } = parseArgs(['--project-ref', 'abcdefghijkl', '--all', '--table', 'entries', '--table=children', '--out', 'x.csv']);
  assert.equal(flags['project-ref'], 'abcdefghijkl');
  assert.equal(flags.all, true);
  assert.deepEqual(lists.table, ['entries', 'children']);
});

Deno.test('target: project ref must match the URL; operator and ticket required', () => {
  assert.equal(projectRefOf('https://abcdefghijklmnop.supabase.co'), 'abcdefghijklmnop');
  assert.equal(projectRefOf('https://evil.example.com'), null);
  const ok = resolveTarget({ url: 'https://abcdefghijklmnop.supabase.co/', serviceKey: 'k', projectRef: 'abcdefghijklmnop', operator: 'founder', ticket: 'INC-7' });
  assert.ok(ok.target && ok.target.url === 'https://abcdefghijklmnop.supabase.co');
  const bad = resolveTarget({ url: 'https://abcdefghijklmnop.supabase.co', serviceKey: '', projectRef: 'zzzzzzzzzzzz', operator: 'Asha Parent', ticket: true });
  assert.equal(bad.target, null);
  assert.equal(bad.problems.length, 4);
});

Deno.test('incident scope: flags become a checked scope', () => {
  assert.deepEqual(buildScope({ tables: ['entries'], until: '2026-10-01T00:00:00Z' }), { scope: { tables: ['entries'], until: '2026-10-01T00:00:00Z' }, problems: [] });
  assert.deepEqual(buildScope({}).problems, ['give a scope: --all, --profile, --child, --table or --bucket']);
  assert.ok(buildScope({ tables: ['entries; drop'] }).problems[0].startsWith('unknown table'));
  assert.ok(buildScope({ profiles: ['nope'] }).problems.includes('ids must be UUIDs'));
  assert.ok(buildScope({ all: true, from: 'yesterday' }).problems.includes('from and until must be ISO times'));
});

Deno.test('incident list: CSV for the mail merge, counts per category, clocks', () => {
  const rows = [
    { profile_id: A, categories: ['letter_text', 'child_identity'], letters: 3, photos: 1, books: 1, roles: ['parent'] },
    { profile_id: B, categories: ['book_content'], letters: 0, photos: 0, books: 1, roles: null },
  ];
  const csv = toCsv(rows, new Map([[A, 'a@example.invalid'], [B, null]]));
  assert.equal(csv, `profile_id,email,categories,letters,photos,books,roles\n${A},a@example.invalid,letter_text child_identity,3,1,1,parent\n${B},,book_content,0,0,1,\n`);
  assert.deepEqual(categoryCounts(rows), { book_content: 1, child_identity: 1, letter_text: 1 });
  const c = clocks(new Date('2026-10-03T00:00:00Z'));
  assert.equal(c[0].due, '2026-10-06T00:00:00.000Z');
  assert.equal(c[2].due, '2026-12-02T00:00:00.000Z');
});

Deno.test('deletion verification: everything clean passes; any residue fails with counts only', () => {
  const clean: Gathered = { residue: [], storageResidue: [], owned: [], authUserExists: false, appleTokenRows: 0,
    request: { status: 'completed', profile_linked: false, receipt: { verified: true, apple: 'revoked' }, steps: { auth_user: 'done', posthog: 'not_applicable' } }, posthogPersonsFound: 0 };
  assert.equal(evaluateDeletion(clean).ok, true);
  assert.equal(evaluateDeletion(clean).checks.length, 9);
  const dirty = evaluateDeletion({ ...clean, residue: [{ table_schema: 'public', table_name: 'dictionary_terms', column_name: 'owner_id' }], authUserExists: true,
    request: { ...clean.request, steps: { auth_user: 'failed' } }, posthogPersonsFound: 1 });
  assert.equal(dirty.ok, false);
  assert.deepEqual(dirty.checks.filter((c) => !c.ok).map((c) => c.name.split(':')[0]), ['postgres', 'auth', 'request', 'posthog']);
  assert.ok(!JSON.stringify(dirty).includes(A));
  assert.equal(evaluateDeletion({ ...clean, request: null, posthogPersonsFound: null }).checks.length, 5);
});

Deno.test('ledger: file names per day, parsing keeps rows after the restore point, dedupes, skips junk', () => {
  assert.deepEqual(ledgerFileNames(new Date('2026-10-01T22:00:00Z'), new Date('2026-10-03T01:00:00Z')),
    ['purges/2026-10-01.jsonl', 'purges/2026-10-02.jsonl', 'purges/2026-10-03.jsonl']);
  const text = [
    JSON.stringify({ t: 'entry', id: A, at: '2026-10-01T21:00:00Z' }),
    JSON.stringify({ t: 'entry', id: B, at: '2026-10-02T10:00:00Z' }),
    JSON.stringify({ t: 'entry', id: B.toUpperCase(), at: '2026-10-02T11:00:00Z' }),
    JSON.stringify({ t: 'profile', id: A, at: '2026-10-02T12:00:00Z' }),
    JSON.stringify({ t: 'storage_object', id: 'x', at: '2026-10-02T12:00:00Z' }),
    'not json',
  ].join('\n');
  const r = parseLedger([text, ''], new Date('2026-10-01T22:00:00Z'));
  assert.deepEqual(r.rows, [{ t: 'entry', id: B }, { t: 'profile', id: A }]);
  assert.equal(r.skipped, 2);
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

Deno.test('drill: count differences, hash sample comparison, verdict against RPO and RTO', () => {
  assert.deepEqual(compareCounts({ entries: 10, children: 2, newest_entry_at: 'x' }, { entries: 9, children: 2, newest_entry_at: 'y' }), [{ table: 'entries', a: 10, b: 9 }]);
  const s = compareSamples([{ id: A, sha: '01' }, { id: B, sha: '02' }, { id: 'c', sha: '03' }, { id: 'd', sha: '04' }], [{ id: A, sha: '01' }, { id: B, sha: 'ff' }], new Set(['c']));
  assert.deepEqual(s, { sampled: 4, matched: 1, mismatched: 1, purged: 1, unexplained: 1 });
  const health = { tables_without_rls: 0, unclassified_columns: 0, functions_callable_by_anon: 0, ops_visible_to_clients: 0 };
  assert.deepEqual(drillVerdict({ health, rtoMinutes: 90, rpoHours: 12, sample: { sampled: 1, matched: 1, mismatched: 0, purged: 0, unexplained: 0 }, replayed: null }), { pass: true, findings: [] });
  const bad = drillVerdict({ health: { ...health, tables_without_rls: 1 }, rtoMinutes: 300, rpoHours: 30, sample: s, replayed: null });
  assert.equal(bad.pass, false);
  assert.equal(bad.findings.length, 5);
});
