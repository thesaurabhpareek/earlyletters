/**
 * Signed public documents on the device: remote config, pack manifest and
 * content bundle (ADR 0016; founder decisions 15 to 17). Pure TypeScript with
 * injected ports, so it is tested in Node (`__tests__/documents.test.ts`).
 *
 * Rules:
 *  - Offline first. `current()` is synchronous and returns the last good
 *    copy (memory, then the on-disk cache), or the bundled fallback. Nothing
 *    here is awaited at launch: refreshes run after the first frame.
 *  - Trust. A fetched document is used only if its Ed25519 signature checks
 *    out against a key that ships in the app, its payload parses, and its
 *    version is not older than the last one accepted (rollback protection).
 *    Anything else is ignored and the last good copy stays.
 *  - Cheap. Conditional GET with `If-None-Match`; a 304 just refreshes the
 *    timestamp. Each document has a minimum interval between fetches.
 *  - Content-free. Requests carry no user data and no credentials; failures
 *    are recorded as closed codes only.
 *
 * The cache stores the verified, parsed payload (not the raw signature): the
 * app's own sandbox is trusted, and skipping a second Ed25519 check keeps
 * cold start inside its 30 ms bootstrap budget (TDD 01 5.3).
 */
import {
  HEADER_APP_VERSION,
  HEADER_REQUEST_ID,
  newRequestId,
  verifySignedDocument,
  type DocumentKind,
  type TrustedKey,
  type VerifyFailure,
} from '@scribe/api';

export interface DocStorage {
  read(name: string): string | null;
  write(name: string, text: string): void;
  remove(name: string): void;
}

export interface DocHttpResponse {
  status: number;
  etag: string | null;
  /** Response text for 200; null otherwise. */
  body: string | null;
}

export interface DocHttp {
  get(url: string, headers: Record<string, string>, timeoutMs: number): Promise<DocHttpResponse>;
}

export type ParsedPayload<T> = { ok: true; value: T } | { ok: false; reason: string };

export type RefreshOutcome =
  | 'updated'
  | 'unchanged'
  | 'skipped'
  | 'offline'
  | 'http_error'
  | VerifyFailure
  | 'invalid_payload'
  | 'rollback'
  | 'not_configured';

export interface DocumentClientOptions<T> {
  kind: DocumentKind;
  /** Full URL, or null when this build has no server configured (the fallback is used). */
  url: string | null;
  parse: (payload: unknown) => ParsedPayload<T>;
  /** Version number of a parsed payload. */
  versionOf: (value: T) => number;
  /** Used until a good copy exists. */
  fallback: T;
  storage: DocStorage;
  http: DocHttp;
  trustedKeys: () => readonly TrustedKey[];
  appVersion: string;
  minIntervalMs: number;
  timeoutMs: number;
  now?: () => number;
}

interface CacheRecord {
  v: 1;
  version: number;
  etag: string | null;
  fetchedAt: number;
  payload: unknown;
}

export class SignedDocumentClient<T> {
  private value: T | null = null;
  private version = 0;
  private etag: string | null = null;
  private fetchedAt = 0;
  private loaded = false;
  private inflight: Promise<RefreshOutcome> | null = null;
  private lastOutcome: RefreshOutcome | null = null;
  private readonly listeners = new Set<(value: T) => void>();
  private readonly now: () => number;

  constructor(private readonly o: DocumentClientOptions<T>) {
    this.now = o.now ?? (() => Date.now());
  }

  private get cacheName(): string {
    return `${this.o.kind}.json`;
  }

  /** Reads the on-disk cache once. Synchronous, no signature check (see header). */
  load(): void {
    if (this.loaded) return;
    this.loaded = true;
    const text = this.o.storage.read(this.cacheName);
    if (!text) return;
    try {
      const rec = JSON.parse(text) as CacheRecord;
      if (rec?.v !== 1) throw new Error('cache_version');
      const parsed = this.o.parse(rec.payload);
      if (!parsed.ok) throw new Error('cache_invalid');
      this.value = parsed.value;
      this.version = this.o.versionOf(parsed.value);
      this.etag = typeof rec.etag === 'string' ? rec.etag : null;
      this.fetchedAt = Number.isFinite(rec.fetchedAt) ? rec.fetchedAt : 0;
    } catch {
      // A cache from an older app that no longer parses is dropped; the next refresh replaces it.
      this.o.storage.remove(this.cacheName);
    }
  }

