#!/usr/bin/env node
// Mail readiness preflight, DNS half (BL-788, NX-31-R20, gate G7). Read-only and credential-free:
// it only looks up public DNS records for the sender domain and prints PASS, FAIL or MANUAL per row.
// It sends no mail, calls no vendor API and changes nothing. Node built-ins only.
//
//   node scripts/ops/mail-preflight.mjs --policy quarantine            # check earlyletters.com
//   node scripts/ops/mail-preflight.mjs --domain example.com --policy none --json
//
// Exit codes: 0 every DNS check passed (MANUAL rows still need a human, see docs/ops/MAIL-PREFLIGHT.md),
//             1 at least one DNS check failed, 2 usage mistake.
//
// What it cannot check (no credentials, by design): Resend dashboard state, tracking settings, Supabase
// SMTP, the rate limit, code expiry, and delivery to real inboxes. Those print as MANUAL.
import { fileURLToPath } from 'node:url';
import { resolve as pathResolve } from 'node:path';
import dns from 'node:dns/promises';

export const DEFAULT_DOMAIN = 'earlyletters.com';
export const POLICIES = ['none', 'quarantine', 'reject'];
// Resend's DKIM selector and sending (bounce) subdomain as recorded in docs/ops/DOMAINS.md section 2.
export const DKIM_SELECTOR = 'resend';
export const SEND_SUBDOMAIN = 'send';

const pass = (id, label, detail) => ({ id, label, status: 'PASS', detail });
const fail = (id, label, detail) => ({ id, label, status: 'FAIL', detail });
const manual = (id, label, detail) => ({ id, label, status: 'MANUAL', detail });

/** The system resolver, wrapped so that "no such record" is an empty answer and anything else throws. */
export function systemResolver() {
  const soft = new Set(['ENODATA', 'ENOTFOUND', 'NXDOMAIN']);
  const wrap = (fn) => async (name) => {
    try {
      return await fn(name);
    } catch (e) {
      if (soft.has(e && e.code)) return [];
      throw e;
    }
  };
  return {
    resolveTxt: wrap((n) => dns.resolveTxt(n)),
    resolveMx: wrap((n) => dns.resolveMx(n)),
    // A resolver that answers "no data" for everything (a sandbox, a captive network) would make every
    // row read "no record". google.com always publishes TXT records, so an empty answer means the lookup path is blind.
    canary: async () => (await dns.resolveTxt('google.com').catch(() => [])).length > 0,
  };
}

const joinTxt = (chunks) => (Array.isArray(chunks) ? chunks.join('') : String(chunks));

async function txt(resolver, name) {
  return (await resolver.resolveTxt(name)).map(joinTxt);
}

/** Tags of a DMARC record: "v=DMARC1; p=none; rua=mailto:x" becomes { v: 'DMARC1', p: 'none', rua: 'mailto:x' }. */
export function dmarcTags(record) {
  const tags = {};
  for (const part of record.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) tags[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim();
  }
  return tags;
}

async function checkDmarc(resolver, domain, policy) {
  const name = `_dmarc.${domain}`;
  const records = (await txt(resolver, name)).filter((r) => /^\s*v=DMARC1/i.test(r));
  if (records.length === 0) return fail('dmarc', 'DMARC record', `no DMARC TXT record at ${name}`);
  if (records.length > 1) return fail('dmarc', 'DMARC record', `${records.length} DMARC records at ${name}; there must be exactly one`);
  const tags = dmarcTags(records[0]);
  const found = (tags.p || '').toLowerCase();
  if (!POLICIES.includes(found)) return fail('dmarc', 'DMARC record', `record has no valid p= policy: ${records[0]}`);
  if (!policy) {
    return fail('dmarc', 'DMARC policy is the one ops chose', `${name} says p=${found}, but no chosen policy was given (--policy none|quarantine|reject). The policy is a decision; see docs/ops/MAIL-PREFLIGHT.md section 3`);
  }
  if (found !== policy) {
    return fail('dmarc', 'DMARC policy is the one ops chose', `${name} says p=${found}; the chosen policy is p=${policy}`);
  }
  if (!tags.rua) return fail('dmarc', 'DMARC reports', `p=${found} matches, but there is no rua= address, so nobody receives the aggregate reports`);
  return pass('dmarc', 'DMARC policy is the one ops chose', `${name}: ${records[0]}`);
}

