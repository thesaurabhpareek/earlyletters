/**
 * Consent state and the random analytics id (LEGAL-REQ-003, PRD-REQ-018).
 *
 * - `unknown` until the user answers the consent sheet. Nothing is sent or
 *   queued. Declining stores `denied`, which behaves the same.
 * - `granted` creates a fresh random id (never email, Supabase user id or a
 *   device id).
 * - The id is minted lazily by `ensureId()` the first time the gate allows an
 *   event, never before (ER-A04, BL-1239). It is a lowercase random id, never
 *   an account, device or advertising id, and it may exist without a yes (the
 *   `collect_by_default` policy, once that gate exists).
 * - Revoking retires the id. A later grant gets a new one, so the two
 *   periods cannot be joined. Retired ids are kept locally only so account
 *   deletion can ask PostHog to delete their events too. The list is capped
 *   at 20, but an id is never silently dropped: past the cap the oldest is
 *   passed to `forgetRetired` and leaves the list only once that call says it
 *   was acknowledged. With no callback, or a refusal, it stays.
 *
 * This module stores only the choice and ids, which are L2. The legal
 * consent record (`policy_acceptances`, version accepted) is written by the
 * app through `record_policy_act`; that is not this package's job.
 */

export type ConsentStatus = 'unknown' | 'granted' | 'denied';

/** Sync or async key-value storage (MMKV, SecureStore, AsyncStorage, memory). */
export interface KeyValueStorage {
  get(key: string): string | null | undefined | Promise<string | null | undefined>;
  set(key: string, value: string): void | Promise<void>;
  remove(key: string): void | Promise<void>;
}

export const STORAGE_KEYS = {
  consent: 'scribe.analytics.consent',
  id: 'scribe.analytics.id',
  retired: 'scribe.analytics.retired_ids',
  /** `{version, decided_at}` of the last answer (TDD 05 X-13). */
  consentMeta: 'scribe.analytics.consent_meta',
  /** Acts not yet uploaded through `record_policy_act` (TDD 05 X-13). */
  pendingActs: 'scribe.analytics.pending_acts',
  /** `1` once the in-app disclosure of the `collect_by_default` policy has been shown (ER-A03). On-device, no content. */
  disclosure: 'scribe.analytics.disclosure_shown',
} as const;

export const CURRENT_CONSENT_VERSION = '1.0';
export const MAX_PENDING_ACTS = 50;

export type ConsentActKind = 'accept' | 'decline' | 'withdraw';
export type ConsentSurface = 'consent_sheet' | 'settings';

/**
 * One answer waiting to be uploaded with its evidence. Only these four
 * fields exist: no id, no text, no name. The upload owner adds the words
 * shown and their hash (consent-record.ts).
 */
export interface PendingConsentAct {
  action: ConsentActKind;
  version: string;
  surface: ConsentSurface;
  client_recorded_at: string;
}

const VERSION = /^[0-9]{1,4}(\.[0-9]{1,4})?$/;
const ACTIONS: readonly string[] = ['accept', 'decline', 'withdraw'];
const SURFACES: readonly string[] = ['consent_sheet', 'settings'];

/** Major of a "major.minor" consent version, or null when it is not one. */
export function majorOf(version: string): number | null {
  return VERSION.test(version) ? Number.parseInt(version, 10) : null;
}

export interface ConsentStoreOptions {
  /** The consent version this build asks for. A newer major than the stored answer asks again. */
  currentVersion?: string;
  now?: () => string;
  /**
   * Asks the server to forget one retired id (the `analytics-forget` call; its wiring is BL-1252). Resolve true only
   * when the id is acknowledged. Anything else (false, a throw, a rejection) keeps the id in the list.
   */
  forgetRetired?: (id: string) => boolean | Promise<boolean>;
}

export const MAX_RETIRED_IDS = 20;

