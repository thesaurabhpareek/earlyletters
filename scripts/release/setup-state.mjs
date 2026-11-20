#!/usr/bin/env node
// Setup state: one read-only row per step of docs/release/setup-steps.json (RS-05, RS-06).
// Run it before asking the founder anything:
//
//   npm run release:ready                     # every step, one line each
//   npm run release:ready -- --brief          # at most 25 lines: FAIL, UNKNOWN and the next three founder steps
//   npm run release:ready -- --step S-04b     # one step in detail; exit 0 only on PASS or ATTESTED
//   npm run release:ready -- --json           # machine copy (schema setup-state/1, read by the REL-03 gate runner)
//
// Other flags: --local reads repo files from this checkout instead of origin develop over REST;
// --founder also lists GitHub environment secret NAMES with your own `gh` (never values; UNKNOWN when the
// API refuses, as it does through the agent proxy); --claims <file> marks steps someone holds (RS-08, reserved).
//
// States: PASS (a live probe saw it), FAIL (a probe saw it missing, or the setup record says open),
// ATTESTED (no live probe; the setup record says done, on its date), CLAIMED (someone holds it, RS-08),
// UNKNOWN (a probe could not run, for example no network). UNKNOWN is never PASS.
// Each row says where its state came from: `source` is "probe" or "ledger".
//
// Safety: every network call is an HTTP GET or HEAD (DNS over HTTPS at dns.google, the public site, the pack
// host, Apple's AASA CDN) or `gh api --method GET` (scripts/founder/check.mjs). It writes no file and prints no
// secret value. Deeper checks that need keys or a build (doctor.ts, the preflights, publish.ts verify) are named
// per step under "Deeper check"; this command does not run them.
//
// Exit: 0 when the report printed; with --step, 0 only when that step is PASS or ATTESTED, 1 otherwise;
// 2 for a usage error.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  DEFAULT_REPO, REQUIRED_CHECKS, checkDefaultBranch, checkProtection, countTrustedKeys, decodeContent, ghGet,
} from '../founder/check.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const REGISTRY_PATH = join(ROOT, 'docs', 'release', 'setup-steps.json');
export const SCHEMA = 'setup-state/1';
export const STATES = ['PASS', 'FAIL', 'ATTESTED', 'CLAIMED', 'UNKNOWN'];
export const BLOCKS_ORDER = ['mac-build', 'gh-build', 'store', 'build-2', 'optional'];

// Public identifiers the probes compare against.
export const VERCEL_A = '76.76.21.21';
export const MANIFEST_PATH = '/functions/v1/config/v1/packs'; // packages/api/src/standards.ts, API_MAJOR v1
export const AASA_APP_ID = 'VX2Z7FGV23.com.earlyletters.scribe';
export const EXPO_PROJECT_ID = '0bc517fb-a526-4f0f-892a-5ab676a86e6b';
export const EXPO_OWNER = 'earlyletters-team';
export const RULESET_NAMES = [
  'Copilot review for main and develop', 'Protect long-lived branches', 'Protect release tags', 'archive tags are kept',
];
const READ_METHODS = new Set(['GET', 'HEAD']);

export function loadRegistry(path = REGISTRY_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// ---------- transports (read only) ----------

/** HTTP GET or HEAD with no redirects followed. Any other method throws before a request is made. */
export function makeHttp(fetchImpl = globalThis.fetch, timeoutMs = 10_000) {
  return async (url, method = 'HEAD') => {
    if (!READ_METHODS.has(method)) throw new Error(`refused: ${method} is not a read`);
    const res = await fetchImpl(url, { method, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) });
    const body = method === 'GET' ? await res.text() : '';
    return { status: res.status, headers: res.headers, body };
  };
}

function memo(fn) {
  const cache = new Map();
  return (...args) => {
    const k = JSON.stringify(args);
    if (!cache.has(k)) cache.set(k, fn(...args));
    return cache.get(k);
  };
}

