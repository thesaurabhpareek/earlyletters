/**
 * The server's part of account.json (BL-323 and BL-529, LEGAL-REQ-034): the
 * consent record (`policy_acceptances` and `my_policy_state`, own rows under
 * row-level security, schema 1.3.0) and the person's own `profiles` row
 * (schema 1.4.0). Pure: the reads are injected, so every path is
 * tested without a network (test/export-server-records.test.ts), and the
 * column lists below are run against the real access rules by
 * supabase/tests/export_reads.test.mjs. `device.ts` wires the Supabase reads.
 *
 * The spelling list is not read from the server: it lives on the phone, and
 * since 20261023060000 no client may read `dictionary_terms` at all.
 *
 * Export never waits on the network for long and never fails because of it
 * (DATA-REQ-052, C-NFR-004): signed out, a different account, offline, an
 * error, the timeout or Stop all keep the phone's export and say why in
 * `consent_history.status`. The record is never silently cut: a reader that
 * cannot return every row, or a row this app cannot describe, makes the
 * status `unavailable`.
 */
import type { ExportConsentHistory, ExportPolicyAct, ExportProfile, PolicyAction } from './schema';

/** Columns read from `policy_acceptances`: never `profile_id`, `subject_hash` or the retention columns. */
export const ACT_COLUMNS =
  'id, document, version, action, method, surface, accepted_at, client_recorded_at, app_version, platform, locale, rendered_sha256, context';
/** Columns read from `my_policy_state`. */
export const STATE_COLUMNS = 'document, version, action, accepted_at';
/** Columns read from the person's own `profiles` row (filtered to their id: co-parents can read each other's). */
export const PROFILE_COLUMNS = 'id, display_name, signs_as, created_at';

/** A read result as PostgREST returns it. */
export interface ReadResult {
  data: unknown[] | null;
  error: unknown;
}

/** The reads. Each gets an AbortSignal; each must return every row or an error. */
export interface ServerRecordsReader {
  acts(signal: AbortSignal): Promise<ReadResult>;
  state(signal: AbortSignal): Promise<ReadResult>;
  /** The `profiles` row whose id is `userId` (and no other). */
  profile(signal: AbortSignal, userId: string): Promise<ReadResult>;
}

/** What the server holds for account.json. The two parts are read together and fail apart. */
export interface ServerRecords {
  consent: ExportConsentHistory;
  profile: ExportProfile;
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

/** The slice of a PostgREST query builder the reads use (supabase-js's, structurally; no React Native here). */
interface PostgrestQuery extends PromiseLike<ReadResult> {
  order(column: string, options?: { ascending?: boolean }): PostgrestQuery;
  range(from: number, to: number): PostgrestQuery;
  eq(column: string, value: string): PostgrestQuery;
  limit(count: number): PostgrestQuery;
  abortSignal(signal: AbortSignal): PostgrestQuery;
}
export interface PostgrestLike {
  from(table: string): { select(columns: string): PostgrestQuery };
}

/**
 * The reads against a Supabase client: the app's (device.ts) and the real-stack
 * check's (apps/mobile/test/live/export-server-reads.live.ts) are this one.
 */
export function postgrestReader(sb: PostgrestLike): ServerRecordsReader {
  return {
    acts: (signal) =>
      allRows((from, to) =>
        sb.from('policy_acceptances').select(ACT_COLUMNS).order('accepted_at', { ascending: true }).order('id', { ascending: true }).range(from, to).abortSignal(signal),
      ),
    state: (signal) => allRows((from, to) => sb.from('my_policy_state').select(STATE_COLUMNS).order('document').range(from, to).abortSignal(signal)),
    profile: async (signal, userId) => sb.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).limit(2).abortSignal(signal),
  };
}

/** A profile with no values, and why. */
export function noProfile(status: Exclude<ExportProfile['status'], 'included'>): ExportProfile {
  return { status, read_at: null, display_name: null, signs_as: null, created_at: null };
}

/** A history with no rows, and why. */
export function noConsentHistory(status: Exclude<ExportConsentHistory['status'], 'included'>): ExportConsentHistory {
  return { status, read_at: null, current: [], acts: [] };
}

const ACTIONS: readonly PolicyAction[] = ['accept', 'decline', 'withdraw', 'acknowledge'];
const PLATFORMS = ['ios', 'android', 'web'] as const;

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
  /** True once the person taps Stop: the reads are aborted at once (checked every `pollMs`). */
  cancelled?: () => boolean;
  pollMs?: number;
}

/** The person's profile from the read: exactly one row, theirs, or the read counts as failed. */
export function profileFromRows(rows: unknown[], userId: string, readAt: string): ExportProfile {
  if (rows.length !== 1 || !isRecord(rows[0]) || rows[0].id !== userId) throw new Unreadable();
  const r = rows[0];
  const opt = (v: unknown) => (v === null || v === undefined ? null : str(v));
  return { status: 'included', read_at: readAt, display_name: opt(r.display_name), signs_as: opt(r.signs_as), created_at: opt(r.created_at) };
}

/**
 * Reads the server's consent record and the person's profile. Never throws and
 * never takes longer than `timeoutMs`; Stop ends it sooner. Each part has its
 * own result: an error, a bad row or a hang in one leaves the other as it is
 * (a part still waiting at the timeout or Stop is `unavailable`).
 */
export async function readServerRecords(o: ReadOptions): Promise<ServerRecords> {
  if (!o.authUserId || !o.reader) return { consent: noConsentHistory('not_signed_in'), profile: noProfile('not_signed_in') };
  if (o.ownerId && o.ownerId !== o.authUserId) return { consent: noConsentHistory('different_account'), profile: noProfile('different_account') };
  const reader = o.reader;
  const uid = o.authUserId;
  const abort = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let poll: ReturnType<typeof setInterval> | undefined;
  const stop = new Promise<never>((_, reject) => {
    const end = () => {
      abort.abort();
      reject(new Unreadable());
    };
    timer = setTimeout(end, o.timeoutMs);
    if (o.cancelled) poll = setInterval(() => o.cancelled?.() && end(), o.pollMs ?? 100);
  });
  // Each part races the timeout and Stop on its own, so a part that finished keeps its result
  // when the other hangs. `stop` rejects at most once; both parts see it.
  stop.catch(() => {});
  const part = <T,>(work: () => Promise<T>, fallback: T): Promise<T> =>
    Promise.race([Promise.resolve().then(work), stop]).catch(() => fallback);
  try {
    const [consent, profile] = await Promise.all([
      part(async () => {
        const [acts, state] = await Promise.all([reader.acts(abort.signal), reader.state(abort.signal)]);
        return consentFromRows(rowsOf(acts), rowsOf(state), o.now().toISOString());
      }, noConsentHistory('unavailable')),
      part(async () => profileFromRows(rowsOf(await reader.profile(abort.signal, uid)), uid, o.now().toISOString()), noProfile('unavailable')),
    ]);
    return { consent, profile };
  } finally {
    if (timer) clearTimeout(timer);
    if (poll) clearInterval(poll);
  }
}
