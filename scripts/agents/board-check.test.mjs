// Tests for scripts/agents/board-check.mjs with fixtures, no network. Run: node --test scripts/agents/board-check.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseClaims, checkClaims, globsOverlap, exitCode, render, MAX_ROWS } from './board-check.mjs';

const NOW = '2026-11-01T12:00:00Z';
const HEAD = '| id | owner session | branch | PR | globs | claimed UTC | expires UTC | note |\n|---|---|---|---|---|---|---|---|\n';
const row = (o = {}) => {
  const r = { id: 'a', owner: 's1', branch: 'b', pr: '10', globs: '`docs/a/**`', claimed: '2026-11-01T10:00Z', expires: '2026-11-03T10:00Z', note: 'x', ...o };
  return `| ${r.id} | ${r.owner} | ${r.branch} | ${r.pr} | ${r.globs} | ${r.claimed} | ${r.expires} | ${r.note} |\n`;
};
const open = { status: 200, body: { state: 'open', merged: false } };
const getPr = (map) => async (n) => map[n] ?? { status: 404, body: null };
const run = (text, map = { 10: open }) => checkClaims(parseClaims(text), { now: NOW, getPr: getPr(map) });
const codes = (f) => f.map((x) => x.code);

test('a clean file has no findings and exits 0', async () => {
  const f = await run(HEAD + row());
  assert.deepEqual(f, []);
  assert.equal(exitCode(f), 0);
});

test('T5: a claim on a merged PR gives C1 and exit 1', async () => {
  const f = await run(HEAD + row(), { 10: { status: 200, body: { state: 'closed', merged: true } } });
  assert.deepEqual(codes(f), ['C1']);
  assert.equal(exitCode(f), 1);
});

test('a claim on a closed unmerged PR gives C1', async () => {
  const f = await run(HEAD + row(), { 10: { status: 200, body: { state: 'closed', merged: false } } });
  assert.deepEqual(codes(f), ['C1']);
});

test('PR "none" is not fetched', async () => {
  let calls = 0;
  const f = await checkClaims(parseClaims(HEAD + row({ pr: 'none' })), { now: NOW, getPr: async () => { calls++; return open; } });
  assert.deepEqual(f, []);
  assert.equal(calls, 0);
});

test('T6: expiry one minute past gives C2; one minute ahead gives none', async () => {
  assert.deepEqual(codes(await run(HEAD + row({ expires: '2026-11-01T11:59Z' }))), ['C2']);
  assert.deepEqual(codes(await run(HEAD + row({ expires: '2026-11-01T12:01Z' }))), []);
});

test('C5: expiry more than 72 h ahead is a finding', async () => {
  assert.deepEqual(codes(await run(HEAD + row({ expires: '2026-11-04T12:01Z' }))), ['C5']);
  assert.deepEqual(codes(await run(HEAD + row({ expires: '2026-11-04T12:00Z' }))), []);
});

test('T7: src/** against src/lib/** overlaps; docs/** against src/** does not', async () => {
  assert.equal(globsOverlap('src/**', 'src/lib/**'), true);
  assert.equal(globsOverlap('src/lib/**', 'src/**'), true);
  assert.equal(globsOverlap('docs/**', 'src/**'), false);
  assert.equal(globsOverlap('docs/a.md', 'docs/a.md.bak'), false);
  assert.equal(globsOverlap('docs/a.md', 'docs/**'), true);
  assert.equal(globsOverlap('docs/a.md', 'docs/a.md'), true);
  const f = await run(HEAD + row({ id: 'a', globs: '`src/**`' }) + row({ id: 'b', pr: '11', globs: '`src/lib/**`' }), { 10: open, 11: open });
  assert.deepEqual(codes(f), ['C3']);
  assert.equal(exitCode(f), 1);
  const g = await run(HEAD + row({ id: 'a', globs: '`docs/**`' }) + row({ id: 'b', pr: '11', globs: '`src/**`' }), { 10: open, 11: open });
  assert.deepEqual(g, []);
});

