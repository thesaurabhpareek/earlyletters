#!/usr/bin/env node
// npm audit with a dated ignore list (CI-05). npm has no built-in way to
// ignore one advisory, so this reads `npm audit --json` and fails when an
// advisory at or above the gate level is not in .github/audit-ignore.json, or
// when an ignore entry has expired.
//
// Fails closed: input that is empty, not JSON, an npm error object, or not an
// npm audit report (auditReportVersion 2 with a `vulnerabilities` object and
// `metadata.vulnerabilities` counts) fails the gate, so an audit that did not
// run never reads as a clean one. With --npm-exit <code>, a nonzero npm exit
// status must be explained by advisories in the report.
//
// Usage: npm audit --omit=dev --json | node .github/scripts/audit-gate.mjs [--level high] [--ignore <file>] [--npm-exit <code>]
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const LEVELS = ['info', 'low', 'moderate', 'high', 'critical'];
const ID = /GHSA(-[23456789cfghjmpqrvwx]{4}){3}/;

const isObject = (x) => typeof x === 'object' && x !== null && !Array.isArray(x);

// Problems that mean the report cannot be trusted as an audit result.
export function checkReport(report) {
  if (!isObject(report)) return ['the audit output is not a JSON object.'];
  if ('error' in report) {
    const e = report.error;
    const detail = isObject(e) ? [e.code, e.summary].filter(Boolean).join(': ') : String(e);
    return [`npm audit reported an error${detail ? `: ${detail}` : ''}.`];
  }
  const errors = [];
  if (report.auditReportVersion !== 2) errors.push(`unexpected auditReportVersion ${JSON.stringify(report.auditReportVersion)} (expected 2).`);
  if (!isObject(report.vulnerabilities)) errors.push('the report has no "vulnerabilities" object.');
  if (!isObject(report.metadata?.vulnerabilities)) errors.push('the report has no "metadata.vulnerabilities" counts.');
  return errors;
}

// Parses raw `npm audit --json` output, failing closed.
export function parseReport(text) {
  if (!text || !text.trim()) throw new Error('empty input: npm audit wrote nothing.');
  let report;
  try {
    report = JSON.parse(text);
  } catch (e) {
    throw new Error(`npm audit output is not JSON: ${e.message}`);
  }
  return report;
}

// Every advisory object in the report, once, keyed by GHSA id.
export function advisories(report) {
  const found = new Map();
  for (const [pkg, v] of Object.entries(report.vulnerabilities ?? {})) {
    for (const via of v.via ?? []) {
      if (typeof via !== 'object' || !via) continue;
      const id = ID.exec(via.url ?? '')?.[0] ?? `npm-${via.source}`;
      if (!found.has(id)) found.set(id, { id, package: via.name ?? pkg, severity: via.severity, title: via.title });
    }
  }
  return [...found.values()];
}

export function gate(report, ignoreFile, { level = 'high', today = new Date().toISOString().slice(0, 10), npmExit } = {}) {
  const min = LEVELS.indexOf(level);
  if (min < 0) throw new Error(`unknown level ${level}`);
  const shape = checkReport(report);
  if (shape.length) return { ok: false, errors: shape, found: [], stale: [] };
  const errors = [];
  const ignored = new Map();
  for (const e of ignoreFile.ignore ?? []) {
    for (const k of ['id', 'package', 'reason', 'added', 'expires']) {
      if (!e[k]) errors.push(`ignore entry ${e.id ?? '(no id)'}: missing "${k}".`);
    }
    if (e.expires && e.expires < today) errors.push(`ignore entry ${e.id} (${e.package}) expired on ${e.expires}. Review it.`);
    ignored.set(e.id, e);
  }
  const found = advisories(report);
  const blocking = found.filter((a) => LEVELS.indexOf(a.severity) >= min && !ignored.has(a.id));
  for (const a of blocking) errors.push(`${a.severity}: ${a.package} ${a.id} ${a.title ?? ''}`.trim());
  const stale = [...ignored.keys()].filter((id) => !found.some((a) => a.id === id));
  // npm exits nonzero when it finds advisories at --audit-level, and also when
  // it fails. A nonzero exit with nothing at or above the level found is a
  // failure we cannot explain, so it fails.
  if (npmExit !== undefined && npmExit !== 0) {
    const atLevel = found.some((a) => LEVELS.indexOf(a.severity) >= min);
    if (!atLevel) errors.push(`npm audit exited ${npmExit} but reported no advisory at or above ${level}.`);
  }
  return { ok: errors.length === 0, errors, found, stale };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
  const exitArg = opt('--npm-exit', undefined);
  const npmExit = exitArg === undefined ? undefined : Number(exitArg);
  if (exitArg !== undefined && !Number.isInteger(npmExit)) {
    console.error(`audit gate: --npm-exit needs an integer, got ${JSON.stringify(exitArg)}.`);
    process.exit(1);
  }
  let report;
  try {
    report = parseReport(readFileSync(0, 'utf8'));
  } catch (e) {
    console.error(`audit gate: ${e.message}`);
    process.exit(1);
  }
  const ignoreFile = JSON.parse(readFileSync(opt('--ignore', '.github/audit-ignore.json'), 'utf8'));
  const r = gate(report, ignoreFile, { level: opt('--level', 'high'), npmExit });
  console.log(`audit gate: ${r.found.length} advisory(ies) found, ${ignoreFile.ignore?.length ?? 0} on the ignore list.`);
  for (const id of r.stale) console.log(`audit gate: ${id} is on the ignore list but no longer reported; remove it.`);
  if (!r.ok) {
    console.error(`audit gate: ${r.errors.length} problem(s)\n- ${r.errors.join('\n- ')}`);
    process.exit(1);
  }
  console.log('audit gate: ok');
}