async function checkDkim(resolver, domain) {
  const name = `${DKIM_SELECTOR}._domainkey.${domain}`;
  const records = await txt(resolver, name);
  const key = records.find((r) => /(^|;)\s*p=\s*[A-Za-z0-9+/=]{16,}/.test(r));
  if (key) return pass('dkim', 'DKIM public key resolves', `${name} has a public key (${key.length} characters)`);
  if (records.length === 0) return fail('dkim', 'DKIM public key resolves', `no TXT record at ${name}`);
  return fail('dkim', 'DKIM public key resolves', `${name} exists but has no non-empty p= key (a revoked or empty key)`);
}

async function checkSpf(resolver, domain) {
  const name = `${SEND_SUBDOMAIN}.${domain}`;
  const records = (await txt(resolver, name)).filter((r) => /^\s*v=spf1\b/i.test(r));
  if (records.length === 0) return fail('spf', 'SPF on the sending subdomain', `no v=spf1 TXT record at ${name}`);
  if (records.length > 1) return fail('spf', 'SPF on the sending subdomain', `${records.length} SPF records at ${name}; exactly one is allowed`);
  if (!/\binclude:amazonses\.com\b/i.test(records[0])) {
    return fail('spf', 'SPF on the sending subdomain', `${name} is "${records[0]}" and does not include amazonses.com, which is what Resend's record uses (docs/ops/DOMAINS.md)`);
  }
  return pass('spf', 'SPF on the sending subdomain', `${name}: ${records[0]}`);
}

async function checkBounceMx(resolver, domain) {
  const name = `${SEND_SUBDOMAIN}.${domain}`;
  const mx = await resolver.resolveMx(name);
  if (mx.length === 0) return fail('bounce-mx', 'Bounce (return-path) MX', `no MX record at ${name}; bounces would have nowhere to go`);
  return pass('bounce-mx', 'Bounce (return-path) MX', `${name}: ${mx.map((m) => `${m.exchange} (${m.priority})`).join(', ')}`);
}

async function checkRootSpf(resolver, domain) {
  const records = (await txt(resolver, domain)).filter((r) => /^\s*v=spf1\b/i.test(r));
  if (records.length > 1) return fail('root-spf', 'Root SPF (at most one record)', `${records.length} SPF records at ${domain}; receivers treat that as a permanent error`);
  if (records.length === 0) return manual('root-spf', 'Root SPF', `no SPF at ${domain}. DOMAINS.md lists one; confirm it is intended (Resend uses ${SEND_SUBDOMAIN}. for its envelope sender)`);
  return pass('root-spf', 'Root SPF (at most one record)', `${domain}: ${records[0]}`);
}

/** Rows no DNS lookup can answer. Each names the human and the runbook section. */
export function manualRows() {
  return [
    manual('resend-verified', 'Resend shows the domain Verified', 'Founder reads Resend > Domains. Runbook section 2, step 1'),
    manual('tracking-off', 'Click tracking and open tracking are off', 'Founder reads Resend > Domains > the domain > Configuration. Runbook section 2, step 2'),
    manual('smtp-prod', 'Production Supabase project uses custom SMTP', 'Founder reads Authentication > Emails > SMTP settings in the production project. Runbook section 4'),
    manual('rate-limit', 'Email rate limit is at least the launch value', 'Founder reads Authentication > Rate Limits in the production project. Runbook section 5'),
    manual('code-expiry', 'Email OTP expiration and length match the app', 'Founder reads Authentication > Sign In / Providers > Email. Runbook section 6'),
    manual('inboxes', 'A real code reaches Gmail, Outlook, iCloud and an Apple private-relay address with DKIM and DMARC pass', 'Founder or tester sends from the production project. Runbook section 7'),
  ];
}

