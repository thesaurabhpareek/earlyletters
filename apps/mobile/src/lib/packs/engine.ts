/**
 * Pack engine (ADR 0016, founder decision 15). Pure TypeScript: every side
 * effect goes through the ports below, so the same code runs on the phone
 * (`expo-adapter.ts`) and in Node tests (`__tests__/node-ports.ts`).
 *
 * What it guarantees:
 *  - Resumable: a file is fetched in HTTP Range chunks and appended to a
 *    `.part` file; after a kill, cancel or network change the next attempt
 *    continues from the `.part` size.
 *  - Verified: the finished file's SHA-256 must equal the entry in the signed
 *    manifest (the manifest's signature is checked before it reaches here,
 *    `src/lib/remote`). A mismatch deletes the download; a mirror is tried.
 *  - Atomic: a verified file is moved into place by renaming its whole
 *    staging directory into `installed/<id>/<version>/` (one rename on one
 *    volume), with a `pack.json` written before that rename. `packPath()`
 *    returns the old version until the new one is in place, and a crash at
 *    any step leaves either the old version or the new one, never a partial
 *    file (`load()` repairs the rest).
 *  - Polite: one download at a time; Wi-Fi only by default for anything over
 *    `CELLULAR_FREE_BYTES` (a text pack of a few kilobytes is fetched on any
 *    network, so choosing a language works at once); a user override; a
 *    remote kill switch; a free-space check that keeps room for recordings.
 *
 * Layout under the root (Application Support/packs, excluded from backup):
 *   installed/<id>/<version>/<fileName>   the file engines read
 *   installed/<id>/<version>/pack.json    what it is (written before install)
 *   staging/<id>@<version>/<fileName>.part an unfinished download
 *   staging/<id>@<version>/chunk          the Range chunk in flight
 *   staging/<id>@<version>/meta.json      which entry the .part belongs to
 */
import {
  digestsEqual,
  ENDPOINT_CLASSES,
  requiredPacksForLanguage,
  resolvePack,
  retryDelayMs,
  type PackEntry,
  type PackKind,
  type PackManifest,
} from '@scribe/api';

/** Packs at or below this size download on any network (text rules, prompts). */
export const CELLULAR_FREE_BYTES = 5_000_000;
/** Range chunk size. Larger means fewer requests (HF counts each as a resolver call), smaller means less lost on a drop. */
export const DEFAULT_CHUNK_BYTES = 16 * 1024 * 1024;
/** Free space kept after a large download, so recording never runs out first (TDD 01 3.4 warns under 1 GB). */
export const LARGE_PACK_RESERVE_BYTES = 1_000_000_000;
export const SMALL_PACK_RESERVE_BYTES = 20_000_000;
/** Setting key for the user's "Use mobile data" choice (L2, device only). */
export const SETTING_ALLOW_CELLULAR = 'packs.allowCellular';

export type Connection = 'wifi' | 'cellular' | 'none' | 'unknown';

export type PackPhase =
  | 'queued'
  | 'waiting_for_wifi'
  | 'downloading'
  | 'verifying'
  | 'installing'
  | 'installed'
  | 'failed'
  | 'cancelled'
  | 'removed';

export type PackFailure =
  | 'no_manifest'
  | 'not_in_manifest'
  | 'needs_app_update'
  | 'downloads_paused'
  | 'waiting_for_wifi'
  | 'offline'
  | 'no_space'
  | 'hash_mismatch'
  | 'download_failed'
  | 'cancelled'
  | 'storage_error';

export interface PackProgress {
  id: string;
  version: number | null;
  phase: PackPhase;
  bytesDone: number;
  bytesTotal: number;
  failure?: PackFailure;
}

export interface InstalledPack {
  id: string;
  kind: PackKind;
  language: string;
  version: number;
  bytes: number;
  sha256: string;
  fileName: string;
  /** Absolute file URI or path of the pack file. */
  path: string;
  installedAt: string;
}

export type EnsureResult =
  | { ok: true; path: string; version: number }
  | { ok: false; reason: PackFailure };

