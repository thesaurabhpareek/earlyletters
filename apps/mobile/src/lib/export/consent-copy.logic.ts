/**
 * This phone's copy of the person's consent record (BL-528, LEGAL-REQ-034 "works offline from local data"; ruling
 * CPrivO-21). Pure: test/export-consent-copy.test.ts runs every path in Node. After a consent read that succeeded in
 * full, for the signed-in account that owns this phone's letters, the phone keeps only the shapes the export already
 * writes (never `profile_id`, `subject_hash` or a retention column), the account and when it was read. An export that
 * cannot read the server then carries the copy as `included`, `read_at` saying when it was read. Another account's
 * copy is never used; with none, `unavailable` stands; a failed or partial read never replaces it. Class L3, one value
 * in the device settings, never synced or uploaded, not in the owner backup. Deleted on sign-out, on the
 * account-deletion request on this phone and by Erase everything (consent-copy.ts has the callers). While this phone
 * holds a note that a request is open, the copy is neither read nor written (`copyStoreFor`). Another phone gets that
 * note only when it reads the request from the server, which the first-run gate does only in some states; until then it
 * keeps, reads and refreshes its own copy as before, until it signs out. Data-map line: docs/ops/proposed/bl-528-consent-copy-data-map-line.md.
 */
import { exportAct, exportState, readServerRecords, type ReadOptions, type ServerRecords } from './server-records.logic';
import type { ExportConsentHistory, ExportPolicyAct } from './schema';
import type { OpenRequest } from '../account-deletion/open-request';
import { deletionRequestOpen } from './scope.logic';

/** The settings key. */
export const CONSENT_COPY_KEY = 'export.consentCopy';

/** Where the copy lives: one string value. `write` may throw (a full or locked database); the caller ignores it. */
export interface ConsentCopyStore { read(): string | null; write(value: string): void }

type Current = ExportConsentHistory['current'][number];

/** The stored value: the exported shapes, the account they were read for, and when. Nothing else. */
export interface ConsentCopy { v: 1; account_id: string; read_at: string; current: Current[]; acts: ExportPolicyAct[] }

// Every row goes through the server read's own checks, which build the exported shape field by field: a column the
// export does not carry can never ride into the copy, and a stored row this app cannot describe is no copy at all.
const asAct = (a: unknown): ExportPolicyAct | null => (isRecord(a) ? exportAct({ ...a, accepted_at: a.at }) : null);
const asCurrent = (c: unknown): Current | null => (isRecord(c) ? exportState({ ...c, accepted_at: c.at }) : null);
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
function checked(acts: unknown[], current: unknown[]): Pick<ConsentCopy, 'acts' | 'current'> | null {
  const a = acts.map(asAct);
  const c = current.map(asCurrent);
  return a.includes(null) || c.includes(null) ? null : { acts: a as ExportPolicyAct[], current: c as Current[] };
}

/** The value to store for a record read for `accountId`, or null when the record was not read in full. */
export function encodeConsentCopy(accountId: string, history: ExportConsentHistory): string | null {
  if (history.status !== 'included' || !history.read_at || !accountId) return null;
  const rows = checked(history.acts, history.current);
  return rows ? JSON.stringify({ v: 1, account_id: accountId, read_at: history.read_at, current: rows.current, acts: rows.acts } satisfies ConsentCopy) : null;
}

/** The record the export carries from a stored copy, or null: no copy, another account's, or one not readable whole. */
export function consentFromCopy(raw: string | null, accountId: string): ExportConsentHistory | null {
  if (!raw || !accountId) return null;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(v) || v.v !== 1 || v.account_id !== accountId) return null;
  if (typeof v.read_at !== 'string' || Number.isNaN(Date.parse(v.read_at)) || !Array.isArray(v.acts) || !Array.isArray(v.current)) return null;
  const rows = checked(v.acts, v.current);
  return rows ? { status: 'included', read_at: v.read_at, current: rows.current, acts: rows.acts } : null;
}

/** A full read for `accountId` replaces the copy; an `unavailable` one is answered from it. Never throws. */
export function withConsentCopy(live: ExportConsentHistory, accountId: string, store: ConsentCopyStore | null | undefined): ExportConsentHistory {
  if (!store) return live;
  if (live.status === 'included') {
    const value = encodeConsentCopy(accountId, live);
    try {
      if (value) store.write(value);
    } catch {
      // The export still carries the record it read; the next full read tries again.
    }
    return live;
  }
  if (live.status !== 'unavailable') return live;
  try {
    return consentFromCopy(store.read(), accountId) ?? live;
  } catch {
    return live;
  }
}

/**
 * The store the export may use: none while an account-deletion request for this account is open (DATA-REQ-053), so the
 * copy is neither read nor written then. export/device.ts passes the phone's note on the request.
 */
export function copyStoreFor(note: OpenRequest | null, authUserId: string | null | undefined, nowMs: number, store: ConsentCopyStore | null): ConsentCopyStore | null {
  return deletionRequestOpen(note, authUserId, nowMs) ? null : store;
}

/**
 * What export/device.ts runs. readServerRecords answers `included` or `unavailable` only for a signed-in account that
 * owns this phone's letters, so signed out or another account never touches the copy. `copy` is null while a request is open.
 */
export async function readServerRecordsWithCopy(o: ReadOptions, copy: ConsentCopyStore | null): Promise<ServerRecords> {
  const server = await readServerRecords(o);
  return o.authUserId ? { ...server, consent: withConsentCopy(server.consent, o.authUserId, copy) } : server;
}
