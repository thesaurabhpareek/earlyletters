#!/usr/bin/env node
/**
 * Dependency audit gate (SEC-R08, BL-2124): `npm audit --omit=dev --json` checked against one dated ignore list.
 *
 *   npm audit --omit=dev --json | node scripts/ci/audit-gate.mjs [--npm-exit <code>]
 *   node scripts/ci/audit-gate.mjs --input <report.json> [--ignore <file>] [--level high] [--today YYYY-MM-DD]
 *   node scripts/ci/audit-gate.mjs --run        (runs npm audit itself; the only mode that touches the network)
 *
 * Fails (exit 1) on: any advisory at or above the level (high by default, so high and critical) that is not on the
 * ignore list; an ignore entry with no id, no reason or no expiry; an entry whose expiry is in the past; an ignore
 * file that is not valid JSON. The ignore list is `.github/audit-ignore.json` (SEC-R08 names that path); a missing
 * file is an empty list, so until it exists every high advisory fails.
 *
 * Fails closed: empty input, input that is not JSON, an npm error object, or anything that is not an npm audit
 * report (auditReportVersion 2) fails, so an audit that did not run never reads as a clean one.
 *
 * The output names advisory ids, severities and package names only. Titles, URLs and ignore reasons are never
 * printed: an advisory title is third-party text in our CI log, and the ids are enough to look each one up.
 * Never run `npm audit fix --force` (SEC-R08).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LEVELS = ['info', 'low', 'moderate', 'high', 'critical'];
export const DEFAULT_IGNORE = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.github', 'audit-ignore.json');
// GitHub advisory ids use this alphabet (no vowels or look-alike digits).
const GHSA = /GHSA(?:-[23456789cfghjmpqrvwx]{4}){3}/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const isObject = (x) => typeof x === 'object' && x !== null && !Array.isArray(x);
// A severity npm may add later ranks above critical, so an unknown one blocks instead of passing (fail closed).
const rank = (severity) => (LEVELS.includes(severity) ? LEVELS.indexOf(severity) : LEVELS.length);

/** Parses raw audit output. Throws on empty or non-JSON input (fail closed). */
export function parseReport(text) {
  if (!text || !text.trim()) throw new Error('empty input: npm audit wrote nothing.');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('the audit output is not JSON.');
  }
}

/** Reasons the report cannot be trusted as an audit result; empty when it can. */
export function checkReport(report) {
  if (!isObject(report)) return ['the audit output is not a JSON object.'];
  if ('error' in report) {
    const code = isObject(report.error) && typeof report.error.code === 'string' ? `: ${report.error.code}` : '';
    return [`npm audit reported an error${code}.`];
  }
  const errors = [];
  if (report.auditReportVersion !== 2) errors.push('not an npm audit report (auditReportVersion is not 2).');
  if (!isObject(report.vulnerabilities)) errors.push('the report has no "vulnerabilities" object.');
  return errors;
}

/** Every advisory in the report, once each, keyed by its GHSA id (or `npm-<source>` when there is none). */
export function advisories(report) {
  const found = new Map();
  for (const [pkg, v] of Object.entries(report.vulnerabilities ?? {})) {
    for (const via of v?.via ?? []) {
      // A string in `via` names another vulnerable package, whose advisories are listed under its own key.
      if (!isObject(via)) continue;
      const id = GHSA.exec(String(via.url ?? ''))?.[0] ?? `npm-${via.source}`;
      if (!found.has(id)) found.set(id, { id, package: String(via.name ?? pkg), severity: String(via.severity) });
    }
  }
  return [...found.values()];
}

/** Problems with the ignore list itself (SEC-R08: every entry has an id, a reason and an expiry that is not past). */
export function checkIgnore(ignoreFile, today) {
  if (!isObject(ignoreFile) || !Array.isArray(ignoreFile.ignore)) return ['the ignore file has no "ignore" array.'];
  const errors = [];
  const seen = new Set();
  ignoreFile.ignore.forEach((e, i) => {
    const name = isObject(e) && typeof e.id === 'string' && e.id.trim() ? e.id : `entry ${i + 1}`;
    if (!isObject(e)) return errors.push(`ignore ${name}: not an object.`);
    if (name === `entry ${i + 1}`) errors.push(`ignore ${name}: no advisory id.`);
    if (typeof e.reason !== 'string' || !e.reason.trim()) errors.push(`ignore ${name}: no reason.`);
    if (typeof e.expires !== 'string' || !DATE.test(e.expires) || Number.isNaN(Date.parse(e.expires))) {
      errors.push(`ignore ${name}: no expiry date (YYYY-MM-DD).`);
    } else if (e.expires < today) {
      errors.push(`ignore ${name}: expired on ${e.expires}; review it or remove it.`);
    }
    if (seen.has(name)) errors.push(`ignore ${name}: listed twice.`);
    seen.add(name);
  });
  return errors;
}