export interface EnsureOptions {
  /** Wait for the newest compatible version instead of returning an installed older one. */
  requireLatest?: boolean;
  /** The person tapped "Download now" on mobile data for this pack only. */
  allowCellularOnce?: boolean;
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Ports
// ---------------------------------------------------------------------------

export interface PackFs {
  /** Packs root, created by the adapter and excluded from backup. */
  readonly root: string;
  join(...parts: string[]): string;
  exists(path: string): boolean;
  isDirectory(path: string): boolean;
  /** Size in bytes, or null when missing. */
  fileSize(path: string): number | null;
  mkdirp(path: string): void;
  /** Removes a file or a directory tree. No error when missing. */
  remove(path: string): void;
  /** Same-volume rename of a file or directory. The target must not exist. */
  rename(from: string, to: string): void;
  /** Names (not paths) in a directory; [] when missing. */
  list(dir: string): string[];
  readText(path: string): string | null;
  writeText(path: string, text: string): void;
  /** Appends the bytes of `from` to `to` (created if missing). */
  appendFile(from: string, to: string): Promise<void>;
  /** Lowercase hex SHA-256 of a file. */
  sha256(path: string, signal?: AbortSignal): Promise<string>;
  /** Free bytes on the volume, or null when unknown. */
  freeBytes(): number | null;
}

export interface PackHttp {
  /**
   * Fetches bytes `start..end` (inclusive) of `url` into `dest`, replacing it.
   * Resolves when the response body is written (whatever its length; the
   * engine checks it). Rejects on network errors, non-2xx and abort
   * (an `AbortError`).
   */
  downloadRange(
    url: string,
    dest: string,
    start: number,
    end: number,
    opts: { signal: AbortSignal; timeoutMs: number; onBytes?: (bytesInChunk: number) => void },
  ): Promise<void>;
}

export interface NetworkPort {
  connection(): Promise<Connection>;
  /** Optional: called when the connection changes, so waiting packs start on Wi-Fi. Returns an unsubscribe. */
  subscribe?(listener: (c: Connection) => void): () => void;
}

export interface KeyValue {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

export interface PackEnv {
  fs: PackFs;
  http: PackHttp;
  network: NetworkPort;
  settings: KeyValue;
  /** This app's version (`major.minor.patch`). */
  appVersion: string;
  /** The last manifest whose signature and version checked out, or null. Never throws. */
  manifest(): Promise<PackManifest | null>;
  /** Remote kill switch `packDownloads`. */
  downloadsPaused(): boolean;
  now?: () => number;
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>;
  random?: () => number;
  chunkBytes?: number;
}

// ---------------------------------------------------------------------------

interface PackMeta {
  id: string;
  kind: PackKind;
  language: string;
  version: number;
  bytes: number;
  sha256: string;
  fileName: string;
  installedAt: string;
}

class PackError extends Error {
  constructor(readonly failure: PackFailure) {
    super(failure);
    this.name = 'PackError';
  }
}

const isAbort = (e: unknown) => (e as { name?: string })?.name === 'AbortError';

function defaultSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const t = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(abortError());
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function abortError(): Error {
  const e = new Error('aborted');
  e.name = 'AbortError';
  return e;
}

function isPackMeta(x: unknown, id: string, version: number): x is PackMeta {
  const m = x as PackMeta;
  return (
    !!m &&
    m.id === id &&
    m.version === version &&
    typeof m.fileName === 'string' &&
    /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(m.fileName) &&
    Number.isInteger(m.bytes) &&
    m.bytes > 0 &&
    typeof m.sha256 === 'string'
  );
}

interface Job {
  id: string;
  controller: AbortController;
  promise: Promise<EnsureResult>;
  started: boolean;
}

export class PackManager {
  private readonly fs: PackFs;
  private readonly installedMap = new Map<string, InstalledPack>();
  private readonly jobs = new Map<string, Job>();
  private readonly waitingForWifi = new Set<string>();
  private readonly listeners = new Set<(p: PackProgress) => void>();
  private readonly languageResolvers = new Set<(language: string) => string[]>();
  private readonly lastEmit = new Map<string, { at: number; phase: PackPhase }>();
  private queue: Promise<unknown> = Promise.resolve();
  private loaded = false;
  private unsubscribeNetwork: (() => void) | null = null;
  private readonly now: () => number;
  private readonly sleep: (ms: number, signal: AbortSignal) => Promise<void>;
  private readonly random: () => number;
  private readonly chunkBytes: number;

  constructor(private readonly env: PackEnv) {
    this.fs = env.fs;
    this.now = env.now ?? (() => Date.now());
    this.sleep = env.sleep ?? defaultSleep;
    this.random = env.random ?? Math.random;
    this.chunkBytes = env.chunkBytes ?? DEFAULT_CHUNK_BYTES;
  }

  // -------------------------------------------------------------------------
  // Startup and recovery
  // -------------------------------------------------------------------------

