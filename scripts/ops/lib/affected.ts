/**
 * Affected-user enumeration (LEGAL-REQ-039): pure helpers for
 * scripts/ops/enumerate-affected.ts. The database side is ops_incident_scope().
 */
import { UUID_RE } from './target.ts';

export const TABLES = ['entries', 'entry_versions', 'children', 'profiles', 'child_members', 'dictionary_terms', 'policy_acceptances', 'audit_events', 'auth.users'] as const;
export const BUCKETS = ['entry-photos', 'entry-audio', 'inbox', 'child-photos', 'avatars', 'exports'] as const;

export interface Scope {
  all?: boolean;
  profile_ids?: string[];
  child_ids?: string[];
  tables?: string[];
  buckets?: string[];
  from?: string;
  until?: string;
}

export interface AffectedProfile {
  profile_id: string;
  categories: string[];
  letters: number;
  photos: number;
  books: number;
  roles: string[] | null;
}

export interface ScopeResult {
  profiles: AffectedProfile[];
  totals: { profiles: number; letters: number; photos: number };
  audio_on_server: boolean;
  escrow_present: boolean;
}

/** Builds and checks a scope from CLI flags. Returns problems instead of throwing. */
export function buildScope(f: { all?: boolean; profiles?: string[]; children?: string[]; tables?: string[]; buckets?: string[]; from?: string; until?: string }): { scope: Scope; problems: string[] } {
  const problems: string[] = [];
  const scope: Scope = {};
  if (f.all) scope.all = true;
  if (f.profiles?.length) scope.profile_ids = f.profiles;
  if (f.children?.length) scope.child_ids = f.children;
  if (f.tables?.length) scope.tables = f.tables;
  if (f.buckets?.length) scope.buckets = f.buckets;
  if (f.from) scope.from = f.from;
  if (f.until) scope.until = f.until;
  for (const id of [...(scope.profile_ids ?? []), ...(scope.child_ids ?? [])]) if (!UUID_RE.test(id)) problems.push('ids must be UUIDs');
  for (const t of scope.tables ?? []) if (!(TABLES as readonly string[]).includes(t)) problems.push(`unknown table: ${t}`);
  for (const b of scope.buckets ?? []) if (!(BUCKETS as readonly string[]).includes(b)) problems.push(`unknown bucket: ${b}`);
  for (const t of [scope.from, scope.until]) if (t !== undefined && Number.isNaN(Date.parse(t))) problems.push('from and until must be ISO times');
  if (!scope.all && !scope.profile_ids && !scope.child_ids && !scope.tables && !scope.buckets) problems.push('give a scope: --all, --profile, --child, --table or --bucket');
  return { scope, problems: [...new Set(problems)] };
}

const csvCell = (v: string): string => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** CSV for the notification mail merge: one row per person. Holds emails: write it with mode 0600. */
export function toCsv(rows: AffectedProfile[], emails: Map<string, string | null>): string {
  const head = 'profile_id,email,categories,letters,photos,books,roles';
  const lines = rows.map((r) => [r.profile_id, emails.get(r.profile_id) ?? '', r.categories.join(' '), String(r.letters), String(r.photos), String(r.books), (r.roles ?? []).join(' ')].map(csvCell).join(','));
  return [head, ...lines].join('\n') + '\n';
}

/** Counts per data category, for regulator notices. Counts only. */
export function categoryCounts(rows: AffectedProfile[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) for (const c of r.categories) out[c] = (out[c] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * Notification clocks from discovery (LEGAL-REQ-039). Which ones apply is
 * counsel's call; the incident plan uses the shortest one that applies.
 */
export function clocks(discoveredAt: Date): { name: string; due: string; note: string }[] {
  const at = (h: number) => new Date(discoveredAt.getTime() + h * 3600_000).toISOString();
  return [
    { name: 'DPDP (India), if it applies', due: at(72), note: '72 hours to the Data Protection Board' },
    { name: 'US state breach laws', due: 'most expedient time', note: 'without unreasonable delay; some states set 30 to 60 days' },
    { name: 'FTC Health Breach Notification Rule, if it applies', due: at(60 * 24), note: '60 days to individuals and the FTC' },
  ];
}
