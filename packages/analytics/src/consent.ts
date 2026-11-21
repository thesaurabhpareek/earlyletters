/**
 * Consent state and the random analytics id (LEGAL-REQ-003, PRD-REQ-018).
 *
 * - `unknown` until the user answers the consent sheet. Nothing is sent or
 *   queued. Declining stores `denied`, which behaves the same.
 * - `granted` creates a fresh random id (never email, Supabase user id or a
 *   device id).
 * - Revoking retires the id. A later grant gets a new one, so the two
 *   periods cannot be joined. Retired ids are kept locally (capped) only so
 *   account deletion can ask PostHog to delete their events too.
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
  ) {}

  private pending: PendingConsentAct[] = [];

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

  /** Drop the first `count` acts once the server has them. */
  async acknowledgeActs(count: number): Promise<void> {
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

  get id(): string | null {
    return this.snap.status === 'granted' ? this.snap.id : null;
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
    // A grant or decline from before versions existed counts as major 1.
    const answeredMajor = await this.answeredMajor();
    const currentMajor = majorOf(this.version) ?? 1;
    if (status !== 'unknown' && answeredMajor < currentMajor) {
      // A newer major asks again. A live id is retired, so the two periods cannot be joined.
      if (id) retired = [id, ...retired].slice(0, MAX_RETIRED_IDS);
      this.snap = { status: 'unknown', id: null, retired };
      if (id) await this.storage.set(STORAGE_KEYS.retired, JSON.stringify(retired));
      await this.storage.remove(STORAGE_KEYS.id);
      await this.storage.set(STORAGE_KEYS.consent, 'unknown');
      await this.storage.remove(STORAGE_KEYS.consentMeta);
      return { ...this.snap };
    }
    // A granted state without an id is repaired with a new id.
    this.snap = { status, id: status === 'granted' ? id : null, retired };
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
    if (this.snap.status !== 'granted' || !this.snap.id) await this.newId();
    this.snap.status = 'granted';
    await this.storage.set(STORAGE_KEYS.consent, 'granted');
    await this.saveMeta();
    await this.recordAct('accept', surface);
    return this.snap.id as string;
  }

  /** Withdraw (or decline). Retires the id so it is never reused. */
  async revoke(surface?: ConsentSurface): Promise<void> {
    const wasGranted = this.snap.status === 'granted';
    if (this.snap.id) {
      this.snap.retired = [this.snap.id, ...this.snap.retired].slice(0, MAX_RETIRED_IDS);
      await this.storage.set(STORAGE_KEYS.retired, JSON.stringify(this.snap.retired));
    }
    this.snap.id = null;
    this.snap.status = 'denied';
    await this.storage.remove(STORAGE_KEYS.id);
    await this.storage.set(STORAGE_KEYS.consent, 'denied');
    await this.saveMeta();
    await this.recordAct(wasGranted ? 'withdraw' : 'decline', surface);
  }

  /** After the deletion request is confirmed, forget every id. */
  async forgetAllIds(): Promise<void> {
    this.snap.retired = [];
    this.snap.id = null;
    if (this.snap.status === 'granted') this.snap.status = 'denied';
    await this.storage.remove(STORAGE_KEYS.id);
    await this.storage.remove(STORAGE_KEYS.retired);
    this.pending = [];
    await this.storage.remove(STORAGE_KEYS.pendingActs);
    await this.storage.remove(STORAGE_KEYS.consentMeta);
    await this.storage.set(STORAGE_KEYS.consent, this.snap.status === 'unknown' ? 'unknown' : 'denied');
  }

  private async newId(): Promise<void> {
    this.snap.id = this.randomId();
    await this.storage.set(STORAGE_KEYS.id, this.snap.id);
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
