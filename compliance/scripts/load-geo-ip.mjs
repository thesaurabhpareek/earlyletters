#!/usr/bin/env node
// Loads DB-IP "IP to Country Lite" into ops.geo_ip_ranges (20261031000000; CTO ruling CR-26).
// Licence: CC BY 4.0. Attribution to DB-IP.com is required (link: https://db-ip.com) wherever the
// results are used; see .claude/skills/regulatory-compliance/references/sanctions.md.
//
// Monthly, from a machine that can reach db-ip.com and the database (the founder's computer or a workflow
// with the DB secret; Claude sessions cannot reach either):
//   1. Download the CSV from https://db-ip.com/db/download/ip-to-country-lite (dbip-country-lite-YYYY-MM.csv.gz).
//   2. node compliance/scripts/load-geo-ip.mjs --csv dbip-country-lite-2026-11.csv.gz --version 2026-11 --dry-run
//   3. SUPABASE_DB_URL=postgresql://... node compliance/scripts/load-geo-ip.mjs --csv ... --version 2026-11
//
// It validates every row (two addresses of one family, start <= end, a two-letter code), refuses a file with
// fewer than --min-rows valid rows (default 200000) or more than 0.1% bad rows, and replaces the table and
// ops.geo_ip_meta in one transaction through psql. A failed load leaves the old data in place. During the
// load the auth hook cannot read the table and fails open (lock_timeout 200ms), so run it at a quiet hour.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { isIP } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Compare two addresses of the same family as fixed-width big integers.
function ipToBigInt(ip) {
  if (isIP(ip) === 4) return ip.split('.').reduce((acc, o) => (acc << 8n) + BigInt(Number(o)), 0n);
  let [head, tail = ''] = ip.includes('::') ? ip.split('::') : [ip, null];
  const h = head ? head.split(':') : [];
  const t = tail === null ? [] : (tail ? tail.split(':') : []);
  if (t.length && /\./.test(t[t.length - 1])) {
    const v4 = ipToBigInt(t.pop());
    t.push((v4 >> 16n).toString(16), (v4 & 0xffffn).toString(16));
  }
  const groups = tail === null ? h : [...h, ...Array(8 - h.length - t.length).fill('0'), ...t];
  return groups.reduce((acc, g) => (acc << 16n) + BigInt(parseInt(g || '0', 16)), 0n);
}

export function parseLine(line) {
  const parts = line.trim().split(',').map((s) => s.replace(/^"|"$/g, ''));
  if (parts.length < 3) return null;
  const [start, end, cc] = parts;
  const f = isIP(start);
  if (!f || f !== isIP(end) || !/^[A-Z]{2}$/.test(cc)) return null;
  if (ipToBigInt(start) > ipToBigInt(end)) return null;
  return { start, end, cc };
}

export function validate(text, { minRows = 200000, maxBadRatio = 0.001 } = {}) {
  const rows = [];
  let bad = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const r = parseLine(line);
    if (r) rows.push(r); else bad++;
  }
  const problems = [];
  if (rows.length < minRows) problems.push(`only ${rows.length} valid rows (minimum ${minRows})`);
  if (bad / Math.max(1, rows.length + bad) > maxBadRatio) problems.push(`${bad} bad rows (over ${maxBadRatio * 100}%)`);
  const starts = new Set();
  for (const r of rows) { if (starts.has(r.start)) { problems.push(`duplicate range start ${r.start}`); break; } starts.add(r.start); }
  return { rows, bad, problems };
}

export function psqlScript(csvPath, version, count) {
  if (!/^[A-Za-z0-9._-]{1,40}$/.test(version)) throw new Error('version must be letters, digits, dot, dash or underscore');
  return [
    '\\set ON_ERROR_STOP on',
    'begin;',
    "select set_config('lock_timeout', '10s', true);",
    'lock table ops.geo_ip_ranges in access exclusive mode;',
    'truncate ops.geo_ip_ranges;',
    `\\copy ops.geo_ip_ranges (ip_start, ip_end, country) from '${csvPath.replace(/'/g, "''")}' with (format csv)`,
    `do $$ begin if (select count(*) from ops.geo_ip_ranges) <> ${count} then raise exception 'row count mismatch'; end if; end $$;`,
    `insert into ops.geo_ip_meta (id, source, source_version, row_count, loaded_at) values (true, 'dbip-country-lite', '${version}', ${count}, now())`,
    '  on conflict (id) do update set source = excluded.source, source_version = excluded.source_version,',
    '    row_count = excluded.row_count, loaded_at = excluded.loaded_at;',
    'commit;',
  ].join('\n') + '\n';
}

function main(argv) {
  const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const file = arg('--csv');
  const version = arg('--version');
  if (!file || !version) { console.error('usage: --csv <file[.gz]> --version <YYYY-MM> [--min-rows N] [--dry-run]'); process.exit(64); }
  const raw = readFileSync(file);
  const text = (file.endsWith('.gz') ? gunzipSync(raw) : raw).toString('utf8');
  const { rows, bad, problems } = validate(text, { minRows: Number(arg('--min-rows') ?? 200000) });
  const v4 = rows.filter((r) => isIP(r.start) === 4).length;
  console.log(`${rows.length} valid rows (${v4} IPv4, ${rows.length - v4} IPv6), ${bad} skipped`);
  if (problems.length) { console.error(`refusing to load: ${problems.join('; ')}`); process.exit(1); }
  if (argv.includes('--dry-run')) { console.log('dry run: nothing loaded'); return; }
  const db = process.env.SUPABASE_DB_URL;
  if (!db) { console.error('SUPABASE_DB_URL is required (or pass --dry-run)'); process.exit(64); }
  const dir = mkdtempSync(join(tmpdir(), 'geo-'));
  try {
    const csv = join(dir, 'ranges.csv');
    writeFileSync(csv, rows.map((r) => `${r.start},${r.end},${r.cc}`).join('\n') + '\n');
    const sql = join(dir, 'load.sql');
    writeFileSync(sql, psqlScript(csv, version, rows.length));
    // The URL goes in the environment (PGDATABASE accepts a connection URI), not argv, so `ps` does not show it.
    const r = spawnSync('psql', ['-X', '-q', '-f', sql], { stdio: 'inherit', env: { ...process.env, PGDATABASE: db } });
    if (r.status !== 0) { console.error('load failed; the previous data is unchanged'); process.exit(1); }
    console.log(`loaded ${rows.length} ranges, version ${version}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