export function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage & { dump(): Record<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    get: (k) => data.get(k) ?? null,
    set: (k, v) => void data.set(k, v),
    remove: (k) => void data.delete(k),
    dump: () => Object.fromEntries(data),
  };
}

export function defaultRandomId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  throw new Error('@scribe/analytics: no crypto.randomUUID; pass `randomId` (e.g. expo-crypto randomUUID)');
}

export interface ConsentSnapshot {
  status: ConsentStatus;
  id: string | null;
  retired: string[];
}

export class ConsentStore {
  private snap: ConsentSnapshot = { status: 'unknown', id: null, retired: [] };

  constructor(
    private readonly storage: KeyValueStorage,
    private readonly randomId: () => string,
    private readonly options: ConsentStoreOptions = {},
  ) {
    // Fail closed: a version that does not parse as "major.minor" would otherwise skip the re-consent check and
    // drop queued acts on restart. The message carries no value.
    if (majorOf(options.currentVersion ?? CURRENT_CONSENT_VERSION) === null) {
      throw new Error('@scribe/analytics: consentVersion must look like "1.0" (major.minor, digits only)');
    }
  }

  private pending: PendingConsentAct[] = [];
  private disclosed = false;

  /** True once the disclosure has been shown and recorded. Nothing under `collect_by_default` passes before it. */
  get disclosureShown(): boolean {
    return this.disclosed;
  }

  async recordDisclosure(): Promise<void> {
    this.disclosed = true;
    await this.storage.set(STORAGE_KEYS.disclosure, '1');
  }

  private get version(): string {
    return this.options.currentVersion ?? CURRENT_CONSENT_VERSION;
  }

  private nowIso(): string {
    return (this.options.now ?? (() => new Date().toISOString()))();
  }

  /** Acts waiting for upload, oldest first. */
  pendingActs(): PendingConsentAct[] {
    return this.pending.map((a) => ({ ...a }));
  }

  /**
   * Drop the first `count` acts once the server has them. A count that is not a whole number of 0 or more (NaN,
   * Infinity, negative, fractional) is ignored: the safe failure is to keep the evidence and upload it again.
   */
  async acknowledgeActs(count: number): Promise<void> {
    if (!Number.isInteger(count) || count < 0) return;
    this.pending = this.pending.slice(Math.max(0, count));
    await this.savePending();
  }

  private async savePending(): Promise<void> {
    if (this.pending.length === 0) await this.storage.remove(STORAGE_KEYS.pendingActs);
    else await this.storage.set(STORAGE_KEYS.pendingActs, JSON.stringify(this.pending));
  }

  private async recordAct(action: ConsentActKind, surface: ConsentSurface | undefined): Promise<void> {
    if (!surface) return;
    this.pending = [...this.pending, { action, version: this.version, surface, client_recorded_at: this.nowIso() }].slice(-MAX_PENDING_ACTS);
    await this.savePending();
  }

  private async saveMeta(): Promise<void> {
    await this.storage.set(STORAGE_KEYS.consentMeta, JSON.stringify({ version: this.version, decided_at: this.nowIso() }));
  }

  get status(): ConsentStatus {
    return this.snap.status;
  }

  /** The live install id, or null before one is minted and after the person switched off. */
  get id(): string | null {
    return this.snap.id;
  }

  private idWrite: Promise<void> = Promise.resolve();

  /**
   * Mint the install id if there is none, and return it. Call only once the gate has allowed an event: this method
   * does not check consent. The id is set in memory at once and written to storage right after; `settled()` resolves
   * when that write is done (and rejects if it failed, so a caller can refuse to send an id it could not keep).
   */
  ensureId(): string {
    if (this.snap.id) return this.snap.id;
    const id = this.randomId().toLowerCase();
    this.snap.id = id;
    const write = Promise.resolve().then(() => this.storage.set(STORAGE_KEYS.id, id));
    write.catch(() => undefined);
    this.idWrite = write;
    return id;
  }

