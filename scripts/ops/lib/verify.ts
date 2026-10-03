/**
 * Cross-system deletion verification (LEGAL-REQ-029, DATA-REQ-034, TDD 05 9.4):
 * pure evaluation of what scripts/ops/verify-deletion.ts gathered from
 * Postgres, Storage, Auth, the Apple token store and (optionally) PostHog.
 *
 * What may legitimately remain (and is reported as such, not as a failure):
 *  - pseudonymised policy_acceptances (no profile id, 3 years, DATA-REQ-064);
 *  - the ops.audit_log security trail (12 months, LEGAL-REQ-033);
 *  - purge_ledger ids (60 days, restore replay) and the request row itself (3 years).
 */
export interface Gathered {
  residue: { table_schema: string; table_name: string; column_name: string }[];
  storageResidue: { bucket_id: string; name: string }[];
  owned: { bucket_id: string; name: string }[];
  authUserExists: boolean;
  appleTokenRows: number;
  request: { status?: string; profile_linked?: boolean; receipt?: Record<string, unknown>; steps?: Record<string, string> } | null;
  /** null when not checked (no PostHog key or no ids given). */
  posthogPersonsFound: number | null;
}

export interface Check {
  name: string;
  ok: boolean;
  /** Counts or enums only. */
  detail: string;
}

export function evaluateDeletion(g: Gathered): { ok: boolean; checks: Check[] } {
  const checks: Check[] = [
    { name: 'postgres: no column in public or ops holds the person id', ok: g.residue.length === 0, detail: g.residue.length ? g.residue.map((r) => `${r.table_schema}.${r.table_name}.${r.column_name}`).join(', ') : 'none' },
    { name: 'storage: no object under a folder named for the person', ok: g.storageResidue.length === 0, detail: `${g.storageResidue.length} objects` },
    { name: 'storage: no object owned by the person', ok: g.owned.length === 0, detail: `${g.owned.length} objects` },
    { name: 'auth: the user is gone', ok: !g.authUserExists, detail: g.authUserExists ? 'user exists' : 'not found' },
    { name: 'apple: no stored refresh token', ok: g.appleTokenRows === 0, detail: `${g.appleTokenRows} rows` },
  ];
  if (g.request) {
    const steps = g.request.steps ?? {};
    const open = Object.entries(steps).filter(([, s]) => s !== 'done' && s !== 'not_applicable').map(([k]) => k);
    checks.push({ name: 'request: completed and unlinked from the person', ok: g.request.status === 'completed' && g.request.profile_linked === false, detail: `status ${g.request.status ?? 'missing'}` });
    checks.push({ name: 'request: every step done or not applicable', ok: open.length === 0, detail: open.length ? open.join(', ') : 'all closed' });
    checks.push({ name: 'request: receipt says verified', ok: g.request.receipt?.verified === true, detail: `apple ${String(g.request.receipt?.apple ?? 'unknown')}` });
  }
  if (g.posthogPersonsFound !== null) {
    checks.push({ name: 'posthog: no person for the analytics ids (deletion runs in the background; recheck within 14 days)', ok: g.posthogPersonsFound === 0, detail: `${g.posthogPersonsFound} persons` });
  }
  return { ok: checks.every((c) => c.ok), checks };
}
