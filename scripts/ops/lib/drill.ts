/**
 * Restore drill and restore replay (DATA-REQ-030, DATA-REQ-031, TDD 06 6.3 and
 * 6.4): pure helpers for scripts/ops/restore-drill.ts.
 *
 * The ledger: purge_ledger lives in Postgres, so a restore rolls it back too.
 * The purge worker copies it daily to the ops-ledger bucket
 * (purges/YYYY-MM-DD.jsonl, one {"t","id","at"} per line), which a database
 * restore does not touch. Replaying those ids after a restore re-deletes
 * everything that had been purged after the restore point.
 */
import { UUID_RE } from './target.ts';

export interface LedgerRow {
  t: 'entry' | 'child' | 'profile';
  id: string;
}

const DAY = 86_400_000;

/** Ledger file names for every UTC day from `since` to `until` inclusive. */
export function ledgerFileNames(since: Date, until: Date): string[] {
  const out: string[] = [];
  for (let d = Math.floor(since.getTime() / DAY) * DAY; d <= until.getTime(); d += DAY) {
    out.push(`purges/${new Date(d).toISOString().slice(0, 10)}.jsonl`);
  }
  return out;
}

/** Parses ledger lines, keeps rows purged at or after `since`, drops anything malformed, dedupes. */
export function parseLedger(texts: string[], since: Date): { rows: LedgerRow[]; skipped: number } {
  const seen = new Set<string>();
  const rows: LedgerRow[] = [];
  let skipped = 0;
  for (const text of texts) {
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const r = JSON.parse(line) as { t?: unknown; id?: unknown; at?: unknown };
        const at = typeof r.at === 'string' ? Date.parse(r.at) : NaN;
        if ((r.t !== 'entry' && r.t !== 'child' && r.t !== 'profile') || typeof r.id !== 'string' || !UUID_RE.test(r.id) || Number.isNaN(at)) {
          skipped++;
          continue;
        }
        if (at < since.getTime()) continue;
        const key = `${r.t}:${r.id.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ t: r.t, id: r.id.toLowerCase() });
      } catch {
        skipped++;
      }
    }
  }
  return { rows, skipped };
}

export function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

export type Counts = Record<string, number | string | null>;

/** Differences in row counts (numbers only) between two databases. */
export function compareCounts(a: Counts, b: Counts): { table: string; a: number; b: number }[] {
  const out: { table: string; a: number; b: number }[] = [];
  for (const k of Object.keys({ ...a, ...b }).sort()) {
    const x = a[k], y = b[k];
    if (typeof x === 'number' && typeof y === 'number' && x !== y) out.push({ table: k, a: x, b: y });
  }
  return out;
}

/**
 * Compares raw_sha256 for the same letters in the restored copy and in
 * production. A letter missing from production is fine if the ledger says it
 * was purged since; otherwise it is unexplained.
 */
export function compareSamples(restored: { id: string; sha: string }[], prod: { id: string; sha: string }[], purgedIds: Set<string>) {
  const byId = new Map(prod.map((p) => [p.id, p.sha]));
  let matched = 0, mismatched = 0, purged = 0, unexplained = 0;
  for (const r of restored) {
    const p = byId.get(r.id);
    if (p === undefined) {
      if (purgedIds.has(r.id)) purged++;
      else unexplained++;
    } else if (p === r.sha) matched++;
    else mismatched++;
  }
  return { sampled: restored.length, matched, mismatched, purged, unexplained };
}

export interface DrillInputs {
  health: Record<string, number>;
  rtoMinutes: number;
  rpoHours: number | null;
  sample: ReturnType<typeof compareSamples> | null;
  replayed: { entries: number; books: number; profiles: number } | null;
}

/** Targets: RPO 24 hours or less, RTO 4 hours or less (DATA-REQ-031), structure intact, hashes equal. */
export function drillVerdict(d: DrillInputs): { pass: boolean; findings: string[] } {
  const findings: string[] = [];
  for (const [k, v] of Object.entries(d.health)) if (v !== 0) findings.push(`schema health ${k} = ${v}`);
  if (d.rtoMinutes > 240) findings.push(`RTO ${d.rtoMinutes} min is over 4 hours`);
  if (d.rpoHours !== null && d.rpoHours > 24) findings.push(`RPO ${d.rpoHours.toFixed(1)} h is over 24 hours`);
  if (d.sample && d.sample.mismatched) findings.push(`${d.sample.mismatched} raw_sha256 mismatches`);
  if (d.sample && d.sample.unexplained) findings.push(`${d.sample.unexplained} sampled letters missing from production and not in the ledger`);
  return { pass: findings.length === 0, findings };
}