  /** Resolves when the last id write is stored. */
  settled(): Promise<void> {
    return this.idWrite;
  }

  /** Current id (if any) plus retired ids, for the deletion request. */
  allIds(): string[] {
    return [...(this.snap.id ? [this.snap.id] : []), ...this.snap.retired];
  }

  async load(): Promise<ConsentSnapshot> {
    const raw = await this.storage.get(STORAGE_KEYS.consent);
    const status: ConsentStatus = raw === 'granted' || raw === 'denied' ? raw : 'unknown';
    const id = (await this.storage.get(STORAGE_KEYS.id)) ?? null;
    let retired: string[] = [];
    try {
      const r = await this.storage.get(STORAGE_KEYS.retired);
      const parsed: unknown = r ? JSON.parse(r) : [];
      if (Array.isArray(parsed)) retired = parsed.filter((x): x is string => typeof x === 'string');
    } catch {
      retired = [];
    }
    this.pending = parsePending(await this.storage.get(STORAGE_KEYS.pendingActs));
    this.disclosed = (await this.storage.get(STORAGE_KEYS.disclosure)) === '1';
    // A major bump re-asks WITHOUT queueing a withdraw act: intended, the person did not act (the uploader spec says so).
    // After an erase (no meta row) a build above major 1 reports unknown where a 1.0 build reports denied: deliberate.
    // A grant or decline from before versions existed counts as major 1.
    const answeredMajor = await this.answeredMajor();
    const currentMajor = majorOf(this.version) ?? 1;
    if (status !== 'unknown' && answeredMajor < currentMajor) {
      // A newer major asks again. A live id is retired, so the two periods cannot be joined.
      if (id) retired = [id, ...retired];
      this.snap = { status: 'unknown', id: null, retired };
      if (id) await this.storage.set(STORAGE_KEYS.retired, JSON.stringify(retired));
      await this.storage.remove(STORAGE_KEYS.id);
      await this.storage.set(STORAGE_KEYS.consent, 'unknown');
      await this.storage.remove(STORAGE_KEYS.consentMeta);
      return { ...this.snap };
    }
    // A granted state without an id is repaired with a new id. An id that exists without a yes is kept (ER-A04).
    this.snap = { status, id: status === 'denied' ? null : id, retired };
    if (status === 'granted' && !id) await this.newId();
    return { ...this.snap };
  }

  private async answeredMajor(): Promise<number> {
    try {
      const raw = await this.storage.get(STORAGE_KEYS.consentMeta);
      const meta: unknown = raw ? JSON.parse(raw) : null;
      const v = meta && typeof meta === 'object' ? (meta as { version?: unknown }).version : null;
      return (typeof v === 'string' ? majorOf(v) : null) ?? 1;
    } catch {
      return 1;
    }
  }

  /** `surface` is given when the answer must reach the legal record; without it no act is queued. */
  async grant(surface?: ConsentSurface): Promise<string> {
    // An id minted before the yes stays: replacing it would orphan events that could then never be forgotten.
    if (!this.snap.id) await this.newId();
    this.snap.status = 'granted';
    await this.storage.set(STORAGE_KEYS.consent, 'granted');
    await this.saveMeta();
    await this.recordAct('accept', surface);
    return this.snap.id as string;
  }

  /** Withdraw (or decline). Retires the id so it is never reused. */
  async revoke(surface?: ConsentSurface): Promise<void> {
    const wasGranted = this.snap.status === 'granted';
    await this.idWrite.catch(() => undefined);
    if (this.snap.id) {
      this.snap.retired = [this.snap.id, ...this.snap.retired];
      await this.storage.set(STORAGE_KEYS.retired, JSON.stringify(this.snap.retired));
    }
    this.snap.id = null;
    this.snap.status = 'denied';
    await this.storage.remove(STORAGE_KEYS.id);
    await this.storage.set(STORAGE_KEYS.consent, 'denied');
    await this.saveMeta();
    await this.recordAct(wasGranted ? 'withdraw' : 'decline', surface);
  }

