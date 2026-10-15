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
 *    version is newer than the last one accepted (rollback protection). The
 *    same version is accepted only when its payload hash is identical, so a
 *    signed document can never be swapped for a different one under a
 *    version already accepted (security review L10, G-18;
 *    `decideDocumentVersion` in @scribe/api). Anything else is ignored and
 *    the last good copy stays.
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
  decideDocumentVersion,
  documentPayloadSha256,
  HEADER_APP_VERSION,
  HEADER_REQUEST_ID,
  newRequestId,
  SHA256_HEX_RE,
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
  /** The response's `Date` header (server clock), used by the kill-switch staleness rule (F19-REQ-008). */
  date?: string | null;
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
  /** The same version as the accepted copy with a different payload: refused, the accepted copy stays. */
  | 'same_version_conflict'
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
  /**
   * Turns a newly accepted value into the value the app uses, given the one
   * in use before and the server's `Date`. Remote config uses it for the
   * kill-switch staleness rule (F19-REQ-008, `withFreshKillSwitches`). The
   * signed payload is kept unchanged for hashing; the used value is cached
   * beside it so a cold start uses the same thing.
   */
  adjust?: (next: T, previous: T, ctx: { serverDate: string | null }) => T;
  /**
   * How long an adjusted value may outlive its version. Once the server has
   * confirmed (304 or the same payload) that the same version is still the
   * newest for this long, the adjustment is dropped and the signed payload
   * applies. A kill switch kept on by the staleness rule is therefore never
   * stuck for good when the copy that cleared it is the newest there is.
   */
  adjustMaxMs?: number;
  /** A signed time inside the payload (remote config: `generatedAt`), so the server-Date guard does not rest on the phone clock alone. */
  signedTimeOf?: (value: T) => number;
}

interface CacheRecord {
  v: 1;
  version: number;
  etag: string | null;
  fetchedAt: number;
  /** SHA-256 of the payload's canonical JSON. Absent in caches written before G-18; then computed when first needed. */
  sha256?: string;
  payload: unknown;
  /** The value in use when `adjust` changed it (F19-REQ-008); absent otherwise. */
  effective?: unknown;
  /** The newest server `Date` seen on a good response (ms since epoch), for the staleness rule. */
  serverDateMs?: number;
  /** Phone time when `effective` was first used (ms since epoch). */
  effectiveSince?: number;
}

export class SignedDocumentClient<T> {
  private value: T | null = null;
  private version = 0;
  /** Hash of the accepted payload; null until known (see `acceptedSha256`). */
  private payloadSha256: string | null = null;
  private etag: string | null = null;
  private fetchedAt = 0;
  private loaded = false;
  private inflight: Promise<RefreshOutcome> | null = null;
  private lastOutcome: RefreshOutcome | null = null;
  private readonly listeners = new Set<(value: T) => void>();
  private readonly now: () => number;
  /** The adjusted value as cached, when `adjust` changed it. */
  private effective: unknown = undefined;
  /**
   * The newest server `Date` seen on a good response (200 or 304). A copy
   * held at a cache keeps its old `Date`, so staleness is judged against the
   * newest clock we have seen, not only the response's own (F19-REQ-008:
   * "the last good server Date").
   */
  private serverDateMs = 0;
  private effectiveSince = 0;

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
      const effective = rec.effective === undefined ? null : this.o.parse(rec.effective);
      this.effective = effective?.ok ? rec.effective : undefined;
      this.value = effective?.ok ? effective.value : parsed.value;
      this.effectiveSince = this.effective !== undefined && typeof rec.effectiveSince === 'number' ? rec.effectiveSince : 0;
      this.version = this.o.versionOf(parsed.value);
      // Not hashed here: cold start stays inside its budget; the hash is computed only when a same-version copy arrives.
      this.payloadSha256 = typeof rec.sha256 === 'string' && SHA256_HEX_RE.test(rec.sha256) ? rec.sha256 : null;
      this.etag = typeof rec.etag === 'string' ? rec.etag : null;
      this.fetchedAt = Number.isFinite(rec.fetchedAt) ? rec.fetchedAt : 0;
      this.serverDateMs = typeof rec.serverDateMs === 'number' && Number.isFinite(rec.serverDateMs) ? rec.serverDateMs : 0;
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
  accept(raw: unknown, etag: string | null, serverDate: string | null = null): RefreshOutcome {
    this.load();
    const verified = verifySignedDocument(raw, this.o.kind, this.o.trustedKeys());
    if (!verified.ok) return verified.reason;
    const parsed = this.o.parse(verified.doc.payload);
    if (!parsed.ok) return 'invalid_payload';
    const version = this.o.versionOf(parsed.value);
    const sha256 = documentPayloadSha256(verified.doc.payload);
    const decision = decideDocumentVersion(
      this.value === null ? null : { version: this.version, payloadSha256: this.acceptedSha256() },
      { version, payloadSha256: sha256 },
    );
    if (decision === 'rollback' || decision === 'same_version_conflict') return decision;
    const changed = decision === 'accept';
    this.noteServerDate(serverDate, this.o.signedTimeOf?.(parsed.value));
    if (changed) {
      const newest = this.serverDateMs > 0 ? new Date(this.serverDateMs).toUTCString() : null;
      const used = this.o.adjust ? this.o.adjust(parsed.value, this.value ?? this.o.fallback, { serverDate: newest }) : parsed.value;
      this.effective = used === parsed.value ? undefined : used;
      this.effectiveSince = this.effective === undefined ? 0 : this.now();
      this.value = used;
    } else {
      this.releaseAdjustment(parsed.value);
    }
    this.version = version;
    this.payloadSha256 = sha256;
    this.etag = etag;
    this.fetchedAt = this.now();
    this.persist(verified.doc.payload);
    if (changed) for (const l of this.listeners) l(this.value as T);
    return changed ? 'updated' : 'unchanged';
  }