/** Build the probe context. Every field is injectable for tests. */
export function makeContext({ http, gh, repo = DEFAULT_REPO, local = false, founder = false, root = ROOT, now = () => new Date() } = {}) {
  const get = http ?? makeHttp();
  const ghCall = memo(gh ?? ghGet());
  const dns = memo(async (name, type) => {
    const res = await get(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`, 'GET');
    if (res.status !== 200) throw new Error(`dns.google HTTP ${res.status}`);
    const j = JSON.parse(res.body);
    if (j.Status !== 0 && j.Status !== 3) throw new Error(`dns.google rcode ${j.Status} for ${name} ${type}`);
    return { ad: Boolean(j.AD), answers: (j.Answer ?? []).map((a) => String(a.data)) };
  });
  const file = memo(async (path) => {
    if (local) return readFileSync(join(root, path), 'utf8');
    const res = await ghCall(`repos/${repo}/contents/${path}?ref=develop`);
    if (res.status !== 200) throw new Error(`GitHub contents ${path}: HTTP ${res.status}`);
    return decodeContent(res.body);
  });
  return { http: memo(get), gh: ghCall, dns, file, repo, local, founder, now };
}

// ---------- probes: each returns { state, evidence }, or null when it does not apply (ledger decides) ----------

const pass = (evidence) => ({ state: 'PASS', evidence });
const fail = (evidence) => ({ state: 'FAIL', evidence });
const unknown = (evidence) => ({ state: 'UNKNOWN', evidence });
const txt = (s) => s.replace(/^"|"$/g, '').replace(/"\s*"/g, '');

export function dmarcTags(record) {
  const tags = {};
  for (const part of txt(record).split(';')) {
    const [k, ...v] = part.split('=');
    if (k && k.trim()) tags[k.trim().toLowerCase()] = v.join('=').trim();
  }
  return tags;
}

async function dmarc(ctx, domain) {
  const { answers } = await ctx.dns(`_dmarc.${domain}`, 'TXT');
  return answers.map(txt).find((a) => /^v=DMARC1/i.test(a)) ?? null;
}

export const PROBES = {
  async appDnsOnly(ctx) {
    const { answers } = await ctx.dns('earlyletters.app', 'A');
    return answers.includes(VERCEL_A) ? pass(`A earlyletters.app is ${VERCEL_A} (Vercel), so DNS only`)
      : fail(`A earlyletters.app is ${answers.join(', ') || 'missing'}, not ${VERCEL_A}`);
  },
  async appNameservers(ctx) {
    const { answers } = await ctx.dns('earlyletters.app', 'NS');
    const cf = answers.length > 0 && answers.every((n) => /\.ns\.cloudflare\.com\.?$/.test(n));
    return cf ? pass(`NS ${answers.join(', ')}`) : fail(`NS ${answers.join(', ') || 'none'} (expected Cloudflare)`);
  },
  async appRedirect(ctx) {
    const res = await ctx.http('https://earlyletters.app/', 'HEAD');
    const to = res.headers.get('location') ?? '';
    return res.status === 308 && to.startsWith('https://earlyletters.com')
      ? pass(`HEAD https://earlyletters.app/ is 308 to ${to}`) : fail(`HEAD https://earlyletters.app/ is ${res.status} ${to}`.trim());
  },
  async appDnssec(ctx) {
    const ds = await ctx.dns('earlyletters.app', 'DS');
    if (!ds.answers.length) return fail('no DS record for earlyletters.app');
    return ds.ad ? pass(`DS ${ds.answers[0].split(' ').slice(0, 3).join(' ')} present, answers validate (AD)`)
      : fail('DS present but answers do not validate (no AD)');
  },
  async appCaaMx(ctx) {
    const [caa, mx, t] = await Promise.all([ctx.dns('earlyletters.app', 'CAA'), ctx.dns('earlyletters.app', 'MX'), ctx.dns('earlyletters.app', 'TXT')]);
    const problems = [];
    if (!caa.answers.length) problems.push('no CAA');
    if (!mx.answers.some((m) => /^0 \.?$/.test(m.trim()))) problems.push(`MX is ${mx.answers.join(', ') || 'none'}, not null MX`);
    if (!t.answers.map(txt).includes('v=spf1 -all')) problems.push('no SPF v=spf1 -all');
    return problems.length ? fail(problems.join('; ')) : pass(`${caa.answers.length} CAA, null MX, SPF -all`);
  },
  async appDmarcStrict(ctx) {
    const rec = await dmarc(ctx, 'earlyletters.app');
    if (!rec) return fail('no DMARC record at _dmarc.earlyletters.app');
    const t = dmarcTags(rec);
    const ok = t.p === 'reject' && t.adkim === 's' && t.aspf === 's';
    return ok ? pass(`_dmarc.earlyletters.app: ${rec}`) : fail(`_dmarc.earlyletters.app is "${rec}"; needs p=reject; adkim=s; aspf=s`);
  },
  async packsHost(ctx) {
    const a = await ctx.dns('packs.earlyletters.app', 'A');
    if (!a.answers.length) return fail('packs.earlyletters.app has no A record');
    const res = await ctx.http('https://packs.earlyletters.app/', 'HEAD');
    return res.status < 500 ? pass(`packs.earlyletters.app resolves; HEAD / is ${res.status} (404 is expected: no index)`)
      : fail(`HEAD https://packs.earlyletters.app/ is ${res.status}`);
  },
  async packManifest(ctx) {
    const url = `https://packs.earlyletters.app${MANIFEST_PATH}`;
    const res = await ctx.http(url, 'HEAD');
    const type = res.headers.get('content-type') ?? '';
    return res.status === 200 && type.includes('application/json')
      ? pass(`HEAD ${MANIFEST_PATH} is 200 ${type.split(';')[0]} (signatures: publish.ts verify)`)
      : fail(`HEAD ${url} is ${res.status} ${type}`.trim());
  },
  async aasa(ctx) {
    const site = await ctx.http('https://earlyletters.com/.well-known/apple-app-site-association', 'HEAD');
    const type = site.headers.get('content-type') ?? '';
    if (site.status !== 200 || !type.includes('application/json')) return fail(`site AASA HEAD is ${site.status} ${type}`.trim());
    // Apple's CDN answers 405 to HEAD, so this one read is a GET.
    const cdn = await ctx.http('https://app-site-association.cdn-apple.com/a/v1/earlyletters.com', 'GET');
    if (cdn.status !== 200) return fail(`site AASA 200; Apple CDN copy is ${cdn.status}`);
    return cdn.body.includes(AASA_APP_ID) ? pass(`site AASA 200 json; Apple CDN copy lists ${AASA_APP_ID}`)
      : fail(`site AASA 200; Apple CDN copy does not list ${AASA_APP_ID} yet`);
  },
  async comCaa(ctx) {
    const caa = await ctx.dns('earlyletters.com', 'CAA');
    return caa.answers.length ? pass(`${caa.answers.length} CAA record(s) on earlyletters.com`) : fail('no CAA record on earlyletters.com');
  },
  async comDmarcRua(ctx) {
    const rec = await dmarc(ctx, 'earlyletters.com');
    if (!rec) return fail('no DMARC record at _dmarc.earlyletters.com');
    const rua = dmarcTags(rec).rua ?? '';
    const local = (rua.match(/mailto:([^@,\s]+)@/i) ?? [])[1];
    return local === 'dmarc' ? pass('earlyletters.com DMARC rua goes to the dmarc alias')
      : fail(`earlyletters.com DMARC rua goes to ${local ? `the ${local} alias` : 'nobody'}, not dmarc`);
  },
  async trustedKeys(ctx) {
    const n = countTrustedKeys(await ctx.file('packages/api/src/keys.ts'));
    if (n === null) return unknown('TRUSTED_SIGNING_KEYS not found in keys.ts');
    return n >= 2 ? pass(`keys.ts on ${ctx.local ? 'this checkout' : 'develop'} lists ${n} trusted keys (primary and backup)`)
      : fail(`keys.ts lists ${n} trusted key(s); primary and backup need 2`);
  },
  async easProjectConfig(ctx) {
    const src = await ctx.file('apps/mobile/app.config.ts');
    const id = /projectId:\s*['"]([^'"]+)['"]/.exec(src)?.[1];
    const owner = /owner:\s*['"]([^'"]+)['"]/.exec(src)?.[1];
    return id === EXPO_PROJECT_ID && owner === EXPO_OWNER ? pass(`app.config.ts: owner ${owner}, projectId ${id}`)
      : fail(`app.config.ts: owner ${owner ?? 'missing'}, projectId ${id ?? 'missing'}`);
  },
  async easProductionProfile(ctx, step) {
    const [eas, pkg] = await Promise.all([ctx.file('apps/mobile/eas.json'), ctx.file('apps/mobile/package.json')]);
    return easProfileFindings(JSON.parse(eas), JSON.parse(pkg), step.values?.[0]?.value);
  },
  async prMerged(ctx, step) {
    return prStates(ctx, step.args.numbers, (pr) => Boolean(pr.merged_at), 'merged');
  },
  async prClosed(ctx, step) {
    return prStates(ctx, step.args.numbers, (pr) => pr.state === 'closed', 'closed');
  },
  async githubProtection(ctx) {
    const rows = [
      ...(await checkDefaultBranch(ctx.gh, ctx.repo)).filter((r) => r.id === 'default-branch'),
      await checkProtection(ctx.gh, ctx.repo, 'develop'),
      await checkProtection(ctx.gh, ctx.repo, 'main'),
    ];
    const evidence = rows.map((r) => r.detail).join('; ');
    if (rows.some((r) => r.status === 'open')) return fail(evidence);
    if (rows.some((r) => r.status === 'unreadable')) return unknown(evidence);
    return pass(`${evidence} (needs ${REQUIRED_CHECKS.join(', ')})`);
  },
  async githubRulesets(ctx) {
    const res = await ctx.gh(`repos/${ctx.repo}/rulesets?per_page=100`);
    if (res.status !== 200 || !Array.isArray(res.body)) return unknown(`rulesets: HTTP ${res.status}`);
    const active = res.body.filter((r) => r.enforcement === undefined || r.enforcement === 'active').map((r) => r.name);
    const missing = RULESET_NAMES.filter((n) => !active.includes(n));
    return missing.length ? fail(`rulesets missing or not active: ${missing.join(', ')}`) : pass(`${RULESET_NAMES.length} rulesets active by name`);
  },
  async workflowsActive(ctx, step) {
    const res = await ctx.gh(`repos/${ctx.repo}/actions/workflows?per_page=100`);
    if (res.status !== 200) return unknown(`workflows: HTTP ${res.status}`);
    const byFile = new Map((res.body.workflows ?? []).map((w) => [String(w.path).split('/').pop(), w.state]));
    const bad = step.args.workflows.filter((w) => byFile.get(w) !== 'active');
    return bad.length ? fail(bad.map((w) => `${w} is ${byFile.get(w) ?? 'not registered'}`).join('; '))
      : pass(`${step.args.workflows.join(', ')} active`);
  },
  async testflightDispatched(ctx) {
    const res = await ctx.gh(`repos/${ctx.repo}/actions/workflows/testflight.yml/runs?event=workflow_dispatch&per_page=20`);
    if (res.status !== 200) return unknown(`testflight.yml runs: HTTP ${res.status}`);
    const runs = res.body.workflow_runs ?? [];
    const ok = runs.filter((r) => r.conclusion === 'success');
    if (ok.length) return pass(`testflight.yml: ${ok.length} successful dispatched run(s), latest ${ok[0].created_at}`);
    return fail(`testflight.yml: ${res.body.total_count ?? runs.length} dispatched run(s), none successful (a build from the Mac does not show here)`);
  },
  async envSecretNames(ctx, step) {
    if (!ctx.founder) return null; // only the founder's own gh may list names; otherwise the ledger speaks
    const { environment, names } = step.args;
    const res = await ctx.gh(`repos/${ctx.repo}/environments/${environment}/secrets?per_page=100`);
    if (res.status !== 200) return unknown(`environment ${environment} secret names: HTTP ${res.status} (cannot list here)`);
    const have = (res.body?.secrets ?? []).map((s) => String(s.name)); // names only; values are never read
    const missing = names.filter((n) => !have.includes(n));
    return missing.length ? fail(`environment ${environment} lacks secret name(s): ${missing.join(', ')}`)
      : pass(`environment ${environment} has secret name(s) ${names.join(', ')}`);
  },
};

async function prStates(ctx, numbers, ok, word) {
  const res = await Promise.all(numbers.map((n) => ctx.gh(`repos/${ctx.repo}/pulls/${n}`)));
  const unread = numbers.filter((_, i) => res[i].status !== 200);
  if (unread.length) return unknown(`could not read PR ${unread.map((n) => `#${n}`).join(', ')}`);
  const bad = numbers.filter((_, i) => !ok(res[i].body));
  return bad.length ? fail(`not ${word}: ${bad.map((n) => `#${n}`).join(', ')}`) : pass(`${word}: ${numbers.map((n) => `#${n}`).join(', ')}`);
}

/** The store profile: production ascAppId, and no EAS Update channel in any build profile while expo-updates is absent (D-091). */
export function easProfileFindings(eas, mobilePkg, ascAppId) {
  const problems = [];
  const have = eas?.submit?.production?.ios?.ascAppId;
  if (have !== ascAppId) problems.push(`submit.production.ios.ascAppId is ${have ?? 'missing'}, not ${ascAppId}`);
  const deps = { ...(mobilePkg.dependencies ?? {}), ...(mobilePkg.devDependencies ?? {}) };
  if (!deps['expo-updates']) {
    const withChannel = Object.entries(eas?.build ?? {}).filter(([, p]) => p && p.channel).map(([n]) => n);
    if (withChannel.length) problems.push(`build profile(s) ${withChannel.join(', ')} name a channel while expo-updates is absent`);
  }
  return problems.length ? fail(problems.join('; ')) : pass(`production ascAppId ${ascAppId}; no channel without expo-updates`);
}

// ---------- rows ----------

function fromLedger(step) {
  const { status, date } = step.ledger;
  if (status === 'done') return { state: 'ATTESTED', evidence: `setup record: done, ${date}; no live probe` };
  if (status === 'waiting') return { state: 'FAIL', evidence: `setup record: waiting on a third party since ${date}; no live probe` };
  return { state: 'FAIL', evidence: `setup record: open as of ${date}; no live probe` };
}

export async function stepRow(ctx, step) {
  let out = null;
  let source = 'ledger';
  if (step.probe) {
    const probe = PROBES[step.probe];
    if (!probe) out = unknown(`no probe named ${step.probe}`);
    else {
      try {
        out = await probe(ctx, step);
      } catch (e) {
        out = unknown(`probe ${step.probe} could not run: ${String(e?.cause?.code ?? e?.name ?? 'error')}`);
      }
    }
    if (out) source = 'probe';
    else if (step.founderOnly) out = { ...fromLedger(step), evidence: `${fromLedger(step).evidence} (run with --founder to list secret names)` };
  }
  if (!out) out = fromLedger(step);
  return {
    id: step.id, title: step.title, owner: step.owner, blocks: step.blocks, wall: step.wall ?? null,
    state: out.state, source, evidence: out.evidence, checkedAt: ctx.now().toISOString(),
  };
}

/** Mark rows someone holds (RS-08). A row a probe saw PASS stays PASS. */
export function applyClaims(rows, claims = []) {
  const byId = new Map(claims.map((c) => [c.id, c]));
  return rows.map((r) => {
    const c = byId.get(r.id);
    if (!c || r.state === 'PASS' || r.state === 'ATTESTED') return r;
    return { ...r, state: 'CLAIMED', evidence: `claimed by ${c.by} since ${c.since}; before the claim: ${r.state}, ${r.evidence}` };
  });
}

export async function collect(ctx, registry, claims = []) {
  const rows = await Promise.all(registry.steps.map((s) => stepRow(ctx, s)));
  return applyClaims(rows, claims);
}

export function summary(rows) {
  return Object.fromEntries(STATES.map((s) => [s, rows.filter((r) => r.state === s).length]));
}

const DONE = new Set(['PASS', 'ATTESTED']);

/** Founder steps not done whose depends are done, in the setup record's order. */
export function nextFounderSteps(rows, registry, n = 3) {
  const state = new Map(rows.map((r) => [r.id, r.state]));
  return registry.steps
    .filter((s) => s.owner === 'founder' && !DONE.has(state.get(s.id)) && state.get(s.id) !== 'CLAIMED')
    .filter((s) => s.depends.every((d) => DONE.has(state.get(d))))
    .sort((a, b) => (a.queue ?? 99) - (b.queue ?? 99))
    .slice(0, n);
}

export function toJson(rows, { repo, checkedAt, local }) {
  return { schema: SCHEMA, repo, ref: local ? 'local' : 'develop', checkedAt, summary: summary(rows), rows };
}

const fmt = (r) => `${r.state.padEnd(8)} ${r.id.padEnd(6)} ${r.blocks.padEnd(9)} ${r.title}: ${r.evidence}`;
const head = (rows, checkedAt) => `release:ready ${checkedAt} ${Object.entries(summary(rows)).map(([k, v]) => `${k} ${v}`).join(' ')}`;

export function renderFull(rows, checkedAt) {
  return [head(rows, checkedAt), ...rows.map(fmt)].join('\n');
}

export const BRIEF_MAX = 25;
export const BRIEF_WIDTH = 200;
const clip = (line) => (line.length > BRIEF_WIDTH ? `${line.slice(0, BRIEF_WIDTH - 3)}...` : line);

export function renderBrief(rows, registry, checkedAt) {
  const rank = (r) => BLOCKS_ORDER.indexOf(r.blocks) * 10 + (r.state === 'UNKNOWN' ? 0 : 1);
  const bad = rows.filter((r) => r.state === 'FAIL' || r.state === 'UNKNOWN').sort((a, b) => rank(a) - rank(b));
  const next = nextFounderSteps(rows, registry).map((s, i) => `  ${i + 1}. ${s.id} ${s.title} (${s.minutes} min${s.wall ? `, wall: ${s.wall}` : ''}) ${s.link}`);
  const tail = ['Next founder steps (check this list before asking him):', ...(next.length ? next : ['  none'])];
  const room = BRIEF_MAX - 2 - tail.length;
  const shown = bad.length > room ? bad.slice(0, room - 1) : bad;
  const lines = [head(rows, checkedAt), 'FAIL and UNKNOWN, blocking first (ATTESTED is the setup record\'s word, not a live check):', ...shown.map(fmt)];
  if (shown.length < bad.length) lines.push(`  and ${bad.length - shown.length} more (optional or later); run without --brief`);
  return [...lines, ...tail].map(clip).join('\n');
}

export function renderStep(row, step, rows) {
  const state = new Map(rows.map((r) => [r.id, r.state]));
  const lines = [
    `${row.id} ${row.title}`,
    `State: ${row.state} (${row.source}) at ${row.checkedAt}`,
    `Evidence: ${row.evidence}`,
    `Owner: ${step.owner}; wall: ${step.wall ?? 'none'}; blocks: ${step.blocks}; about ${step.minutes} min; recurrence: ${step.recurrence}`,
    `Depends: ${step.depends.length ? step.depends.map((d) => `${d} ${state.get(d)}`).join(', ') : 'none'}`,
    `Link: ${step.link}`,
  ];
  if (step.values) lines.push(`Values: ${step.values.map((v) => `${v.type ?? v.field} ${v.name ?? ''} ${v.value}`.replace(/\s+/g, ' ')).join(' | ')}`);
  if (step.deepCheck) lines.push(`Deeper check (not run here): ${step.deepCheck}`);
  return lines.join('\n');
}

export function parseArgs(argv) {
  const opt = { json: false, brief: false, founder: false, local: false, step: null, claims: null, repo: DEFAULT_REPO };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') opt.json = true;
    else if (a === '--brief') opt.brief = true;
    else if (a === '--founder') opt.founder = true;
    else if (a === '--local') opt.local = true;
    else if (a === '--step') opt.step = argv[++i];
    else if (a === '--claims') opt.claims = argv[++i];
    else if (a === '--repo') opt.repo = argv[++i];
    else throw new Error(`unknown flag ${a}`);
  }
  return opt;
}

/** The whole command, with injectable transports. Returns { code, text }. */
export async function run(argv, deps = {}) {
  let opt;
  try { opt = parseArgs(argv); } catch (e) { return { code: 2, text: e.message }; }
  const registry = deps.registry ?? loadRegistry();
  const ctx = makeContext({ ...deps, repo: opt.repo, local: opt.local, founder: opt.founder });
  const claims = opt.claims ? JSON.parse(readFileSync(opt.claims, 'utf8')) : (deps.claims ?? []);
  let steps = registry;
  if (opt.step) {
    const step = registry.steps.find((s) => s.id === opt.step);
    if (!step) return { code: 2, text: `no step ${opt.step} in docs/release/setup-steps.json` };
    // Its depends are probed too, so the detail can say whether it is ready to do.
    const ids = new Set([step.id, ...step.depends]);
    steps = { ...registry, steps: registry.steps.filter((s) => ids.has(s.id)) };
  }
  const rows = await collect(ctx, steps, claims);
  const checkedAt = ctx.now().toISOString();
  if (opt.step) {
    const row = rows.find((r) => r.id === opt.step);
    const code = DONE.has(row.state) ? 0 : 1;
    const text = opt.json ? JSON.stringify(toJson([row], { repo: opt.repo, checkedAt, local: opt.local }), null, 2)
      : renderStep(row, registry.steps.find((s) => s.id === opt.step), rows);
    return { code, text };
  }
  if (opt.json) return { code: 0, text: JSON.stringify(toJson(rows, { repo: opt.repo, checkedAt, local: opt.local }), null, 2) };
  return { code: 0, text: opt.brief ? renderBrief(rows, registry, checkedAt) : renderFull(rows, checkedAt) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { code, text } = await run(process.argv.slice(2));
  console.log(text);
  process.exitCode = code;
}