  /**
   * Bring the retired list back to the cap by asking the server to forget the oldest ids. Each id is removed only after
   * `forgetRetired` acknowledges it, oldest first; the first refusal stops the loop and everything not acknowledged
   * stays, so the next call retries. Without a callback nothing is removed. The list may be longer than the cap
   * meanwhile: deleting data is never traded for a tidy list.
   */
  async settleRetired(): Promise<void> {
    const forget = this.options.forgetRetired;
    if (!forget) return;
    while (this.snap.retired.length > MAX_RETIRED_IDS) {
      const oldest = this.snap.retired[this.snap.retired.length - 1] as string;
      let ok = false;
      try {
        ok = (await forget(oldest)) === true;
      } catch {
        ok = false;
      }
      if (!ok) return;
      this.snap.retired = this.snap.retired.filter((x) => x !== oldest);
      await this.storage.set(STORAGE_KEYS.retired, JSON.stringify(this.snap.retired));
    }
  }

  /**
   * Forget only the given ids, the ones the server acknowledged. Every other id stays so a later call can name it
   * again. Nothing else is wiped: the full wipe is `forgetAllIds`, used once every id is acknowledged.
   */
  async forgetSomeIds(ids: string[]): Promise<void> {
    await this.idWrite.catch(() => undefined);
    const gone = new Set(ids);
    this.snap.retired = this.snap.retired.filter((x) => !gone.has(x));
    await this.storage.set(STORAGE_KEYS.retired, JSON.stringify(this.snap.retired));
    if (this.snap.id && gone.has(this.snap.id)) {
      this.snap.id = null;
      if (this.snap.status === 'granted') this.snap.status = 'denied';
      await this.storage.remove(STORAGE_KEYS.id);
      await this.storage.set(STORAGE_KEYS.consent, this.snap.status === 'unknown' ? 'unknown' : 'denied');
    }
  }

  /** After the deletion request is confirmed, forget every id. */
  async forgetAllIds(): Promise<void> {
    await this.idWrite.catch(() => undefined);
    this.snap.retired = [];
    this.snap.id = null;
    if (this.snap.status === 'granted') this.snap.status = 'denied';
    await this.storage.remove(STORAGE_KEYS.id);
    await this.storage.remove(STORAGE_KEYS.retired);
    this.pending = [];
    await this.storage.remove(STORAGE_KEYS.pendingActs);
    this.disclosed = false;
    await this.storage.remove(STORAGE_KEYS.disclosure);
    await this.storage.remove(STORAGE_KEYS.consentMeta);
    await this.storage.set(STORAGE_KEYS.consent, this.snap.status === 'unknown' ? 'unknown' : 'denied');
  }

  private async newId(): Promise<void> {
    this.snap.id = null;
    this.ensureId();
    await this.idWrite;
  }
}

function parsePending(raw: string | null | undefined): PendingConsentAct[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const out: PendingConsentAct[] = [];
    for (const x of parsed) {
      if (!x || typeof x !== 'object') continue;
      const o = x as Record<string, unknown>;
      if (typeof o.action !== 'string' || !ACTIONS.includes(o.action)) continue;
      if (typeof o.surface !== 'string' || !SURFACES.includes(o.surface)) continue;
      if (typeof o.version !== 'string' || majorOf(o.version) === null) continue;
      if (typeof o.client_recorded_at !== 'string' || Number.isNaN(Date.parse(o.client_recorded_at))) continue;
      // Rebuilt field by field: nothing else in the stored object survives.
      out.push({ action: o.action as ConsentActKind, version: o.version, surface: o.surface as ConsentSurface, client_recorded_at: o.client_recorded_at });
    }
    return out.slice(-MAX_PENDING_ACTS);
  } catch {
    return [];
  }
}
