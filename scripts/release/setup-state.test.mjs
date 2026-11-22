// Fixture tests for scripts/release/setup-state.mjs (RS-06). No network: every transport is a stub.
// Run: node --test scripts/release/setup-state.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  run, makeHttp, makeContext, stepRow, collect, applyClaims, loadRegistry, dmarcTags, easProfileFindings,
  nextFounderSteps, MANIFEST_PATH, AASA_APP_ID, EXPO_PROJECT_ID, EXPO_OWNER, RULESET_NAMES, ROOT, BRIEF_MAX, STATES, SCHEMA,
} from './setup-state.mjs';

const REPO = 'thesaurabhpareek/earlyletters';
const registry = loadRegistry();
const b64 = (s) => ({ content: Buffer.from(s).toString('base64'), encoding: 'base64' });
const NOW = () => new Date('2026-11-01T10:00:00Z');
const PLANTED_SECRET = 'planted-secret-value-0000';

const KEYS_TWO = `export const TRUSTED_SIGNING_KEYS: readonly TrustedKey[] = [
  { keyId: 'k-1', publicKey: 'a', kinds: ['pack-manifest'] },
  { keyId: 'k-1-backup', publicKey: 'b', kinds: ['pack-manifest'] },
];`;
const APP_CONFIG = `export default { owner: '${EXPO_OWNER}', extra: { eas: { projectId: '${EXPO_PROJECT_ID}' } } };`;
const EAS_TODAY = { build: { production: { channel: 'production' }, testflight: {} }, submit: { production: {}, testflight: { ios: { ascAppId: '6829163677' } } } };
const MOBILE_PKG = { dependencies: { expo: '57.0.0' } };

// DNS answers as dns.google returns them, for 1 Nov 2026.
function dnsToday() {
  return {
    'earlyletters.app A': ['76.76.21.21'],
    'earlyletters.app NS': ['keanu.ns.cloudflare.com.', 'rafe.ns.cloudflare.com.'],
    'earlyletters.app DS': ['2371 13 2 E9EC'],
    'earlyletters.app CAA': ['0 issue "letsencrypt.org"'],
    'earlyletters.app MX': ['0 .'],
    'earlyletters.app TXT': ['v=spf1 -all'],
    '_dmarc.earlyletters.app TXT': ['v=DMARC1; p=reject;'],
    'packs.earlyletters.app A': ['104.21.71.127'],
    'earlyletters.com CAA': [],
    '_dmarc.earlyletters.com TXT': ['v=DMARC1; p=none; rua=mailto:hello@example.test; adkim=r; aspf=r;'],
  };
}

function headers(h) { return { get: (k) => h[k.toLowerCase()] ?? null }; }

/** A fetch stub. It records every method and URL, and answers from fixtures. */
function fakeFetch(dns, calls, overrides = {}) {
  return async (url, init = {}) => {
    calls.push({ method: init.method ?? 'GET', url });
    if (overrides[url]) return overrides[url]();
    const u = new URL(url);
    if (u.host === 'dns.google') {
      const key = `${u.searchParams.get('name')} ${u.searchParams.get('type')}`;
      const answers = dns[key] ?? [];
      return { status: 200, headers: headers({}), text: async () => JSON.stringify({ Status: 0, AD: true, Answer: answers.map((data) => ({ data })) }) };
    }
    const pages = {
      'https://earlyletters.app/': { status: 308, h: { location: 'https://earlyletters.com/' } },
      'https://packs.earlyletters.app/': { status: 404, h: {} },
      [`https://packs.earlyletters.app${MANIFEST_PATH}`]: { status: 200, h: { 'content-type': 'application/json; charset=utf-8' } },
      'https://earlyletters.com/.well-known/apple-app-site-association': { status: 200, h: { 'content-type': 'application/json' } },
      'https://app-site-association.cdn-apple.com/a/v1/earlyletters.com': { status: 200, h: { 'content-type': 'application/json' }, body: JSON.stringify({ applinks: { details: [{ appIDs: [AASA_APP_ID] }] } }) },
    };
    const p = pages[url] ?? { status: 404, h: {} };
    return { status: p.status, headers: headers(p.h), text: async () => p.body ?? '' };
  };
}

