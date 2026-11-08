/**
 * Local agreement record (table `agreements`, local schema v10; PR #597 data design 2.1). Append-only: a row is
 * written once per (document, version, action) and never changed, except `uploaded_at` and `server_act_id`, which
 * the 1.1 upload sets once. L2, never logged, never in analytics. Rules: lib/agreements.logic.ts.
 */
import type { AgreementDocument, AgreementRow } from '../../agreements.logic';
import { changes, type RepoContext } from './context';

/** Inserts each row unless that act is already recorded. Returns how many rows were new. */
export function insertOnce({ db }: RepoContext, rows: readonly AgreementRow[]): number {
  let added = 0;
  for (const r of rows) {
    db.run(
      // ON CONFLICT on the act's key only: a missing value still fails (OR IGNORE would drop it silently).
      `INSERT INTO agreements (id, document, version, action, surface, recorded_at, app_version, rendered_sha256)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (document, version, action) DO NOTHING`,
      r.id, r.document, r.version, r.action, r.surface, r.recordedAt, r.appVersion, r.renderedSha256,
    );
    added += changes(db);
  }
  return added;
}

/** True when this phone holds any accept of `document` (any version). */
export function hasAccepted({ db }: RepoContext, document: AgreementDocument): boolean {
  return db.get<{ n: number }>("SELECT count(*) AS n FROM agreements WHERE document = ? AND action = 'accept'", document)?.n ? true : false;
}

export function list({ db }: RepoContext): AgreementRow[] {
  return db.all<AgreementRow>(
    `SELECT id, document, version, action, surface, recorded_at AS recordedAt, app_version AS appVersion, rendered_sha256 AS renderedSha256
     FROM agreements ORDER BY recorded_at, document`,
  );
}