  /** The last good document, or the bundled fallback. Never null, never throws. */
  current(): T {
    this.load();
    return this.value ?? this.o.fallback;
  }

  /** True once a server copy has been accepted on this device. */
  hasServerCopy(): boolean {
    this.load();
    return this.value !== null;
  }

  lastRefresh(): { outcome: RefreshOutcome | null; fetchedAt: number; version: number } {
    return { outcome: this.lastOutcome, fetchedAt: this.fetchedAt, version: this.version };
  }

  subscribe(listener: (value: T) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Fetches a newer copy if the interval has passed (or `force`). Never throws; one request at a time. */
  refresh(force = false): Promise<RefreshOutcome> {
    if (this.inflight) return this.inflight;
    this.inflight = this.doRefresh(force).then((outcome) => {
      this.lastOutcome = outcome;
      this.inflight = null;
      return outcome;
    });
    return this.inflight;
  }

  /** Accepts a document from any source (a fetch, a test, a bundled seed). Exposed for tests and scripts. */
  accept(raw: unknown, etag: string | null): RefreshOutcome {
    this.load();
    const verified = verifySignedDocument(raw, this.o.kind, this.o.trustedKeys());
    if (!verified.ok) return verified.reason;
    const parsed = this.o.parse(verified.doc.payload);
    if (!parsed.ok) return 'invalid_payload';
    const version = this.o.versionOf(parsed.value);
    if (version < this.version) return 'rollback';
    const changed = version !== this.version || this.value === null;
    this.value = parsed.value;
    this.version = version;
    this.etag = etag;
    this.fetchedAt = this.now();
    this.persist(verified.doc.payload);
    if (changed) for (const l of this.listeners) l(parsed.value);
    return changed ? 'updated' : 'unchanged';
  }

  private persist(payload: unknown): void {
    const rec: CacheRecord = { v: 1, version: this.version, etag: this.etag, fetchedAt: this.fetchedAt, payload };
    try {
      this.o.storage.write(this.cacheName, JSON.stringify(rec));
    } catch {
      // A failed cache write costs one extra fetch next launch, nothing else.
    }
  }

  private async doRefresh(force: boolean): Promise<RefreshOutcome> {
    this.load();
    if (!this.o.url) return 'not_configured';
    if (!force && this.now() - this.fetchedAt < this.o.minIntervalMs) return 'skipped';
    const headers: Record<string, string> = {
      accept: 'application/json',
      [HEADER_REQUEST_ID]: newRequestId(),
      [HEADER_APP_VERSION]: this.o.appVersion,
    };
    if (this.etag && this.value !== null) headers['if-none-match'] = this.etag;
    let res: DocHttpResponse;
    try {
      res = await this.o.http.get(this.o.url, headers, this.o.timeoutMs);
    } catch {
      return 'offline';
    }
    if (res.status === 304 && this.value !== null) {
      this.fetchedAt = this.now();
      const payload = this.cachedPayload();
      if (payload !== null) this.persist(payload);
      return 'unchanged';
    }
    if (res.status !== 200 || res.body === null) return 'http_error';
    let raw: unknown;
    try {
      raw = JSON.parse(res.body);
    } catch {
      return 'malformed';
    }
    return this.accept(raw, res.etag);
  }

  /** The cached payload as stored (re-read so a 304 refresh keeps the exact bytes we verified). */
  private cachedPayload(): unknown {
    const text = this.o.storage.read(this.cacheName);
    try {
      return text ? (JSON.parse(text) as CacheRecord).payload : null;
    } catch {
      return null;
    }
  }
}