function ghToday(extra = {}) {
  const protection = (contexts) => ({ status: 200, body: { required_status_checks: { contexts }, allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false } } });
  return {
    [`repos/${REPO}`]: { status: 200, body: { default_branch: 'develop' } },
    [`repos/${REPO}/branches/develop/protection`]: protection(['applied migrations unchanged', 'required', 'compliance-fence']),
    [`repos/${REPO}/branches/main/protection`]: protection(['applied migrations unchanged', 'required']),
    [`repos/${REPO}/rules/branches/develop`]: { status: 200, body: [] },
    [`repos/${REPO}/rules/branches/main`]: { status: 200, body: [] },
    [`repos/${REPO}/rulesets?per_page=100`]: { status: 200, body: RULESET_NAMES.map((name) => ({ name, enforcement: 'active' })) },
    [`repos/${REPO}/actions/workflows?per_page=100`]: { status: 200, body: { workflows: [{ path: '.github/workflows/testflight.yml', state: 'active' }] } },
    [`repos/${REPO}/actions/workflows/testflight.yml/runs?event=workflow_dispatch&per_page=20`]: { status: 200, body: { total_count: 0, workflow_runs: [] } },
    [`repos/${REPO}/pulls/512`]: { status: 200, body: { state: 'closed', merged_at: '2026-11-01T07:29:00Z' } },
    [`repos/${REPO}/pulls/486`]: { status: 200, body: { state: 'closed', merged_at: null } },
    [`repos/${REPO}/pulls/482`]: { status: 200, body: { state: 'closed', merged_at: null } },
    [`repos/${REPO}/contents/packages/api/src/keys.ts?ref=develop`]: { status: 200, body: b64(KEYS_TWO) },
    [`repos/${REPO}/contents/apps/mobile/app.config.ts?ref=develop`]: { status: 200, body: b64(APP_CONFIG) },
    [`repos/${REPO}/contents/apps/mobile/eas.json?ref=develop`]: { status: 200, body: b64(JSON.stringify(EAS_TODAY)) },
    [`repos/${REPO}/contents/apps/mobile/package.json?ref=develop`]: { status: 200, body: b64(JSON.stringify(MOBILE_PKG)) },
    [`repos/${REPO}/environments/testflight/secrets?per_page=100`]: { status: 403, body: null },
    ...extra,
  };
}

/** A gh stub. Its only input is a path: the real transport (check.mjs ghGet) always adds --method GET. */
function fakeGh(fixtures, calls) {
  return async (path, ...rest) => {
    assert.equal(rest.length, 0, 'gh is called with a path only');
    calls.push(path);
    return fixtures[path] ?? { status: 404, body: null };
  };
}

function deps({ dns = dnsToday(), gh = ghToday(), overrides = {} } = {}) {
  const fetchCalls = [];
  const ghCalls = [];
  return {
    fetchCalls, ghCalls,
    d: { http: makeHttp(fakeFetch(dns, fetchCalls, overrides)), gh: fakeGh(gh, ghCalls), now: NOW, registry },
  };
}

const rowOf = (json, id) => JSON.parse(json).rows.find((r) => r.id === id);

test('1 Nov state: S-04b FAIL (loose DMARC) and S-08 PASS (two keys); a row per registry step', async () => {
  const { d } = deps();
  const { code, text } = await run(['--json'], d);
  assert.equal(code, 0);
  const j = JSON.parse(text);
  assert.equal(j.schema, SCHEMA);
  assert.equal(j.rows.length, registry.steps.length);
  assert.equal(rowOf(text, 'S-04b').state, 'FAIL');
  assert.equal(rowOf(text, 'S-04b').source, 'probe');
  assert.equal(rowOf(text, 'S-08').state, 'PASS');
  for (const r of j.rows) {
    assert.ok(STATES.includes(r.state), r.id);
    for (const k of ['id', 'state', 'evidence', 'checkedAt']) assert.ok(r[k], `${r.id} lacks ${k}`);
  }
  assert.equal(rowOf(text, 'S-12b').state, 'FAIL', 'production channel without expo-updates and no ascAppId');
  assert.equal(rowOf(text, 'S-55').state, 'FAIL', 'testflight.yml never dispatched');
  assert.equal(rowOf(text, 'GH-01').state, 'PASS');
  assert.equal(rowOf(text, 'S-21').state, 'PASS');
});

