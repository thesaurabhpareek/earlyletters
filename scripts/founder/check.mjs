#!/usr/bin/env node
// Read-only checker for the founder steps a machine can see (docs/release/FOUNDER_QUEUE.md).
// It uses the GitHub REST API with GET only and never writes anything.
// Run: node scripts/founder/check.mjs [--repo owner/name] [--json] [--fetch]
// Auth: by default it calls `gh api --method GET` as the account `gh` is signed in to.
// --fetch uses Node's fetch with GITHUB_TOKEN or GH_TOKEN instead (also GET only).
// Exit: 0 when every check is done, 1 when any is open, 2 when none is open but some
// could not be read (a token without admin rights cannot read branch protection).
import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const DEFAULT_REPO = 'thesaurabhpareek/earlyletters';
// Same names as scripts/release/github-settings.ts REQUIRED_CHECKS.
export const REQUIRED_CHECKS = ['required', 'applied migrations unchanged'];
// Workflows on develop that GitHub registers only once develop is the default branch (AF-05).
export const EXPECTED_WORKFLOWS = ['nightly.yml', 'testflight.yml', 'agents.yml'];

const result = (id, queue, status, detail) => ({ id, queue, status, detail });
const unreadable = (id, queue, res) => result(id, queue, 'unreadable', `HTTP ${res.status}`);

export function decodeContent(body) {
  return Buffer.from(String(body?.content ?? ''), body?.encoding === 'base64' ? 'base64' : 'utf8').toString('utf8');
}

export function countTrustedKeys(source) {
  const m = /TRUSTED_SIGNING_KEYS[^=]*=\s*\[([\s\S]*?)\];/.exec(source);
  if (!m) return null;
  const code = m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  return (code.match(/keyId\s*:/g) ?? []).length;
}

