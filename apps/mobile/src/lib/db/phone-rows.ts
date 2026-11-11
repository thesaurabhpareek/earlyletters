/**
 * Whether this phone holds any book, letter or held draft (see auth/account-claim.logic.ts for why the
 * answer is a superset of what takeOwnership claims). Pure; kept here so lib/sync can use it without
 * importing auth code.
 */
import type { SqlDb } from './sql';

/** Any book or letter row on this phone, in any state, or any held draft. */
export function phoneHoldsAnyRow(db: Pick<SqlDb, 'get'>): boolean {
  const r = db.get<{ any_rows: number }>(
    'SELECT (EXISTS (SELECT 1 FROM children) OR EXISTS (SELECT 1 FROM entries) OR EXISTS (SELECT 1 FROM drafts WHERE held_kind IS NOT NULL)) AS any_rows',
  );
  return !!r && Number(r.any_rows) === 1;
}