/**
 * Run every DNS check. `resolver` is injected so tests need no network: { resolveTxt(name) -> string[][], resolveMx(name) -> {exchange, priority}[] }.
 * Returns { domain, policy, rows, ok } where ok is true only when no DNS row failed.
 */
export async function runPreflight({ domain = DEFAULT_DOMAIN, policy = null, resolver = systemResolver() } = {}) {
  const guarded = async (id, label, fn) => {
    try {
      return await fn();
    } catch (e) {
      return fail(id, label, `lookup failed (${(e && e.code) || 'error'}); try again or check your network`);
    }
  };
  if (typeof resolver.canary === 'function' && !(await resolver.canary())) {
    const row = fail('resolver', 'Public DNS is reachable from here', 'a control lookup (TXT for google.com) returned nothing, so this machine cannot see public DNS. Run it from a normal network; the rows below would be false');
    return { domain, policy, rows: [row], ok: false };
  }
  const rows = [
    await guarded('dmarc', 'DMARC record', () => checkDmarc(resolver, domain, policy)),
    await guarded('dkim', 'DKIM public key resolves', () => checkDkim(resolver, domain)),
    await guarded('spf', 'SPF on the sending subdomain', () => checkSpf(resolver, domain)),
    await guarded('bounce-mx', 'Bounce (return-path) MX', () => checkBounceMx(resolver, domain)),
    await guarded('root-spf', 'Root SPF', () => checkRootSpf(resolver, domain)),
    ...manualRows(),
  ];
  return { domain, policy, rows, ok: rows.every((r) => r.status !== 'FAIL') };
}

export function format(result) {
  const lines = [`Mail preflight for ${result.domain} (chosen DMARC policy: ${result.policy ?? 'not given'})`, ''];
  for (const r of result.rows) lines.push(`${r.status.padEnd(6)} ${r.label}\n       ${r.detail}`);
  const manualLeft = result.rows.filter((r) => r.status === 'MANUAL').length;
  lines.push('', result.ok
    ? `DNS checks pass. ${manualLeft} MANUAL rows still need a person (docs/ops/MAIL-PREFLIGHT.md). This is not yet "ready".`
    : 'DNS checks FAIL. Do not send sign-in codes to real users yet.');
  return lines.join('\n');
}

export function parseArgs(argv) {
  const out = { domain: DEFAULT_DOMAIN, policy: null, json: false, help: false, errors: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--domain' || a === '--policy') {
      const v = argv[++i];
      if (!v || v.startsWith('--')) out.errors.push(`${a} needs a value`);
      else out[a.slice(2)] = v.toLowerCase();
    } else out.errors.push(`unknown argument ${a}`);
  }
  if (out.policy && !POLICIES.includes(out.policy)) out.errors.push(`--policy must be one of ${POLICIES.join(', ')}`);
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(out.domain)) out.errors.push('--domain is not a valid domain name');
  return out;
}

const USAGE = 'usage: node scripts/ops/mail-preflight.mjs [--domain earlyletters.com] [--policy none|quarantine|reject] [--json]';

export async function main(argv, { resolver, write = (s) => process.stdout.write(`${s}\n`) } = {}) {
  const args = parseArgs(argv);
  if (args.help || args.errors.length) {
    for (const e of args.errors) write(`error: ${e}`);
    write(USAGE);
    return args.help && !args.errors.length ? 0 : 2;
  }
  const result = await runPreflight({ domain: args.domain, policy: args.policy, resolver });
  write(args.json ? JSON.stringify(result, null, 2) : format(result));
  return result.ok ? 0 : 1;
}

if (process.argv[1] && pathResolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