export function appliedMigrations(text) {
  return text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

export async function checkDefaultBranch(get, repo) {
  const res = await get(`repos/${repo}`);
  if (res.status !== 200) return [unreadable('default-branch', 'W0-09', res)];
  const b = res.body.default_branch;
  const out = [result('default-branch', 'W0-09', b === 'develop' ? 'done' : 'open', `default branch is ${b}`)];
  const sa = res.body.security_and_analysis;
  if (!sa) out.push(result('secret-scanning', 'W0-06', 'unreadable', 'security_and_analysis not returned'));
  else {
    const ss = sa.secret_scanning?.status;
    const pp = sa.secret_scanning_push_protection?.status;
    out.push(result('secret-scanning', 'W0-06', ss === 'enabled' && pp === 'enabled' ? 'done' : 'open',
      `secret scanning ${ss ?? 'unknown'}, push protection ${pp ?? 'unknown'}`));
  }
  return out;
}

export async function checkDependabotAlerts(get, repo) {
  const res = await get(`repos/${repo}/vulnerability-alerts`);
  if (res.status === 204) return result('dependabot-alerts', 'W0-06', 'done', 'Dependabot alerts on');
  if (res.status === 404) return result('dependabot-alerts', 'W0-06', 'open', 'Dependabot alerts off');
  return unreadable('dependabot-alerts', 'W0-06', res);
}

export async function checkProtection(get, repo, branch) {
  const id = `protection-${branch}`;
  const [res, rules] = await Promise.all([
    get(`repos/${repo}/branches/${branch}/protection`),
    get(`repos/${repo}/rules/branches/${branch}`),
  ]);
  const types = rules.status === 200 && Array.isArray(rules.body) ? rules.body.map((r) => r.type) : [];
  const ruleNote = types.length ? ` (ruleset rules: ${types.join(', ')})` : '';
  if (res.status === 404) return result(id, 'W0-08', 'open', `${branch} has no branch protection${ruleNote}`);
  if (res.status !== 200) return unreadable(id, 'W0-08', res);
  const contexts = res.body.required_status_checks?.contexts ?? [];
  const missing = REQUIRED_CHECKS.filter((c) => !contexts.includes(c));
  const problems = [];
  if (missing.length) problems.push(`missing required checks: ${missing.join(', ')}`);
  if (res.body.allow_force_pushes?.enabled) problems.push('force pushes allowed');
  if (res.body.allow_deletions?.enabled) problems.push('deletion allowed');
  return result(id, 'W0-08', problems.length ? 'open' : 'done',
    problems.length ? `${branch}: ${problems.join('; ')}` : `${branch}: required checks ${contexts.join(', ')}`);
}

export async function checkWorkflows(get, repo) {
  const res = await get(`repos/${repo}/actions/workflows?per_page=100`);
  if (res.status !== 200) return unreadable('workflows-registered', 'W0-09', res);
  const names = (res.body.workflows ?? []).map((w) => String(w.path).split('/').pop());
  const missing = EXPECTED_WORKFLOWS.filter((w) => !names.includes(w));
  return result('workflows-registered', 'W0-09', missing.length ? 'open' : 'done',
    missing.length ? `not registered: ${missing.join(', ')}` : `registered: ${EXPECTED_WORKFLOWS.join(', ')}`);
}

export async function checkTrustedKeys(get, repo) {
  const res = await get(`repos/${repo}/contents/packages/api/src/keys.ts?ref=develop`);
  if (res.status !== 200) return unreadable('trusted-signing-keys', 'W0-14c', res);
  const n = countTrustedKeys(decodeContent(res.body));
  if (n === null) return result('trusted-signing-keys', 'W0-14c', 'unreadable', 'TRUSTED_SIGNING_KEYS not found');
  return result('trusted-signing-keys', 'W0-14c', n >= 2 ? 'done' : 'open', `${n} key(s) on develop; primary and backup need 2`);
}

export async function checkMigrations(get, repo) {
  const [applied, dir] = await Promise.all([
    get(`repos/${repo}/contents/.github/migrations-applied.txt?ref=develop`),
    get(`repos/${repo}/contents/supabase/migrations?ref=develop`),
  ]);
  if (applied.status !== 200) return unreadable('migrations-applied', 'Q2-01', applied);
  if (dir.status !== 200) return unreadable('migrations-applied', 'Q2-01', dir);
  const listed = appliedMigrations(decodeContent(applied.body));
  const files = (Array.isArray(dir.body) ? dir.body : []).map((f) => f.name).filter((n) => n.endsWith('.sql'));
  const unrecorded = files.filter((f) => !listed.includes(f));
  return result('migrations-applied', 'Q2-01', unrecorded.length ? 'open' : 'done',
    `${listed.length} of ${files.length} migration files on develop recorded as applied`);
}

export async function runChecks(get, repo = DEFAULT_REPO) {
  const out = [];
  out.push(...(await checkDefaultBranch(get, repo)));
  out.push(await checkDependabotAlerts(get, repo));
  out.push(await checkProtection(get, repo, 'develop'));
  out.push(await checkProtection(get, repo, 'main'));
  out.push(await checkWorkflows(get, repo));
  out.push(await checkTrustedKeys(get, repo));
  out.push(await checkMigrations(get, repo));
  return out;
}

export function render(results) {
  return results.map((r) => `${r.status.toUpperCase().padEnd(10)} ${r.queue.padEnd(6)} ${r.id}: ${r.detail}`).join('\n');
}

export function exitCode(results) {
  if (results.some((r) => r.status === 'open')) return 1;
  return results.some((r) => r.status === 'unreadable') ? 2 : 0;
}

// Transports. Both issue GET requests only.
export function fetchGet(token) {
  return async (path) => {
    const res = await fetch(`https://api.github.com/${path}`, {
      method: 'GET',
      headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token}`, 'x-github-api-version': '2022-11-28' },
    });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { status: res.status, body };
  };
}

export function ghGet() {
  return (path) => new Promise((resolve) => {
    execFile('gh', ['api', '--method', 'GET', path], { maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (!err) {
        let body = null;
        try { body = stdout ? JSON.parse(stdout) : null; } catch { body = stdout; }
        return resolve({ status: stdout ? 200 : 204, body });
      }
      const m = /HTTP (\d{3})/.exec(String(stderr));
      resolve({ status: m ? Number(m[1]) : 0, body: null });
    });
  });
}

async function main(argv) {
  const i = argv.indexOf('--repo');
  const repo = i >= 0 ? argv[i + 1] : DEFAULT_REPO;
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const get = argv.includes('--fetch') ? fetchGet(token) : ghGet();
  const results = await runChecks(get, repo);
  console.log(argv.includes('--json') ? JSON.stringify(results, null, 2) : render(results));
  process.exitCode = exitCode(results);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main(process.argv.slice(2));
