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
} as const;

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
  ) {}

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
    // A granted state without an id is repaired with a new id.
    this.snap = { status, id: status === 'granted' ? id : null, retired };
    if (status === 'granted' && !id) await this.newId();
    return { ...this.snap };
  }

  async grant(): Promise<string> {
    if (this.snap.status !== 'granted' || !this.snap.id) await this.newId();
    this.snap.status = 'granted';
    await this.storage.set(STORAGE_KEYS.consent, 'granted');
    return this.snap.id as string;
  }

  /** Withdraw (or decline). Retires the id so it is never reused. */
  async revoke(): Promise<void> {
    if (this.snap.id) {
      this.snap.retired = [this.snap.id, ...this.snap.retired].slice(0, MAX_RETIRED_IDS);
      await this.storage.set(STORAGE_KEYS.retired, JSON.stringify(this.snap.retired));
    }
    this.snap.id = null;
    this.snap.status = 'denied';
    await this.storage.remove(STORAGE_KEYS.id);
    await this.storage.set(STORAGE_KEYS.consent, 'denied');
  }

  /** After the deletion request is confirmed, forget every id. */
  async forgetAllIds(): Promise<void> {
    this.snap.retired = [];
    this.snap.id = null;
    if (this.snap.status === 'granted') this.snap.status = 'denied';
    await this.storage.remove(STORAGE_KEYS.id);
    await this.storage.remove(STORAGE_KEYS.retired);
    await this.storage.set(STORAGE_KEYS.consent, this.snap.status === 'unknown' ? 'unknown' : 'denied');
  }

  private async newId(): Promise<void> {
    this.snap.id = this.randomId();
    await this.storage.set(STORAGE_KEYS.id, this.snap.id);
  }
}
