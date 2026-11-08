#!/usr/bin/env node
// Writes docs/qa/release-test-catalog.csv from scripts/qa/release-catalog.rows.mjs.
//   node scripts/qa/release-catalog.mjs           write the CSV
//   node scripts/qa/release-catalog.mjs --check   exit 1 if the CSV on disk differs (used by the test)
//   node scripts/qa/release-catalog.mjs --summary print counts by status, lane and release
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROWS } from './release-catalog.rows.mjs';

export const COLUMNS = ['id', 'area', 'title', 'kind', 'priority', 'release', 'lane', 'env', 'devices', 'covered_by', 'status', 'steps', 'expected'];
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CSV_PATH = join(root, 'docs', 'qa', 'release-test-catalog.csv');

const cell = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
export function toCsv(rows = ROWS) {
  return [COLUMNS.join(','), ...rows.map((r) => r.map((v) => cell(String(v))).join(','))].join('\n') + '\n';
}

export function summary(rows = ROWS) {
  const by = (i) => rows.reduce((m, r) => ((m[r[i]] = (m[r[i]] ?? 0) + 1), m), {});
  return { total: rows.length, status: by(10), lane: by(6), release: by(5), priority: by(4) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const csv = toCsv();
  if (process.argv.includes('--check')) {
    const now = readFileSync(CSV_PATH, 'utf8');
    if (now !== csv) {
      console.error('release-test-catalog.csv is stale: run node scripts/qa/release-catalog.mjs');
      process.exit(1);
    }
  } else if (process.argv.includes('--summary')) {
    console.log(JSON.stringify(summary(), null, 2));
  } else {
    writeFileSync(CSV_PATH, csv);
    console.log(`wrote ${ROWS.length} rows to docs/qa/release-test-catalog.csv`);
  }
}