  /**
   * Keeps the newest valid server clock. The header is not signed, so a date
   * more than a day ahead of both this phone's clock and the newest signed
   * time we hold is ignored: one forged far-future `Date` must not make
   * every later config look stale, and a phone whose clock runs behind still
   * accepts real dates near the signed time.
   */
  private noteServerDate(serverDate: string | null, signedMs?: number): void {
    const ms = serverDate ? Date.parse(serverDate) : NaN;
    const held = this.value !== null ? this.o.signedTimeOf?.(this.value) : undefined;
    const anchor = Math.max(this.now(), Number.isFinite(signedMs) ? (signedMs as number) : 0, Number.isFinite(held) ? (held as number) : 0);
    if (!Number.isFinite(ms) || ms > anchor + 86_400_000) return;
    if (ms > this.serverDateMs) this.serverDateMs = ms;
  }

  /** Drops an adjustment the server has kept confirming for longer than `adjustMaxMs` (see the option). */
  private releaseAdjustment(payloadValue: T): void {
    if (this.effective === undefined || !this.o.adjustMaxMs || !this.effectiveSince) return;
    if (this.now() - this.effectiveSince < this.o.adjustMaxMs) return;
    this.effective = undefined;
    this.effectiveSince = 0;
    this.value = payloadValue;
    for (const l of this.listeners) l(payloadValue);
  }

  /** The accepted payload's hash; for a cache from an older build, computed once from the cached payload. */
  private acceptedSha256(): string | null {
    if (this.payloadSha256 === null && this.value !== null) {
      const payload = this.cachedPayload();
      if (payload !== null) {
        try {
          this.payloadSha256 = documentPayloadSha256(payload);
        } catch {
          // Unreadable cache: unknown hash, so a same-version copy is refused and the next version replaces it.
        }
      }
    }
    return this.payloadSha256;
  }

  private persist(payload: unknown): void {
    const rec: CacheRecord = {
      v: 1, version: this.version, etag: this.etag, fetchedAt: this.fetchedAt, sha256: this.payloadSha256 ?? undefined, payload,
      effective: this.effective, serverDateMs: this.serverDateMs || undefined,
      effectiveSince: this.effectiveSince || undefined,
    };
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
      this.noteServerDate(res.date ?? null);
      const payload = this.cachedPayload();
      if (payload !== null) {
        const parsed = this.o.parse(payload);
        if (parsed.ok) this.releaseAdjustment(parsed.value);
        this.persist(payload);
      }
      return 'unchanged';
    }
    if (res.status !== 200 || res.body === null) return 'http_error';
    let raw: unknown;
    try {
      raw = JSON.parse(res.body);
    } catch {
      return 'malformed';
    }
    return this.accept(raw, res.etag, res.date ?? null);
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
