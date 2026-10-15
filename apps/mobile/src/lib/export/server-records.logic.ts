/**
 * The server's part of account.json (schema 1.2.0; BL-323, LEGAL-REQ-034):
 * the consent record (`policy_acceptances` and `my_policy_state`, own rows
 * under row-level security) and the spelling-list words held for the account
 * (`dictionary_terms`). Pure: the reads are injected, so every path is tested
 * without a network (test/export-server-records.test.ts). `device.ts` wires
 * the Supabase reads.
 *
 * Export never waits on the network for long and never fails because of it
 * (DATA-REQ-052, C-NFR-004): signed out, a different account, offline, an
 * error or the timeout all keep the phone's export and say why in
 * `consent_history.status`. Rows are never silently cut: a reader that cannot
 * return every row fails, and the status is then `unavailable`.
 */
import type { ExportConsentHistory, ExportDictionaryTerm, ExportPolicyAct, PolicyAction } from './schema';

/** A read result as PostgREST returns it. */
export interface ReadResult {
  data: unknown[] | null;
  error: unknown;
}

/** The three reads. Each gets an AbortSignal; each must return every row or an error. */
export interface ServerRecordsReader {
  acts(signal: AbortSignal): Promise<ReadResult>;
  state(signal: AbortSignal): Promise<ReadResult>;
  dictionary(signal: AbortSignal): Promise<ReadResult>;
}

export interface ServerRecords {
  consent: ExportConsentHistory;
  /** Words held on the server for this account (merged with the phone's by `mergeDictionary`). */
  dictionary: ExportDictionaryTerm[];
}

export const PAGE_ROWS = 500;
export const MAX_PAGES = 20;

/** Every row of a paged read (`page(from, to)`, inclusive), or an error: never a silently shortened list. */
export async function allRows(page: (from: number, to: number) => PromiseLike<ReadResult>): Promise<ReadResult> {
  const rows: unknown[] = [];
  for (let i = 0; i < MAX_PAGES; i++) {
    const r = await page(i * PAGE_ROWS, i * PAGE_ROWS + PAGE_ROWS - 1);
    if (r.error || !Array.isArray(r.data)) return { data: null, error: r.error ?? 'no_data' };
    rows.push(...r.data);
    if (r.data.length < PAGE_ROWS) return { data: rows, error: null };
  }
  return { data: null, error: 'too_many_rows' };
}

/** A history with no rows, and why. */
export function noConsentHistory(status: Exclude<ExportConsentHistory['status'], 'included'>): ExportConsentHistory {
  return { status, read_at: null, current: [], acts: [] };
}

const ACTIONS: readonly PolicyAction[] = ['accept', 'decline', 'withdraw', 'acknowledge'];
const PLATFORMS = ['ios', 'android', 'web'] as const;
const DICTIONARY_KINDS: readonly ExportDictionaryTerm['kind'][] = ['child', 'nickname', 'family', 'word', 'place', 'self'];

const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const asAction = (v: unknown): PolicyAction | null => ((ACTIONS as readonly unknown[]).includes(v) ? (v as PolicyAction) : null);

