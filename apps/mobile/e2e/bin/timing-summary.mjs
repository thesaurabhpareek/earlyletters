#!/usr/bin/env node
// Reads the TIMING lines the Maestro timing flows print (flows/E2E-18, E2E-19; scripts/timing.js) and prints a
// table of p50 and p95 with the sample count. Content-free: only `TIMING <name>_ms=<whole number>` lines are
// read; every other line of the log is ignored and never printed.
//
//   node apps/mobile/e2e/bin/timing-summary.mjs <maestro-log-file>
//   maestro test ... | tee run.log; node apps/mobile/e2e/bin/timing-summary.mjs run.log
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const SAMPLES_NEEDED = 200;
const LINE = /^TIMING ([a-z_]+_ms)=(\d+)$/;

/** Nearest-rank percentile (the same rule as test/perf.sql.test.ts). */
export function percentile(values, p) {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)];
}

export function parseTimings(text) {
  const out = {};
  for (const raw of text.split('\n')) {
    const m = LINE.exec(raw.trim());
    if (m) (out[m[1]] ??= []).push(Number(m[2]));
  }
  return out;
}

export function summarise(byName) {
  return Object.keys(byName)
    .sort()
    .map((name) => ({ name, samples: byName[name].length, p50: percentile(byName[name], 50), p95: percentile(byName[name], 95) }));
}

export function renderTable(rows) {
  const lines = ['| timing | samples | p50 ms | p95 ms |', '|---|---|---|---|'];
  for (const r of rows) {
    const n = r.samples < SAMPLES_NEEDED ? `${r.samples} (need ${SAMPLES_NEEDED})` : String(r.samples);
    lines.push(`| ${r.name} | ${n} | ${r.p50} | ${r.p95} |`);
  }
  return lines.join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) {
    console.error('usage: timing-summary.mjs <maestro-log-file>');
    process.exit(2);
  }
  const rows = summarise(parseTimings(readFileSync(file, 'utf8')));
  if (rows.length === 0) {
    console.error('timing-summary: no TIMING lines in the log');
    process.exit(1);
  }
  console.log(renderTable(rows));
}
