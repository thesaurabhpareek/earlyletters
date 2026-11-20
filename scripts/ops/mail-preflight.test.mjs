// Offline tests for scripts/ops/mail-preflight.mjs (BL-788, NX-31-R20). Every DNS answer is a fixture.
// Run: node --test scripts/ops/mail-preflight.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runPreflight, main, parseArgs, dmarcTags, format } from './mail-preflight.mjs';

const KEY = 'p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDfakefakefakefakefake';
const GOOD = {
  txt: {
    '_dmarc.example.test': [['v=DMARC1; p=quarantine; rua=mailto:dmarc@example.test; adkim=r; aspf=r']],
    'resend._domainkey.example.test': [[`v=DKIM1; k=rsa; `, KEY]],
    'send.example.test': [['v=spf1 include:amazonses.com ~all']],
    'example.test': [['v=spf1 include:_spf.porkbun.com ~all']],
  },
  mx: { 'send.example.test': [{ exchange: 'feedback-smtp.us-east-1.amazonses.com', priority: 10 }] },
};
const fake = (zone) => ({
  resolveTxt: async (n) => zone.txt?.[n] ?? [],
  resolveMx: async (n) => zone.mx?.[n] ?? [],
});
const withZone = (patch) => ({ txt: { ...GOOD.txt, ...(patch.txt ?? {}) }, mx: { ...GOOD.mx, ...(patch.mx ?? {}) } });
const status = (res, id) => res.rows.find((r) => r.id === id).status;
const run = (zone, policy = 'quarantine') => runPreflight({ domain: 'example.test', policy, resolver: fake(zone) });

test('[NX-31-R20] public preflight passes DNS only when DMARC policy, DKIM, SPF and bounce MX are all right', async () => {
  const res = await run(GOOD);
  assert.equal(res.ok, true);
  for (const id of ['dmarc', 'dkim', 'spf', 'bounce-mx', 'root-spf']) assert.equal(status(res, id), 'PASS', id);
});

test('[NX-31-R20] public preflight fails without DMARC policy', async () => {
  assert.equal(status(await run(withZone({ txt: { '_dmarc.example.test': [] } })), 'dmarc'), 'FAIL');
  // today's live record is p=none: it fails when ops chose quarantine, passes when ops chose none
  const none = withZone({ txt: { '_dmarc.example.test': [['v=DMARC1; p=none; rua=mailto:hello@example.test']] } });
  assert.equal(status(await run(none, 'quarantine'), 'dmarc'), 'FAIL');
  assert.equal(status(await run(none, 'none'), 'dmarc'), 'PASS');
  // no chosen policy given: never a pass
  assert.equal(status(await run(GOOD, null), 'dmarc'), 'FAIL');
});

test('[NX-31-R20] DMARC with no rua address, or two records, fails', async () => {
  assert.equal(status(await run(withZone({ txt: { '_dmarc.example.test': [['v=DMARC1; p=quarantine']] } })), 'dmarc'), 'FAIL');
  const two = [['v=DMARC1; p=quarantine; rua=mailto:a@example.test'], ['v=DMARC1; p=none; rua=mailto:a@example.test']];
  assert.equal(status(await run(withZone({ txt: { '_dmarc.example.test': two } })), 'dmarc'), 'FAIL');
});

test('[NX-31-R20] missing or empty DKIM key fails; split TXT chunks are joined', async () => {
  assert.equal(status(await run(withZone({ txt: { 'resend._domainkey.example.test': [] } })), 'dkim'), 'FAIL');
  assert.equal(status(await run(withZone({ txt: { 'resend._domainkey.example.test': [['v=DKIM1; p=']] } })), 'dkim'), 'FAIL');
  const split = withZone({ txt: { 'resend._domainkey.example.test': [['v=DKIM1; p=MIGfMA0GCSqGSIb3', 'DQEBAQUAA4GNADCBiQKBgQDfake']] } });
  assert.equal(status(await run(split), 'dkim'), 'PASS');
});