/** bytea arrives from PostgREST as `\x<hex>`; anything but a SHA-256 is dropped. */
function byteaHex(v: unknown): string | null {
  const s = str(v);
  if (!s) return null;
  const hex = s.replace(/^\\x/, '').toLowerCase();
  return /^[0-9a-f]{64}$/.test(hex) ? hex : null;
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * One `policy_acceptances` row as exported: no `profile_id`, `subject_hash` or
 * retention columns. A row the schema could not describe (unknown action or
 * platform, missing id, document, version or time) is a sign of a server
 * change this app does not know: the whole read is then `unavailable` rather
 * than a quietly shortened record.
 */
export function exportAct(row: unknown): ExportPolicyAct | null {
  if (!isRecord(row)) return null;
  const id = str(row.id);
  const document = str(row.document);
  const version = str(row.version);
  const action = asAction(row.action);
  const at = str(row.accepted_at);
  const platform = (PLATFORMS as readonly unknown[]).includes(row.platform) ? (row.platform as ExportPolicyAct['platform']) : null;
  if (!id || !document || !version || !action || !at || !platform) return null;
  return {
    id,
    document,
    version,
    action,
    method: str(row.method) ?? '',
    surface: str(row.surface) ?? '',
    at,
    client_recorded_at: str(row.client_recorded_at),
    app_version: str(row.app_version) ?? '',
    platform,
    locale: str(row.locale),
    rendered_sha256: byteaHex(row.rendered_sha256),
    context: isRecord(row.context) ? row.context : {},
  };
}

/** One `my_policy_state` row, or null when it cannot be described. */
export function exportState(row: unknown): ExportConsentHistory['current'][number] | null {
  if (!isRecord(row)) return null;
  const document = str(row.document);
  const version = str(row.version);
  const action = asAction(row.action);
  const at = str(row.accepted_at);
  return document && version && action && at ? { document, version, action, at } : null;
}

/** One `dictionary_terms` row; rows the export cannot describe are skipped (a spelling hint, not a legal record). */
export function exportServerTerm(row: unknown): ExportDictionaryTerm | null {
  if (!isRecord(row)) return null;
  const term = str(row.term);
  const kind = (DICTIONARY_KINDS as readonly unknown[]).includes(row.kind) ? (row.kind as ExportDictionaryTerm['kind']) : null;
  if (!term || !term.trim() || !kind) return null;
  const heard = Array.isArray(row.heard_as) ? row.heard_as.filter((h): h is string => typeof h === 'string') : [];
  return { child_id: str(row.child_id), term, kind, heard_as: heard, source: 'server' };
}

class Unreadable extends Error {}

function rowsOf(r: ReadResult): unknown[] {
  if (r.error || !Array.isArray(r.data)) throw new Unreadable();
  return r.data;
}

/** The record from the three reads: acts oldest first (ties by id), current by document. Throws `Unreadable` on any bad row. */
export function consentFromRows(acts: unknown[], state: unknown[], readAt: string): ExportConsentHistory {
  const out = acts.map((r) => exportAct(r));
  const current = state.map((r) => exportState(r));
  if (out.some((a) => a === null) || current.some((c) => c === null)) throw new Unreadable();
  const sortedActs = (out as ExportPolicyAct[]).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  const sortedCurrent = (current as ExportConsentHistory['current']).sort((a, b) => a.document.localeCompare(b.document));
  return { status: 'included', read_at: readAt, current: sortedCurrent, acts: sortedActs };
}

export interface ReadOptions {
  /** The signed-in account, or null. */
  authUserId: string | null;
  /** The account that owns this phone's letters (sync ownership), or null before the first sign-in claims them. */
  ownerId: string | null;
  /** Null when server features are off or the client is not configured. */
  reader: ServerRecordsReader | null;
  timeoutMs: number;
  now: () => Date;
}

/** Reads the server's part of account.json. Never throws and never takes longer than `timeoutMs`. */
export async function readServerRecords(o: ReadOptions): Promise<ServerRecords> {
  if (!o.authUserId || !o.reader) return { consent: noConsentHistory('not_signed_in'), dictionary: [] };
  if (o.ownerId && o.ownerId !== o.authUserId) return { consent: noConsentHistory('different_account'), dictionary: [] };
  const reader = o.reader;
  const abort = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      abort.abort();
      reject(new Unreadable());
    }, o.timeoutMs);
  });
  try {
    const [acts, state, words] = await Promise.race([
      Promise.all([reader.acts(abort.signal), reader.state(abort.signal), reader.dictionary(abort.signal)]),
      timeout,
    ]);
    const consent = consentFromRows(rowsOf(acts), rowsOf(state), o.now().toISOString());
    const dictionary = rowsOf(words)
      .map((r) => exportServerTerm(r))
      .filter((t): t is ExportDictionaryTerm => t !== null);
    return { consent, dictionary };
  } catch {
    return { consent: noConsentHistory('unavailable'), dictionary: [] };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Phone words first, then server words the phone does not already have (same book, same spelling in any case). */
export function mergeDictionary(phone: readonly ExportDictionaryTerm[], server: readonly ExportDictionaryTerm[]): ExportDictionaryTerm[] {
  const key = (t: ExportDictionaryTerm) => `${t.child_id ?? ''}\u0000${t.term.normalize('NFC').toLocaleLowerCase()}`;
  const seen = new Set<string>();
  const out: ExportDictionaryTerm[] = [];
  for (const t of [...phone, ...server]) {
    if (!t.term.trim() || seen.has(key(t))) continue;
    seen.add(key(t));
    out.push({ ...t, heard_as: [...t.heard_as] });
  }
  return out;
}