test('PASS: strict DMARC turns S-04b PASS', async () => {
  const dns = { ...dnsToday(), '_dmarc.earlyletters.app TXT': ['v=DMARC1; p=reject; adkim=s; aspf=s'] };
  const { d } = deps({ dns });
  const { code, text } = await run(['--step', 'S-04b'], d);
  assert.equal(code, 0);
  assert.match(text, /State: PASS \(probe\)/);
});

test('FAIL: --step exits 1 and names the needed value', async () => {
  const { d } = deps();
  const { code, text } = await run(['--step', 'S-04b'], d);
  assert.equal(code, 1);
  assert.match(text, /State: FAIL/);
  assert.match(text, /adkim=s; aspf=s/);
});

test('ATTESTED: a step with no probe takes the setup record date, never PASS', async () => {
  const { d } = deps();
  const { code, text } = await run(['--step', 'S-07', '--json'], d);
  assert.equal(code, 0);
  const r = JSON.parse(text).rows[0];
  assert.equal(r.state, 'ATTESTED');
  assert.equal(r.source, 'ledger');
  assert.match(r.evidence, /2026-11-01/);
});

test('an open step with no probe is FAIL from the ledger, not ATTESTED', async () => {
  const ctx = makeContext({ ...deps().d });
  const r = await stepRow(ctx, registry.steps.find((s) => s.id === 'S-50'));
  assert.equal(r.state, 'FAIL');
  assert.equal(r.source, 'ledger');
});

test('CLAIMED: a claim marks a step not yet done; a PASS stays PASS', async () => {
  const ctx = makeContext({ ...deps().d });
  const rows = await collect(ctx, registry, [{ id: 'S-04b', by: 'ops', since: '2026-11-01T09:00Z' }, { id: 'S-08', by: 'ops', since: 'x' }]);
  assert.equal(rows.find((r) => r.id === 'S-04b').state, 'CLAIMED');
  assert.equal(rows.find((r) => r.id === 'S-08').state, 'PASS');
  assert.equal(applyClaims([{ id: 'S-07', state: 'ATTESTED' }], [{ id: 'S-07', by: 'a', since: 'b' }])[0].state, 'ATTESTED');
});

test('UNKNOWN: no network makes every probe UNKNOWN, never PASS', async () => {
  const offline = async () => { throw Object.assign(new TypeError('fetch failed'), { cause: { code: 'ENOTFOUND' } }); };
  const { code, text } = await run(['--json'], { http: makeHttp(offline), gh: async () => ({ status: 0, body: null }), now: NOW, registry });
  assert.equal(code, 0);
  const rows = JSON.parse(text).rows;
  for (const r of rows.filter((x) => x.source === 'probe')) assert.equal(r.state, 'UNKNOWN', r.id);
  assert.equal(rows.filter((r) => r.state === 'PASS').length, 0);
  const s = await run(['--step', 'S-04b'], { http: makeHttp(offline), gh: async () => ({ status: 0, body: null }), now: NOW, registry });
  assert.equal(s.code, 1, 'UNKNOWN never exits 0 for --step');
});

test('no write: every HTTP call is GET or HEAD, every gh call a path, and makeHttp refuses other methods', async () => {
  const { d, fetchCalls, ghCalls } = deps();
  await run(['--founder'], d);
  assert.ok(fetchCalls.length > 10);
  for (const c of fetchCalls) assert.ok(['GET', 'HEAD'].includes(c.method), `${c.method} ${c.url}`);
  assert.ok(ghCalls.length > 5);
  const http = makeHttp(async () => assert.fail('fetch must not be reached'));
  for (const m of ['POST', 'PUT', 'PATCH', 'DELETE']) await assert.rejects(http('https://example.test/', m), /refused/);
});