  /**
   * Scans the root and repairs what a crash may have left: keeps the newest
   * valid version of each pack, deletes older or broken version directories.
   * Synchronous and cheap (a few directory listings). Idempotent.
   */
  load(): void {
    const { fs } = this;
    this.installedMap.clear();
    const installedRoot = fs.join(fs.root, 'installed');
    fs.mkdirp(installedRoot);
    fs.mkdirp(fs.join(fs.root, 'staging'));
    for (const id of fs.list(installedRoot)) {
      const idDir = fs.join(installedRoot, id);
      if (!fs.isDirectory(idDir)) {
        fs.remove(idDir);
        continue;
      }
      const valid: PackMeta[] = [];
      for (const name of fs.list(idDir)) {
        const dir = fs.join(idDir, name);
        const version = /^[1-9][0-9]{0,9}$/.test(name) ? Number(name) : NaN;
        const meta = this.readMeta(fs.join(dir, 'pack.json'));
        const ok =
          Number.isInteger(version) &&
          isPackMeta(meta, id, version) &&
          fs.fileSize(fs.join(dir, meta.fileName)) === meta.bytes;
        if (ok) valid.push(meta as PackMeta);
        else fs.remove(dir);
      }
      valid.sort((a, b) => b.version - a.version);
      const [current, ...older] = valid;
      for (const o of older) fs.remove(fs.join(idDir, String(o.version)));
      if (current) this.installedMap.set(id, this.toInstalled(current));
      else fs.remove(idDir);
    }
    this.loaded = true;
    if (!this.unsubscribeNetwork && this.env.network.subscribe) {
      this.unsubscribeNetwork = this.env.network.subscribe((c) => {
        if (c === 'wifi') this.resumeWaiting();
      });
    }
  }

