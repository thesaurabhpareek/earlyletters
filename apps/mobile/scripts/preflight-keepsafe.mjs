#!/usr/bin/env node
/**
 * NS-08-R5 (BL-976): recording backup stays off in every store build until the founder decides to turn it on (the
 * seven flip conditions of NS-08, docs/product/prd/08-keeping-and-trust.md on the locked pack #846). A store build is
 * an eas.json profile with `distribution: "store"`, or with no distribution, which EAS builds for the store
 * (production names none). Each must write EXPO_PUBLIC_BACKUP as "off" itself. The app reads only "on" as on
 * (src/lib/capabilities.ts, parseServerFeatures), so a blank or missing value is off in the bundle as well; the
 * written "off" is there so that a value in the EAS environment on expo.dev never decides it (UNVERIFIED: which of
 * the two EAS applies when both name the variable; this script cannot read expo.dev).
 *
 *   node scripts/preflight-keepsafe.mjs          # the report, exit 1 on any FAIL
 *   node scripts/preflight-keepsafe.mjs --json   # the same results as JSON
 *
 * The TestFlight preflight runs these checks too (`ops` wires them in); the production preflight has its own backup
 * check for the production profile (preflight-production.mjs, id `backup`). A founder decision that turns backup on
 * lands in its own PR, which changes this file and test/preflight-keepsafe.test.ts. Reads eas.json only: no build,
 * no network, no secret.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createReport } from './preflight-lib.mjs';

/** The names of the eas.json build profiles EAS builds for the store, sorted. */
export function storeProfiles(eas) {
  return Object.entries(eas?.build ?? {})
    .filter(([, p]) => (p?.distribution ?? 'store') === 'store')
    .map(([name]) => name)
    .sort();
}

/** NS-08-R5 over a parsed eas.json: one result per store profile, each with the id `backup-off`. */
export function keepSafeChecks(eas) {
  const { results, check, fail } = createReport();
  const names = storeProfiles(eas);
  if (names.length === 0) fail('eas.json names no store profile, so NS-08-R5 cannot be checked (expected preview, production and testflight).', 'backup-off');
  for (const name of names) {
    const value = eas.build[name].env?.EXPO_PUBLIC_BACKUP;
    check(
      value === 'off',
      `${name} profile: EXPO_PUBLIC_BACKUP=off (recording backup stays off in a store build, NS-08-R5)`,
      `${name} profile: EXPO_PUBLIC_BACKUP is ${value === undefined ? 'not written' : JSON.stringify(value)}. A store build writes "off" until the founder decides to turn backup on (NS-08-R5, the seven flip conditions).`,
      'backup-off',
    );
  }
  return results;
}

function main(argv) {
  const mobileDir = join(dirname(fileURLToPath(import.meta.url)), '..');
  let results;
  try {
    results = keepSafeChecks(JSON.parse(readFileSync(join(mobileDir, 'eas.json'), 'utf8')));
  } catch (e) {
    results = [{ level: 'FAIL', msg: `eas.json could not be read: ${e instanceof Error ? e.message : String(e)}`, id: 'backup-off' }];
  }
  const failed = results.filter((r) => r.level === 'FAIL').length;
  if (argv.includes('--json')) console.log(JSON.stringify({ results }, null, 2));
  else {
    console.log('Keep-safe preflight: recording backup in the store profiles (NS-08-R5)\n');
    for (const r of results) console.log(`${r.level.padEnd(10)} ${r.msg}`);
    console.log(failed ? '\nNot ready: fix every FAIL above.' : '\nNo FAIL.');
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