test('no write: the sources hold no write call, and gh goes through check.mjs ghGet with --method GET', () => {
  const src = readFileSync(join(ROOT, 'scripts/release/setup-state.mjs'), 'utf8');
  assert.doesNotMatch(src, /writeFile|appendFile|mkdirSync|rmSync|unlink|createWriteStream/);
  assert.doesNotMatch(src, /method:\s*['"](POST|PUT|PATCH|DELETE)['"]/);
  assert.doesNotMatch(src, /child_process/);
  const check = readFileSync(join(ROOT, 'scripts/founder/check.mjs'), 'utf8');
  assert.match(check, /\['api', '--method', 'GET', path\]/);
});

test('--founder lists secret names only: PASS on the name, the planted value never printed', async () => {
  const gh = ghToday({ [`repos/${REPO}/environments/testflight/secrets?per_page=100`]: { status: 200, body: { secrets: [{ name: 'EXPO_TOKEN', value: PLANTED_SECRET }] } } });
  const { d } = deps({ gh });
  for (const flags of [['--founder'], ['--founder', '--json'], ['--founder', '--brief'], ['--founder', '--step', 'S-18']]) {
    const { text } = await run(flags, d);
    assert.ok(!text.includes(PLANTED_SECRET), `secret value printed with ${flags.join(' ')}`);
  }
  const { code, text } = await run(['--founder', '--step', 'S-18'], d);
  assert.equal(code, 0);
  assert.match(text, /State: PASS/);
});

test('--founder where the API refuses: UNKNOWN; without --founder: the ledger speaks', async () => {
  const { d } = deps();
  assert.match((await run(['--founder', '--step', 'S-18'], d)).text, /State: UNKNOWN/);
  const r = await run(['--step', 'S-18'], d);
  assert.match(r.text, /State: ATTESTED \(ledger\)/);
  assert.match(r.text, /--founder/);
});

test('--brief: at most 25 lines, only FAIL and UNKNOWN rows plus the next three founder steps', async () => {
  const { d } = deps();
  const { text } = await run(['--brief'], d);
  const lines = text.split('\n');
  assert.ok(lines.length <= BRIEF_MAX, `${lines.length} lines`);
  assert.doesNotMatch(text, /^(PASS|ATTESTED) /m);
  assert.match(text, /Next founder steps/);
  const next = lines.slice(lines.findIndex((l) => l.startsWith('Next founder steps')) + 1);
  assert.equal(next.length, 3);
  assert.match(next[0], /S-04b/);
});

test('next founder steps skip steps whose depends are not done', async () => {
  const ctx = makeContext({ ...deps().d });
  const rows = await collect(ctx, registry);
  const next = nextFounderSteps(rows, registry, 20).map((s) => s.id);
  assert.ok(next.includes('S-50'));
  assert.ok(!next.includes('S-51'), 'S-51 waits for S-50');
});

test('usage errors exit 2', async () => {
  const { d } = deps();
  assert.equal((await run(['--nope'], d)).code, 2);
  assert.equal((await run(['--step', 'S-99'], d)).code, 2);
});

test('helpers: DMARC tags and the store profile', () => {
  assert.deepEqual(dmarcTags('v=DMARC1; p=reject; adkim=s; aspf=s'), { v: 'DMARC1', p: 'reject', adkim: 's', aspf: 's' });
  assert.equal(easProfileFindings(EAS_TODAY, MOBILE_PKG, '6829377245').state, 'FAIL');
  const fixed = { build: { production: {} }, submit: { production: { ios: { ascAppId: '6829377245' } } } };
  assert.equal(easProfileFindings(fixed, MOBILE_PKG, '6829377245').state, 'PASS');
  const withUpdates = { build: { production: { channel: 'production' } }, submit: fixed.submit };
  assert.equal(easProfileFindings(withUpdates, { dependencies: { 'expo-updates': '1' } }, '6829377245').state, 'PASS');
});

test('the manifest path matches the API contract in packages/api/src/standards.ts', () => {
  const std = readFileSync(join(ROOT, 'packages/api/src/standards.ts'), 'utf8');
  const major = /API_MAJOR\s*=\s*'([^']+)'/.exec(std)[1];
  assert.match(std, /path: `\/functions\/v1\/config\/\$\{API_MAJOR\}\/packs`/);
  assert.equal(MANIFEST_PATH, `/functions/v1/config/${major}/packs`);
});