  /** Stops listening for network changes (tests, hot reload). */
  dispose(): void {
    this.unsubscribeNetwork?.();
    this.unsubscribeNetwork = null;
    for (const job of this.jobs.values()) job.controller.abort();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /** Path of the installed file, or null. Synchronous; never touches the network. */
  packPath(id: string): string | null {
    this.ensureLoaded();
    return this.installedMap.get(id)?.path ?? null;
  }

  listInstalled(): InstalledPack[] {
    this.ensureLoaded();
    return [...this.installedMap.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
  }

  /** Bytes used by installed packs and unfinished downloads. */
  storageBytes(): { installed: number; partial: number } {
    this.ensureLoaded();
    const installed = [...this.installedMap.values()].reduce((n, p) => n + p.bytes, 0);
    let partial = 0;
    const staging = this.fs.join(this.fs.root, 'staging');
    for (const name of this.fs.list(staging)) {
      const dir = this.fs.join(staging, name);
      for (const f of this.fs.list(dir)) partial += this.fs.fileSize(this.fs.join(dir, f)) ?? 0;
    }
    return { installed, partial };
  }

  onProgress(listener: (p: PackProgress) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  allowCellular(): boolean {
    return this.env.settings.get(SETTING_ALLOW_CELLULAR) === '1';
  }

  setAllowCellular(allow: boolean): void {
    this.env.settings.set(SETTING_ALLOW_CELLULAR, allow ? '1' : '0');
    if (allow) this.resumeWaiting();
  }

  /** Ids waiting for Wi-Fi (shown in Settings > Storage). */
  waiting(): string[] {
    return [...this.waitingForWifi].sort();
  }

  /** Ids with a download in flight or queued. */
  active(): string[] {
    return [...this.jobs.keys()].sort();
  }

  /**
   * Makes a pack available and returns its path. An installed version is
   * returned at once (offline first) and a newer one, if any, is fetched in
   * the background; pass `requireLatest` to wait for it instead.
   */
  async ensurePack(id: string, opts: EnsureOptions = {}): Promise<EnsureResult> {
    this.ensureLoaded();
    const installed = this.installedMap.get(id);
    if (installed && !opts.requireLatest) {
      void this.updateIfNewer(id);
      return { ok: true, path: installed.path, version: installed.version };
    }
    return this.startJob(id, opts);
  }

  /**
   * Lets an engine add the packs it needs for a language, e.g. the speech
   * engine returns the model id for that language and this phone's memory
   * tier. Returns an unregister function.
   */
  addLanguageResolver(resolver: (language: string) => string[]): () => void {
    this.languageResolvers.add(resolver);
    return () => this.languageResolvers.delete(resolver);
  }

  /**
   * "Download when the language is chosen" (decision 15): the language's
   * required packs from the manifest plus whatever registered engines add.
   * Choosing Portuguese fetches Portuguese packs and nothing else. Results by
   * pack id.
   */
  async ensureLanguage(language: string, opts: Omit<EnsureOptions, 'requireLatest'> = {}): Promise<Record<string, EnsureResult>> {
    const manifest = await this.env.manifest();
    const ids = new Set<string>(manifest ? requiredPacksForLanguage(manifest, language, this.env.appVersion).map((e) => e.id) : []);
    for (const resolve of this.languageResolvers) {
      try {
        for (const id of resolve(language)) ids.add(id);
      } catch {
        // an engine's resolver bug never blocks the other packs
      }
    }
    const out: Record<string, EnsureResult> = {};
    for (const id of [...ids].sort()) out[id] = await this.ensurePack(id, opts);
    return out;
  }

  /** Fetches newer versions of installed packs (Wi-Fi policy applies). Called after a manifest refresh. */
  async updateInstalled(): Promise<void> {
    this.ensureLoaded();
    for (const id of [...this.installedMap.keys()]) await this.updateIfNewer(id);
  }

  /** Stops a download. The partial file is kept so the next attempt resumes. */
  cancel(id: string): void {
    this.waitingForWifi.delete(id);
    this.jobs.get(id)?.controller.abort();
  }

  /** Deletes a pack and any partial download of it (Settings > Storage). */
  async removePack(id: string): Promise<void> {
    this.ensureLoaded();
    const job = this.jobs.get(id);
    this.waitingForWifi.delete(id);
    if (job) {
      job.controller.abort();
      // A queued job exits as soon as it reaches the front; only a running one is awaited.
      if (job.started) await job.promise.catch(() => undefined);
    }
    const { fs } = this;
    fs.remove(fs.join(fs.root, 'installed', id));
    const staging = fs.join(fs.root, 'staging');
    for (const name of fs.list(staging)) if (name.startsWith(`${id}@`)) fs.remove(fs.join(staging, name));
    this.installedMap.delete(id);
    this.emit({ id, version: null, phase: 'removed', bytesDone: 0, bytesTotal: 0 }, true);
  }

  // -------------------------------------------------------------------------
  // Jobs
  // -------------------------------------------------------------------------

  private ensureLoaded(): void {
    if (!this.loaded) this.load();
  }

  private async updateIfNewer(id: string): Promise<void> {
    if (this.jobs.has(id)) return;
    const installed = this.installedMap.get(id);
    if (!installed) return;
    const manifest = await this.env.manifest();
    const entry = manifest ? resolvePack(manifest, id, this.env.appVersion) : null;
    if (entry && entry.version > installed.version) await this.startJob(id, {});
  }

  private resumeWaiting(): void {
    for (const id of [...this.waitingForWifi]) {
      this.waitingForWifi.delete(id);
      void this.startJob(id, {});
    }
  }

  private startJob(id: string, opts: EnsureOptions): Promise<EnsureResult> {
    const existing = this.jobs.get(id);
    if (existing) return existing.promise;
    const controller = new AbortController();
    if (opts.signal) {
      if (opts.signal.aborted) controller.abort();
      else opts.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
    const run = async (): Promise<EnsureResult> => {
      const job = this.jobs.get(id);
      if (job) job.started = true;
      try {
        return await this.runJob(id, opts, controller.signal);
      } catch (e) {
        const failure: PackFailure = e instanceof PackError ? e.failure : isAbort(e) ? 'cancelled' : 'storage_error';
        const phase: PackPhase = failure === 'cancelled' ? 'cancelled' : failure === 'waiting_for_wifi' ? 'waiting_for_wifi' : 'failed';
        if (failure === 'waiting_for_wifi') this.waitingForWifi.add(id);
        this.emit({ id, version: null, phase, bytesDone: 0, bytesTotal: 0, failure }, true);
        return { ok: false, reason: failure };
      } finally {
        this.jobs.delete(id);
      }
    };
    this.emit({ id, version: null, phase: 'queued', bytesDone: 0, bytesTotal: 0 }, true);
    const job: Job = { id, controller, promise: Promise.resolve({ ok: false, reason: 'cancelled' }), started: false };
    this.jobs.set(id, job);
    const promise = this.queue.then(run, run);
    job.promise = promise;
    this.queue = promise.catch(() => undefined);
    return promise;
  }

  private async runJob(id: string, opts: EnsureOptions, signal: AbortSignal): Promise<EnsureResult> {
    if (signal.aborted) throw new PackError('cancelled');
    const manifest = await this.env.manifest();
    if (!manifest) throw new PackError('no_manifest');
    const entry = resolvePack(manifest, id, this.env.appVersion);
    if (!entry) throw new PackError(manifest.packs.some((p) => p.id === id) ? 'needs_app_update' : 'not_in_manifest');

    const installed = this.installedMap.get(id);
    if (installed && installed.version >= entry.version) {
      this.waitingForWifi.delete(id);
      return { ok: true, path: installed.path, version: installed.version };
    }
    await this.checkCanDownload(entry, opts);
    this.waitingForWifi.delete(id);

    const { fs } = this;
    const stage = fs.join(fs.root, 'staging', `${entry.id}@${entry.version}`);
    const part = fs.join(stage, `${entry.fileName}.part`);
    const finished = fs.join(stage, entry.fileName);
    const hosts = [entry.url, ...entry.mirrors];

    // A host serving wrong bytes costs one full download; then the next mirror is tried from the start.
    for (let first = 0; first < hosts.length; first++) {
      this.prepareStage(stage, entry);
      // A previous run may have verified and renamed the file but died before the install rename; it is checked again.
      const candidate = fs.exists(finished) ? finished : part;
      if (candidate === part) await this.download(entry, stage, part, opts, signal, first);
      this.emit({ id, version: entry.version, phase: 'verifying', bytesDone: entry.bytes, bytesTotal: entry.bytes }, true);
      const digest = await fs.sha256(candidate, signal);
      if (signal.aborted) throw new PackError('cancelled');
      if (!digestsEqual(digest, entry.sha256)) {
        fs.remove(stage);
        continue;
      }
      if (candidate === part) fs.rename(part, finished);
      return this.install(entry, stage);
    }
    throw new PackError('hash_mismatch');
  }

  private async checkCanDownload(entry: PackEntry, opts: EnsureOptions): Promise<void> {
    if (this.env.downloadsPaused()) throw new PackError('downloads_paused');
    const connection = await this.env.network.connection();
    if (connection === 'none') throw new PackError('offline');
    const cellularOk = entry.bytes <= CELLULAR_FREE_BYTES || this.allowCellular() || opts.allowCellularOnce === true;
    if (connection !== 'wifi' && !cellularOk) throw new PackError('waiting_for_wifi');
    const free = this.fs.freeBytes();
    if (free !== null) {
      const stagePart = this.fs.fileSize(this.fs.join(this.fs.root, 'staging', `${entry.id}@${entry.version}`, `${entry.fileName}.part`)) ?? 0;
      const reserve = entry.bytes > 50_000_000 ? LARGE_PACK_RESERVE_BYTES : SMALL_PACK_RESERVE_BYTES;
      if (free < entry.bytes - stagePart + reserve) throw new PackError('no_space');
    }
  }

  /** Keeps a stage only if it belongs to this exact entry; clears stages of other versions of the same pack. */
  private prepareStage(stage: string, entry: PackEntry): void {
    const { fs } = this;
    const stagingRoot = fs.join(fs.root, 'staging');
    for (const name of fs.list(stagingRoot)) {
      if (name.startsWith(`${entry.id}@`) && name !== `${entry.id}@${entry.version}`) fs.remove(fs.join(stagingRoot, name));
    }
    const metaPath = fs.join(stage, 'meta.json');
    const meta = this.readJson(metaPath) as { sha256?: string; bytes?: number; fileName?: string } | null;
    if (fs.exists(stage) && (!meta || meta.sha256 !== entry.sha256 || meta.bytes !== entry.bytes || meta.fileName !== entry.fileName)) {
      fs.remove(stage);
    }
    if (!fs.exists(stage)) {
      fs.mkdirp(stage);
      this.writeJsonAtomic(metaPath, { sha256: entry.sha256, bytes: entry.bytes, fileName: entry.fileName });
    }
  }

  private async download(entry: PackEntry, stage: string, part: string, opts: EnsureOptions, signal: AbortSignal, firstHost: number): Promise<void> {
    const { fs } = this;
    const chunk = fs.join(stage, 'chunk');
    const hosts = [entry.url, ...entry.mirrors];
    const cls = ENDPOINT_CLASSES.pack_file;
    let have = fs.fileSize(part) ?? 0;
    if (have > entry.bytes) {
      fs.remove(part);
      have = 0;
    }
    let host = firstHost % hosts.length;
    let attempt = 0;
    let first = true;
    this.emit({ id: entry.id, version: entry.version, phase: 'downloading', bytesDone: have, bytesTotal: entry.bytes }, true);
    while (have < entry.bytes) {
      if (signal.aborted) throw new PackError('cancelled');
      // Re-checked at every chunk: a kill switch, a move from Wi-Fi to mobile data or a full disk stops the download; the .part stays.
      if (!first) await this.checkCanDownload(entry, opts);
      first = false;
      const end = Math.min(have + this.chunkBytes, entry.bytes) - 1;
      fs.remove(chunk);
      try {
        await this.env.http.downloadRange(hosts[host], chunk, have, end, {
          signal,
          timeoutMs: cls.timeoutMs,
          onBytes: (n) =>
            this.emit({ id: entry.id, version: entry.version, phase: 'downloading', bytesDone: have + n, bytesTotal: entry.bytes }),
        });
        const got = fs.fileSize(chunk) ?? 0;
        const want = end - have + 1;
        if (got === want) {
          await fs.appendFile(chunk, part);
        } else if (have === 0 && got === entry.bytes) {
          // The host ignored Range and sent the whole file (HTTP 200).
          fs.remove(part);
          fs.rename(chunk, part);
        } else {
          throw new Error('range_mismatch');
        }
        fs.remove(chunk);
        have = fs.fileSize(part) ?? 0;
        attempt = 0;
        this.emit({ id: entry.id, version: entry.version, phase: 'downloading', bytesDone: have, bytesTotal: entry.bytes });
      } catch (e) {
        fs.remove(chunk);
        if (isAbort(e) || signal.aborted) throw new PackError('cancelled');
        if (e instanceof PackError) throw e;
        attempt++;
        host = (host + 1) % hosts.length;
        if (attempt >= cls.maxAttempts * hosts.length) throw new PackError('download_failed');
        try {
          await this.sleep(retryDelayMs('pack_file', Math.ceil(attempt / hosts.length), this.random), signal);
        } catch {
          throw new PackError('cancelled');
        }
      }
    }
  }

  private install(entry: PackEntry, stage: string): EnsureResult {
    const { fs } = this;
    this.emit({ id: entry.id, version: entry.version, phase: 'installing', bytesDone: entry.bytes, bytesTotal: entry.bytes }, true);
    const meta: PackMeta = {
      id: entry.id,
      kind: entry.kind,
      language: entry.language,
      version: entry.version,
      bytes: entry.bytes,
      sha256: entry.sha256,
      fileName: entry.fileName,
      installedAt: new Date(this.now()).toISOString(),
    };
    try {
      this.writeJsonAtomic(fs.join(stage, 'pack.json'), meta);
      fs.remove(fs.join(stage, 'meta.json'));
      const idDir = fs.join(fs.root, 'installed', entry.id);
      fs.mkdirp(idDir);
      const target = fs.join(idDir, String(entry.version));
      fs.remove(target);
      fs.rename(stage, target); // the install point
      const previous = this.installedMap.get(entry.id);
      this.installedMap.set(entry.id, this.toInstalled(meta));
      if (previous && previous.version !== entry.version) fs.remove(fs.join(idDir, String(previous.version)));
    } catch {
      throw new PackError('storage_error');
    }
    const path = this.installedMap.get(entry.id)!.path;
    this.emit({ id: entry.id, version: entry.version, phase: 'installed', bytesDone: entry.bytes, bytesTotal: entry.bytes }, true);
    return { ok: true, path, version: entry.version };
  }

  // -------------------------------------------------------------------------

  private toInstalled(m: PackMeta): InstalledPack {
    return { ...m, path: this.fs.join(this.fs.root, 'installed', m.id, String(m.version), m.fileName) };
  }

  private readMeta(path: string): unknown {
    return this.readJson(path);
  }

  private readJson(path: string): unknown {
    const text = this.fs.readText(path);
    if (text === null) return null;
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private writeJsonAtomic(path: string, value: unknown): void {
    const tmp = `${path}.tmp`;
    this.fs.remove(tmp);
    this.fs.writeText(tmp, JSON.stringify(value));
    this.fs.remove(path);
    this.fs.rename(tmp, path);
  }

  private emit(p: PackProgress, force = false): void {
    const t = this.now();
    const last = this.lastEmit.get(p.id);
    if (!force && last && last.phase === p.phase && t - last.at < 200) return;
    this.lastEmit.set(p.id, { at: t, phase: p.phase });
    for (const l of this.listeners) {
      try {
        l(p);
      } catch {
        // a listener's bug never breaks a download
      }
    }
  }
}