/**
 * The gate. `npmExit` is npm's own exit status when known: a nonzero exit with no advisory in the report means
 * npm failed, which must not read as clean.
 */
export function gate(report, ignoreFile, { level = 'high', today = new Date().toISOString().slice(0, 10), npmExit } = {}) {
  const min = LEVELS.indexOf(level);
  if (min < 0) throw new Error(`unknown level ${level}`);
  const shape = checkReport(report);
  if (shape.length) return { ok: false, errors: shape, found: [], blocking: [], stale: [] };
  const errors = checkIgnore(ignoreFile, today);
  // Only a sound entry suppresses an advisory: an expired or reasonless one reports the advisory as well.
  const sound = (e) => isObject(e) && checkIgnore({ ignore: [e] }, today).length === 0;
  const ignored = new Set((Array.isArray(ignoreFile?.ignore) ? ignoreFile.ignore : []).filter(sound).map((e) => e.id));
  const found = advisories(report);
  const blocking = found.filter((a) => rank(a.severity) >= min && !ignored.has(a.id));
  for (const a of blocking) errors.push(`${a.severity} ${a.id} in ${a.package} is not on the ignore list.`);
  if (npmExit !== undefined && npmExit !== 0 && found.length === 0) {
    errors.push(`npm audit exited ${npmExit} but reported no advisory.`);
  }
  const stale = [...ignored].filter((id) => !found.some((a) => a.id === id));
  return { ok: errors.length === 0, errors, found, blocking, stale };
}

/** Reads the ignore list; a missing file is an empty list, a file that is not JSON is an error (thrown). */
export function readIgnore(path) {
  if (!existsSync(path)) return { ignore: [], missing: true };
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    throw new Error(`the ignore file ${path} is not valid JSON.`);
  }
}

function runAudit() {
  try {
    return { text: execFileSync('npm', ['audit', '--omit=dev', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }), npmExit: 0 };
  } catch (e) {
    // npm exits 1 when it finds advisories; the JSON is still on stdout.
    return { text: String(e.stdout ?? ''), npmExit: typeof e.status === 'number' ? e.status : 1 };
  }
}

export function main(argv = process.argv.slice(2), { stdin = () => readFileSync(0, 'utf8'), log = console.log, error = console.error } = {}) {
  const opt = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
  try {
    let text;
    let npmExit;
    if (argv.includes('--run')) ({ text, npmExit } = runAudit());
    else text = opt('--input') ? readFileSync(opt('--input'), 'utf8') : stdin();
    const exitArg = opt('--npm-exit');
    if (exitArg !== undefined) {
      npmExit = Number(exitArg);
      if (!Number.isInteger(npmExit)) throw new Error('--npm-exit needs an integer.');
    }
    const today = opt('--today');
    if (today !== undefined && !DATE.test(today)) throw new Error('--today needs YYYY-MM-DD.');
    const ignorePath = opt('--ignore') ?? DEFAULT_IGNORE;
    const ignoreFile = readIgnore(ignorePath);
    const r = gate(parseReport(text), ignoreFile, { level: opt('--level') ?? 'high', npmExit, ...(today ? { today } : {}) });
    if (ignoreFile.missing) log('audit gate: no ignore file; treating the ignore list as empty.');
    log(`audit gate: ${r.found.length} advisory id(s) in the report, ${ignoreFile.ignore?.length ?? 0} on the ignore list.`);
    for (const id of r.stale) log(`audit gate: ${id} is on the ignore list but no longer reported; remove it.`);
    if (!r.ok) {
      error(`audit gate: FAIL, ${r.errors.length} problem(s)\n- ${r.errors.join('\n- ')}`);
      return 1;
    }
    log('audit gate: ok');
    return 0;
  } catch (e) {
    error(`audit gate: FAIL, ${e.message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main();