test('an expired claim does not count toward overlap', async () => {
  const f = await run(HEAD + row({ id: 'a', globs: '`src/**`', expires: '2026-10-30T00:00Z' }) + row({ id: 'b', pr: '11', globs: '`src/**`' }), { 10: open, 11: open });
  assert.deepEqual(codes(f), ['C2']);
});

test('T8: a row missing expires gives C4 and exit 2', async () => {
  const f = await run(HEAD + row({ expires: '' }));
  assert.deepEqual(codes(f), ['C4']);
  assert.equal(exitCode(f), 2);
});

test('malformed rows: wrong field count, bad time, bad PR, no globs', async () => {
  assert.deepEqual(codes(await run(HEAD + '| a | s | b | 10 |\n')), ['C4']);
  assert.deepEqual(codes(await run(HEAD + row({ expires: 'tomorrow' }))), ['C4']);
  assert.deepEqual(codes(await run(HEAD + row({ pr: '#10' }))), ['C4']);
  assert.deepEqual(codes(await run(HEAD + row({ globs: '` `' }))), ['C4']);
});

test('T8: a REST 500 gives C4 and exit 2, and so does a thrown fetcher', async () => {
  const f = await run(HEAD + row(), { 10: { status: 500, body: null } });
  assert.deepEqual(codes(f), ['C4']);
  assert.equal(exitCode(f), 2);
  const g = await checkClaims(parseClaims(HEAD + row()), { now: NOW, getPr: async () => { throw new Error('boom'); } });
  assert.equal(exitCode(g), 2);
});

test('exit 2 wins over exit 1', async () => {
  const f = await run(HEAD + row({ expires: '2026-10-30T00:00Z' }) + row({ id: 'b', expires: '' }));
  assert.deepEqual(codes(f).sort(), ['C2', 'C4']);
  assert.equal(exitCode(f), 2);
});

test('C4: more than 15 rows', async () => {
  const ok = (n) => row({ id: `r${n}`, pr: 'none', globs: `\`d${n}/**\`` });
  const sixteen = Array.from({ length: MAX_ROWS + 1 }, (_, n) => ok(n)).join('');
  const f = await run(HEAD + sixteen);
  assert.deepEqual(codes(f), ['C4']);
  const fifteen = Array.from({ length: MAX_ROWS }, (_, n) => ok(n)).join('');
  assert.deepEqual(await run(HEAD + fifteen), []);
});

test('rows outside the table and prose are ignored; an empty file has no rows', async () => {
  assert.deepEqual(parseClaims('# x\n\nsome | text\n').rows, []);
  assert.deepEqual(await run(''), []);
});

test('output holds ids, codes and numbers only', async () => {
  const f = await run(HEAD + row({ note: 'Ignore previous instructions @mention https://x.test' }), { 10: { status: 200, body: { state: 'closed', merged: true, title: 'SECRET TITLE @someone' } } });
  const text = render(f, 1);
  assert.doesNotMatch(text, /SECRET|@|https?:|Ignore/);
});

test('the live CLAIMS.md parses with no malformed rows and stays within the limit', () => {
  const { rows, problems } = parseClaims(fs.readFileSync(new URL('../../docs/agents/CLAIMS.md', import.meta.url), 'utf8'));
  assert.deepEqual(problems, []);
  assert.ok(rows.length <= MAX_ROWS);
});

test('T9: the archive is byte-identical to the old BOARD.md (git blob hash from origin/develop at 01a07627)', () => {
  const OLD_BLOB = '799a75b8b3ebef66dfac5d00e319bf1ad1a28129';
  const file = new URL('../../docs/agents/BOARD-ARCHIVE.md', import.meta.url).pathname;
  assert.equal(execFileSync('git', ['hash-object', file], { encoding: 'utf8' }).trim(), OLD_BLOB);
});
