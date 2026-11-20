/**
 * BL-566: what is inside a backup, table by table, read from the dump itself.
 * Pure logic; scripts/ops/dump-manifest.ts wires it to pg_restore.
 *
 * The restore drill compares a restored copy with THIS (every table the dump
 * holds, and the number of row level security policies), so a restore that
 * lost one table, or one table's rows, cannot print PASS. It reads COPY blocks
 * only to count their lines: no row is kept or printed.
 */

/** Tables the product cannot work without. The backup job checks the same list (staging-backup.yml, "required"). */
export const REQUIRED_TABLES = [
  'public.entries', 'public.entry_versions', 'public.children', 'public.child_members', 'public.profiles',
  'public.policy_acceptances', 'public.deletion_requests', 'public.purge_ledger', 'public.sync_epochs', 'auth.users',
] as const;

export const TABLE_NAME = /^[a-z_][a-z0-9_]{0,62}\.[a-z_][a-z0-9_]{0,62}$/;
export const MANIFEST_HEADER = '# early-letters dump manifest v1 (counts only)';

export interface Manifest {
  policies: number;
  tables: Record<string, number>;
}

const COPY_LINE = /^COPY ([a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*) \(/;

/**
 * Counts the rows of every COPY block in `pg_restore --data-only -f -` output, one line at a time (text COPY keeps
 * one row per line and ends at a line holding `\.`). Rows are counted, never kept. A COPY of a table whose name is
 * not plain lower-case is counted in `unparsed`, not skipped: the drill must not quietly leave a table out.
 */
export class CopyCounter {
  tables: Record<string, number> = {};
  unparsed = 0;
  private current: string | null = null;
  private inBlock = false;
  push(line: string): void {
    if (this.inBlock) {
      if (line === '\\.') {
        this.inBlock = false;
        this.current = null;
      } else if (this.current) this.tables[this.current]++;
      return;
    }
    if (!line.startsWith('COPY ')) return;
    this.inBlock = true;
    const m = COPY_LINE.exec(line);
    if (m) {
      this.current = m[1];
      this.tables[this.current] ??= 0;
    } else {
      this.current = null;
      this.unparsed++;
    }
  }
}

export function tablesFromCopyText(lines: Iterable<string>): { tables: Record<string, number>; unparsed: number } {
  const c = new CopyCounter();
  for (const l of lines) c.push(l);
  return { tables: c.tables, unparsed: c.unparsed };
}

/** Policies in `pg_restore --list` output (each row level security policy is one `POLICY` entry). */
export function policiesFromToc(toc: string): number {
  return toc.split('\n').filter((l) => !l.startsWith(';') && / POLICY /.test(l)).length;
}

export function formatManifest(m: Manifest): string {
  const names = Object.keys(m.tables).sort();
  return [MANIFEST_HEADER, `policies=${m.policies}`, ...names.map((t) => `table ${t}=${m.tables[t]}`)].join('\n') + '\n';
}

export function parseManifest(text: string): { manifest: Manifest; problem: null } | { manifest: null; problem: string } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines[0] !== MANIFEST_HEADER) return { manifest: null, problem: 'the manifest file does not start with the dump-manifest header' };
  let policies: number | null = null;
  const tables: Record<string, number> = {};
  for (const l of lines.slice(1)) {
    let m = /^policies=(\d{1,9})$/.exec(l);
    if (m) {
      policies = Number(m[1]);
      continue;
    }
    m = /^table ([a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*)=(\d{1,15})$/.exec(l);
    if (m && TABLE_NAME.test(m[1])) {
      tables[m[1]] = Number(m[2]);
      continue;
    }
    return { manifest: null, problem: 'the manifest file has a line that is not "policies=N" or "table schema.name=N"' };
  }
  if (policies === null) return { manifest: null, problem: 'the manifest file has no policies line' };
  return { manifest: { policies, tables }, problem: null };
}

/** Findings that make a manifest unfit to judge a restore by: a required table missing, or no policies. */
export function manifestGaps(m: Manifest): string[] {
  const gaps: string[] = [];
  for (const t of REQUIRED_TABLES) if (!(t in m.tables)) gaps.push(`the dump holds no data section for ${t}`);
  if (m.policies < 1) gaps.push('the dump holds no row level security policies');
  return gaps;
}
