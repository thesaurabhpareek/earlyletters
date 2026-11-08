/**
 * First-party sink: an AnalyticsProvider that posts allowlisted events to our own
 * `analytics-ingest` Edge Function (Supabase), instead of a vendor SDK. No native
 * module, no vendor identifier: only `fetch`, which the app already has.
 *
 * Policy stays in client.ts and validate.ts; this adapter adds three things:
 * 1. A last wall: every event is re-checked with `sanitizeEvent` before it is held or sent.
 * 2. A small durable outbox (optional storage) so events survive being offline or the app
 *    being closed. Emptied on opt-out and on reset.
 * 3. No account link: it sends the random analytics id and nothing else. It never sends an
 *    Authorization header, a user id or a device id.
 *
 * Nothing runs before `optIn()`: capture, flush and the outbox are no-ops until then.
 */
import type { AnalyticsProvider } from './provider';
import type { KeyValueStorage } from './consent';
import { sanitizeEvent, type Props } from './validate';

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{ status: number }>;

export interface FirstPartyOptions {
  /** Full URL of the analytics-ingest route. */
  endpoint: string;
  /** The public (anon) project key, sent as `apikey` for the gateway. Not a user token. */
  apiKey?: string;
  fetch: FetchLike;
  /** Durable outbox. Memory-only when omitted. */
  storage?: KeyValueStorage;
  now?: () => number;
  maxBatch?: number;
  maxOutboxBytes?: number;
  /** Called without any value when a send fails. */
  onError?: (stage: 'send' | 'storage') => void;
}

export const OUTBOX_KEY = 'scribe.analytics.outbox';
export const DEFAULT_MAX_BATCH = 50;
export const DEFAULT_MAX_OUTBOX_BYTES = 256 * 1024;
/** The server keeps events up to 14 days old. */
export const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

interface Held {
  event: string;
  props: Props;
  at: number;
}

export function createFirstPartyProvider(o: FirstPartyOptions): AnalyticsProvider {
  const now = o.now ?? (() => Date.now());
  const maxBatch = o.maxBatch ?? DEFAULT_MAX_BATCH;
  const maxBytes = o.maxOutboxBytes ?? DEFAULT_MAX_OUTBOX_BYTES;
  let enabled = false;
  let id: string | null = null;
  let outbox: Held[] = [];
  let sending: Promise<void> | null = null;

  async function persist() {
    if (!o.storage) return;
    try {
      if (outbox.length === 0) await o.storage.remove(OUTBOX_KEY);
      else await o.storage.set(OUTBOX_KEY, JSON.stringify(outbox));
    } catch {
      o.onError?.('storage');
    }
  }

  async function load() {
    if (!o.storage) return;
    try {
      const raw = await o.storage.get(OUTBOX_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return;
      // Re-check on the way back in: storage is not trusted.
      for (const h of parsed as Held[]) {
        if (typeof h?.event !== 'string' || typeof h?.at !== 'number') continue;
        const { props } = sanitizeEvent(h.event, h.props);
        if (props) outbox.push({ event: h.event, props, at: h.at });
      }
    } catch {
      outbox = [];
    }
  }

  function trim() {
    let bytes = JSON.stringify(outbox).length;
    while (bytes > maxBytes && outbox.length > 0) {
      bytes -= JSON.stringify(outbox.shift()).length + 1;
    }
  }

  async function sendAll() {
    while (enabled && id && outbox.length > 0) {
      const t = now();
      outbox = outbox.filter((h) => t - h.at <= MAX_AGE_MS);
      const batch = outbox.slice(0, maxBatch);
      if (batch.length === 0) break;
      const sentId = id;
      const body = JSON.stringify({
        id: sentId,
        events: batch.map((h) => ({ event: h.event, props: h.props, ago_s: Math.max(0, Math.round((t - h.at) / 1000)) })),
      });
      let status = 0;
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (o.apiKey) headers.apikey = o.apiKey;
        status = (await o.fetch(o.endpoint, { method: 'POST', headers, body })).status;
      } catch {
        status = 0;
      }
      // Withdrawn while the request was in flight: leave nothing behind.
      if (!enabled || id !== sentId) return;
      const ok = status >= 200 && status < 300;
      // A refusal that retrying cannot fix (bad shape) drops the batch; 429, 5xx and offline keep it.
      const permanent = status >= 400 && status < 500 && status !== 429;
      if (ok || permanent) {
        outbox = outbox.slice(batch.length);
        await persist();
        if (!ok) o.onError?.('send');
      } else {
        o.onError?.('send');
        return;
      }
    }
  }

  return {
    async optIn() {
      enabled = true;
      await load();
    },
    async optOut() {
      enabled = false;
      id = null;
      outbox = [];
      await persist();
    },
    identify(distinctId) {
      id = distinctId;
    },
    capture(event, properties) {
      if (!enabled || !id) return;
      const { props } = sanitizeEvent(event, properties);
      if (!props) return;
      outbox.push({ event, props, at: now() });
      trim();
      void persist();
    },
    async flush() {
      if (!enabled || !id) return;
      if (!sending) sending = sendAll().finally(() => (sending = null));
      await sending;
    },
    async reset() {
      enabled = false;
      id = null;
      outbox = [];
      await persist();
    },
  };
}
