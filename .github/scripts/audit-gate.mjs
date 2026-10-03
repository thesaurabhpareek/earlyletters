#!/usr/bin/env node
// npm audit with a dated ignore list (CI-05). npm has no built-in way to
// ignore one advisory, so this reads `npm audit --json` and fails when an
// advisory at or above the gate level is not in .github/audit-ignore.json, or
// when an ignore entry has expired.
//
// Usage: npm audit --omit=dev --json | node .github/scripts/audit-gate.mjs [--level high] [--ignore <file>]
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const LEVELS = ['info', 'low', 'moderate', 'high', 'critical'];
const ID = /GHSA(-[23456789cfghjmpqrvwx]{4}){3}/;

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

export function gate(report, ignoreFile, { level = 'high', today = new Date().toISOString().slice(0, 10) } = {}) {
  const min = LEVELS.indexOf(level);
  if (min < 0) throw new Error(`unknown level ${level}`);
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
  return { ok: errors.length === 0, errors, found, stale };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
  const report = JSON.parse(readFileSync(0, 'utf8'));
  const ignoreFile = JSON.parse(readFileSync(opt('--ignore', '.github/audit-ignore.json'), 'utf8'));
  const r = gate(report, ignoreFile, { level: opt('--level', 'high') });
  console.log(`audit gate: ${r.found.length} advisory(ies) found, ${ignoreFile.ignore?.length ?? 0} on the ignore list.`);
  for (const id of r.stale) console.log(`audit gate: ${id} is on the ignore list but no longer reported; remove it.`);
  if (!r.ok) {
    console.error(`audit gate: ${r.errors.length} problem(s)\n- ${r.errors.join('\n- ')}`);
    process.exit(1);
  }
  console.log('audit gate: ok');
}