test('[NX-31-R20] SPF must exist once on the sending subdomain and include amazonses.com', async () => {
  assert.equal(status(await run(withZone({ txt: { 'send.example.test': [] } })), 'spf'), 'FAIL');
  assert.equal(status(await run(withZone({ txt: { 'send.example.test': [['v=spf1 -all']] } })), 'spf'), 'FAIL');
  const two = [['v=spf1 include:amazonses.com ~all'], ['v=spf1 include:amazonses.com -all']];
  assert.equal(status(await run(withZone({ txt: { 'send.example.test': two } })), 'spf'), 'FAIL');
});

test('[NX-31-R20] missing bounce MX fails; two root SPF records fail; no root SPF is only a manual row', async () => {
  assert.equal(status(await run(withZone({ mx: { 'send.example.test': [] } })), 'bounce-mx'), 'FAIL');
  const two = [['v=spf1 -all'], ['v=spf1 include:x.test -all']];
  assert.equal(status(await run(withZone({ txt: { 'example.test': two } })), 'root-spf'), 'FAIL');
  const res = await run(withZone({ txt: { 'example.test': [] } }));
  assert.equal(status(res, 'root-spf'), 'MANUAL');
  assert.equal(res.ok, true);
});

test('[NX-31-R20] things DNS cannot show are MANUAL rows, never a pass', async () => {
  const res = await run(GOOD);
  const ids = res.rows.filter((r) => r.status === 'MANUAL').map((r) => r.id);
  for (const id of ['resend-verified', 'tracking-off', 'smtp-prod', 'rate-limit', 'code-expiry', 'inboxes']) assert.ok(ids.includes(id), id);
  assert.match(format(res), /not yet "ready"/);
});

test('a resolver that throws becomes a FAIL row, not a crash', async () => {
  const boom = { resolveTxt: async () => { throw Object.assign(new Error('x'), { code: 'ECONNREFUSED' }); }, resolveMx: async () => [] };
  const res = await runPreflight({ domain: 'example.test', policy: 'none', resolver: boom });
  assert.equal(res.ok, false);
  assert.equal(status(res, 'dmarc'), 'FAIL');
});

test('a blind resolver (the control lookup is empty) fails once instead of printing false "no record" rows', async () => {
  const blind = { ...fake(GOOD), canary: async () => false };
  const res = await runPreflight({ domain: 'example.test', policy: 'quarantine', resolver: blind });
  assert.equal(res.ok, false);
  assert.equal(res.rows.length, 1);
  assert.equal(res.rows[0].id, 'resolver');
});

test('arguments, exit codes and output', async () => {
  assert.deepEqual(parseArgs(['--policy', 'bogus']).errors, ['--policy must be one of none, quarantine, reject']);
  assert.ok(parseArgs(['--domain', 'not a domain']).errors.length);
  assert.ok(parseArgs(['--nope']).errors.length);
  assert.deepEqual(dmarcTags('v=DMARC1; p=none; rua=mailto:a@b.c'), { v: 'DMARC1', p: 'none', rua: 'mailto:a@b.c' });
  const out = [];
  const w = (s) => out.push(s);
  assert.equal(await main(['--domain', 'example.test', '--policy', 'quarantine'], { resolver: fake(GOOD), write: w }), 0);
  assert.equal(await main(['--domain', 'example.test'], { resolver: fake(GOOD), write: w }), 1);
  assert.equal(await main(['--policy', 'x'], { resolver: fake(GOOD), write: w }), 2);
  assert.equal(await main(['--help'], { write: w }), 0);
  const json = [];
  await main(['--domain', 'example.test', '--policy', 'quarantine', '--json'], { resolver: fake(GOOD), write: (s) => json.push(s) });
  assert.equal(JSON.parse(json[0]).ok, true);
});
