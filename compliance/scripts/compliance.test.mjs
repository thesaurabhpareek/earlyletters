// Offline tests for the regulatory watch and the geo loader (CR-26). No network: fetch is injected.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildUrl, normalize, dedupe, loadTopics, watch, record } from './regulatory-watch.mjs';
import { parseLine, validate, psqlScript } from './load-geo-ip.mjs';

test('watch-topics.json is valid and every topic has terms and agency slugs', () => {
  const cfg = loadTopics();
  assert.ok(cfg.topics.length >= 3);
  assert.ok(cfg.topics.some((t) => t.id === 'coppa'));
  assert.ok(cfg.topics.some((t) => t.agencies.includes('foreign-assets-control-office')));
});

test('buildUrl uses the Federal Register parameter names', () => {
  const u = new URL(buildUrl('COPPA', ['federal-trade-commission'], '2026-10-01'));
  assert.equal(u.origin + u.pathname, 'https://www.federalregister.gov/api/v1/documents.json');
  assert.equal(u.searchParams.get('conditions[term]'), 'COPPA');
  assert.deepEqual(u.searchParams.getAll('conditions[agencies][]'), ['federal-trade-commission']);
  assert.equal(u.searchParams.get('conditions[publication_date][gte]'), '2026-10-01');
  assert.equal(u.searchParams.get('order'), 'newest');
  assert.ok(u.searchParams.getAll('fields[]').includes('html_url'));
});

test('normalize keeps only well-formed https documents and caps lengths', () => {
  const out = normalize([
    { document_number: '2025-05904', title: "Children's Online Privacy Protection Rule", publication_date: '2025-04-22',
      html_url: 'https://www.federalregister.gov/documents/2025/04/22/2025-05904/x', type: 'Rule' },
    { document_number: 'x', title: 'no url' },
    { document_number: 'y', title: 'http', html_url: 'http://insecure' },
    { document_number: 'z', title: 'T'.repeat(900), html_url: 'https://ok', publication_date: 'bad' },
  ], 'coppa');
  assert.equal(out.length, 2);
  assert.equal(out[0].source, 'federal_register');
  assert.equal(out[1].title.length, 500);
  assert.equal(out[1].published_on, null);
});

test('dedupe keeps one item per document and topic, newest first', () => {
  const a = { source: 'federal_register', external_id: '1', topic: 't', published_on: '2026-01-01' };
  const b = { ...a, external_id: '2', published_on: '2026-02-01' };
  assert.deepEqual(dedupe([a, b, a]).map((i) => i.external_id), ['2', '1']);
});

test('watch asks once per topic term and fails loudly on an API error', async () => {
  const calls = [];
  const fake = async (url) => { calls.push(url); return { ok: true, json: async () => ({ results: [] }) }; };
  const cfg = loadTopics();
  const r = await watch({ since: '2026-10-01', fetchImpl: fake });
  assert.equal(calls.length, cfg.topics.reduce((n, t) => n + t.terms.length, 0));
  assert.equal(r.since, '2026-10-01');
  await assert.rejects(watch({ since: '2026-10-01', fetchImpl: async () => ({ ok: false, status: 503 }) }), /503/);
});

test('record posts to the service RPC with the items', async () => {
  let seen;
  const n = await record([{ external_id: '1' }], { url: 'https://p.supabase.co/', key: 'k',
    fetchImpl: async (url, init) => { seen = { url, init }; return { ok: true, json: async () => 1 }; } });
  assert.equal(n, 1);
  assert.equal(seen.url, 'https://p.supabase.co/rest/v1/rpc/ops_regwatch_record');
  assert.deepEqual(JSON.parse(seen.init.body), { p_items: [{ external_id: '1' }] });
});

test('parseLine accepts IPv4 and IPv6 ranges and refuses bad ones', () => {
  assert.deepEqual(parseLine('192.0.2.0,192.0.2.255,KP'), { start: '192.0.2.0', end: '192.0.2.255', cc: 'KP' });
  assert.ok(parseLine('2001:db8::,2001:db8:ffff:ffff:ffff:ffff:ffff:ffff,IR'));
  assert.ok(parseLine('"198.51.100.0","198.51.100.255","US"'));
  assert.equal(parseLine('192.0.2.9,192.0.2.1,US'), null, 'start after end');
  assert.equal(parseLine('192.0.2.0,2001:db8::,US'), null, 'mixed families');
  assert.equal(parseLine('192.0.2.0,192.0.2.1,usa'), null, 'bad code');
  assert.equal(parseLine('2001:db8::ffff,2001:db8::1,US'), null, 'IPv6 start after end');
});

test('validate refuses a short file, too many bad rows and duplicate starts', () => {
  const good = Array.from({ length: 300 }, (_, i) => `10.${i >> 8}.${i & 255}.0,10.${i >> 8}.${i & 255}.255,US`).join('\n');
  assert.deepEqual(validate(good, { minRows: 300 }).problems, []);
  assert.match(validate(good, { minRows: 1000 }).problems.join(), /only 300/);
  assert.match(validate(good + '\nbad\nbad', { minRows: 1, maxBadRatio: 0.001 }).problems.join(), /bad rows/);
  assert.match(validate(good + '\n10.0.0.0,10.0.0.1,US', { minRows: 1 }).problems.join(), /duplicate/);
});

test('psqlScript loads in one transaction, checks the count and refuses an unsafe version', () => {
  const s = psqlScript('/tmp/x.csv', '2026-11', 42);
  assert.match(s, /^\\set ON_ERROR_STOP on\nbegin;/);
  assert.match(s, /row count mismatch/);
  assert.match(s, /'2026-11', 42/);
  assert.match(s, /commit;\n$/);
  assert.throws(() => psqlScript('/tmp/x.csv', "x'; drop table y; --", 1));
});
