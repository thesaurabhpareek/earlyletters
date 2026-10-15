/**
 * Backup in the app: the native adapters behind the ports, and the one
 * service per signed-in person (WP-F08-B5a to B5c). Loaded only through
 * gate.ts, in a build with `capabilities.backup` on. The only file in
 * lib/backup that imports React Native, Expo or supabase-js.
 *
 * Wiring:
 * - Keys: the `ScribeKeys` module (CryptoKit, Keychain). Book key items under
 *   service `scribe.backup`, account `<profile_id>:<child_id>:v<n>` (the codename,
 *   never the public name, so it never changes; ADR 0023 section 2).
 * - Files: expo-file-system; hashes by `ScribeAudio.sha256File` (streamed natively).
 * - Uploads: Supabase Storage's resumable endpoint with the user's JWT, or the
 *   signed upload token `backup_begin` returns.
 * - When: at launch after the first frame, on foreground, after a store
 *   change (debounced), when the network changes and after sign-in. Never in
 *   the background, never while recording or playing (Conditions).
 */
import { File, Directory, FileMode, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import { AppState } from 'react-native';
import Constants from 'expo-constants';
import type { SupabaseClient } from '@supabase/supabase-js';
import { HEADER_IDEMPOTENCY_KEY } from '@scribe/api';
import { ScribeAudio } from '../../../modules/scribe-audio';
import { ScribeKeys, scribeKeysErrorCode } from '../../../modules/scribe-keys';
import { getAudioMode } from '../audio-mode';
import { activeTakeId } from '../capture/recorder';
import { openNativeDb } from '../db/repos/open-native';
import { getRemoteConfig } from '../remote';
import { localSqlDb, notifyStoreChanged, subscribe, uuidv7 } from '../store';
import { errorCode, errorStatus, getSupabaseOrNull, isNetworkError } from '../supabase';
import { readSupabaseEnv } from '../supabase/env';
import { APP_ENV } from '../build-env';
import { b64 } from './bytes';
import {
  BACKUP_BUCKET,
  BACKUP_POLICY_DOCUMENT,
  BACKUP_RPC,
  BackupServerError,
  type BackupServer,
  type EscrowClient,
  type EscrowPublicKey,
} from './contract';
import { BUNDLED_ESCROW_KEYS } from './escrow-keys';
import { BACKUP_DB_FILE, openBackupDb, type BackupDb } from './local-db';
import { backupSource, restoreLocal } from './local-store';
import type { Aead, BookKeyRef, ByteSink, ByteSource, Conditions, FileIO, KeyVault, NetworkKind } from './ports';
import { createBackupService, type BackupService, type BackupView } from './service';
import type { HttpLike } from './tus';
import {
  BLOB_COLUMNS,
  CHILD_KEY_COLUMNS,
  beginArgs,
  blobRow,
  childKeyRow,
  confirmArgs,
  createEscrowClient,
  registerDeviceArgs,
  storeKeyArgs,
  type BlobWire,
  type ChildKeyWire,
} from './wire';

export const KEYCHAIN_SERVICE = 'scribe.backup';
/** The base account of a book key; the native module appends `:v<n>`, one item per version. */
const account = (r: BookKeyRef) => `${r.profileId}:${r.childId}`;

// ── Keys and segments ─────────────────────────────────────────────────────

function nativeVault(): KeyVault {
  const k = ScribeKeys;
  const need = () => {
    if (!k) throw Object.assign(new Error('backup_unsupported'), { code: 'unsupported' });
    return k;
  };
  return {
    supported: () => !!k && k.isSupported(),
    deviceKey: () => need().deviceKey(),
    createDeviceKey: () => need().createDeviceKey(),
    deleteDeviceKey: () => need().deleteDeviceKey(),
    bookKeyVersions: (r) => need().bookKeyVersions(KEYCHAIN_SERVICE, account(r)),
    createBookKey: async (r, v) => {
      try {
        await need().createBookKey(KEYCHAIN_SERVICE, account(r), v);
      } catch (e) {
        if (scribeKeysErrorCode(e) === 'ERR_SCRIBE_KEYS_EXISTS') throw Object.assign(new Error('key_exists'), { code: 'key_exists' });
        throw e;
      }
    },
    deleteBookKeys: (r) => need().deleteBookKeys(KEYCHAIN_SERVICE, account(r)),
    bookKeyCheck: (r, v, label) => need().bookKeyCheck(KEYCHAIN_SERVICE, account(r), v, label),
    wrapFileKey: (r, v, key, aad) => need().wrapFileKey(KEYCHAIN_SERVICE, account(r), v, key, aad),
    unwrapFileKey: (r, v, wrapped, aad) => need().unwrapFileKey(KEYCHAIN_SERVICE, account(r), v, wrapped, aad),
    sealBookKey: (r, v, recipient, info, aad) => need().sealBookKey(KEYCHAIN_SERVICE, account(r), v, recipient, info, aad),
    openBookKey: async (r, v, s, info, aad, check) => {
      try {
        await need().openBookKey(KEYCHAIN_SERVICE, account(r), v, s.enc, s.ct, info, aad, check?.label ?? new Uint8Array(0), check?.expected ?? null);
      } catch (e) {
        if (scribeKeysErrorCode(e) === 'ERR_SCRIBE_KEYS_CHECK') throw Object.assign(new Error('key_check_failed'), { code: 'key_check_failed' });
        throw e;
      }
    },
    randomBytes: (n) => Crypto.getRandomBytes(n),
  };
}

const nativeAead: Aead = {
  seal: (key, nonce, pt, aad) => ScribeKeys!.aesGcmSeal(key, nonce, pt, aad),
  open: (key, nonce, sealed, aad) => ScribeKeys!.aesGcmOpen(key, nonce, sealed, aad),
};

// ── Files ─────────────────────────────────────────────────────────────────

let tmpDir: string | null = null;
const tmpDirectory = () => (tmpDir ??= ScribeKeys!.backupTmpDirectory());
const join = (dir: string, name: string) => `${dir.replace(/\/+$/, '')}/${name}`;

const nativeFiles: FileIO = {
  exists: (uri) => new File(uri).exists,
  size: (uri) => {
    const f = new File(uri);
    return f.exists ? f.size : null;
  },
  openRead(uri): ByteSource {
    const h = new File(uri).open(FileMode.ReadOnly);
    return { read: (n) => (n === 0 ? new Uint8Array(0) : h.readBytes(n)), close: () => h.close() };
  },
  openWrite(uri): ByteSink {
    const f = new File(uri);
    if (f.exists) f.delete();
    f.create();
    const h = f.open(FileMode.WriteOnly);
    return { write: (b) => h.writeBytes(b), close: () => h.close() };
  },
  readSlice(uri, offset, length) {
    const h = new File(uri).open(FileMode.ReadOnly);
    try {
      h.offset = offset;
      return h.readBytes(length);
    } finally {
      h.close();
    }
  },
  remove(uri) {
    const f = new File(uri);
    if (f.exists) f.delete();
  },
  moveNoReplace(from, to) {
    const dest = new File(to);
    if (dest.exists) throw Object.assign(new Error('exists'), { code: 'exists' });
    new File(from).moveSync(dest);
  },
  sha256: async (uri) => {
    if (!ScribeAudio) throw new Error('backup_unsupported');
    return ScribeAudio.sha256File(uri);
  },
  tmpUri: (name) => join(tmpDirectory(), name),
  listTmp: () =>
    new Directory(tmpDirectory())
      .list()
      .filter((e): e is File => e instanceof File)
      .map((f) => f.uri),
  documentUri: (name) => join(Paths.document.uri, name),
};

// ── Server (main project) ─────────────────────────────────────────────────

function serverError(e: unknown, status?: number | null): BackupServerError {
  if (isNetworkError(e) || status === 0) return new BackupServerError('network', true);
  const code = errorCode(e) ?? `HTTP${status ?? errorStatus(e) ?? 0}`;
  const s = status ?? errorStatus(e) ?? 0;
  // PostgREST passes the SQL `detail` through as `details`: a closed word (`entry`, `key`, `key_exists`), never content.
  const raw = (e as { details?: unknown } | null)?.details;
  const detail = typeof raw === 'string' && /^[a-z_]{1,32}$/.test(raw) ? raw : null;
  const retryable = code === 'SCRAT' || code === 'SCBKO' || s === 408 || s === 429 || s >= 500 || /^(40001|40P01|55P03|57014|08|53|57|58)/.test(code);
  return new BackupServerError(code, retryable, null, detail);
}

function supabaseServer(sb: SupabaseClient, accessToken: () => Promise<string | null>, profileId: string): BackupServer {
  const env = readSupabaseEnv();
  async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    let r;
    try {
      r = await sb.rpc(fn, args);
    } catch (e) {
      throw serverError(e, 0);
    }
    if (r.error) throw serverError(r.error, r.status);
    return r.data as T;
  }
  async function select<T>(table: string, columns: string, opts: { confirmedOnly?: boolean; profileColumn?: string } = {}): Promise<T[]> {
    let q = sb.from(table).select(columns);
    if (opts.profileColumn) q = q.eq(opts.profileColumn, profileId);
    if (opts.confirmedOnly) q = q.eq('state', 'confirmed');
    const { data, error, status } = await q;
    if (error) throw serverError(error, status);
    return (data ?? []) as unknown as T[];
  }
  return {
    registerDevice: async (x) => {
      await rpc(BACKUP_RPC.registerDevice, registerDeviceArgs(x));
    },
    // RLS: the owner reads their own rows; every column but escrow_wrap is granted. Filtered to me as well,
    // so a policy that ever let a co-parent read rows could not make this phone act on their key.
    listKeys: async () => (await select<ChildKeyWire>('child_keys', CHILD_KEY_COLUMNS, { profileColumn: 'profile_id' })).map(childKeyRow),
    storeKey: async (k) => {
      await rpc(BACKUP_RPC.storeKey, storeKeyArgs(k));
    },
    begin: async (b) => {
      // The server returns no upload token (SQL cannot mint one): uploads go with the user's JWT.
      const r = await rpc<{ object_path: string; state: 'pending' | 'confirmed' }>(BACKUP_RPC.begin, beginArgs(b));
      return { objectPath: r.object_path, state: r.state, uploadToken: null };
    },
    confirm: async (entryId, cipherSha256) => {
      await rpc(BACKUP_RPC.confirm, confirmArgs(entryId, cipherSha256));
    },
    // RLS: the author reads their own rows; filtered to me again, by author and by the path built from it.
    listBlobs: async () =>
      (await select<BlobWire>('audio_blobs', BLOB_COLUMNS, { profileColumn: 'author_id', confirmedOnly: true }))
        .map((r) => blobRow(r, profileId))
        .filter((r): r is NonNullable<typeof r> => r !== null),
    recordConsent: async (action) => {
      const { data, error } = await sb
        .from('policy_versions')
        .select('version, major, minor, patch')
        .eq('document', BACKUP_POLICY_DOCUMENT)
        .lte('new_users_from', new Date().toISOString())
        .order('major', { ascending: false })
        .order('minor', { ascending: false })
        .order('patch', { ascending: false })
        .limit(1);
      if (error) throw serverError(error);
      const version = (data?.[0] as { version?: string } | undefined)?.version;
      if (!version) throw new BackupServerError('policy_version_missing', false);
      const r = await sb
        .rpc('record_policy_act', {
          p_document: BACKUP_POLICY_DOCUMENT,
          p_version: version,
          p_action: action,
          p_method: 'backup_sheet',
          p_surface: 'settings.backup',
          p_app_version: (Constants.expoConfig?.version ?? '0.0.0').slice(0, 32),
          p_platform: 'ios',
          p_locale: 'en',
          p_client_recorded_at: new Date().toISOString(),
          p_context: {},
        })
        .setHeader(HEADER_IDEMPOTENCY_KEY, uuidv7());
      if (r.error) throw serverError(r.error, r.status);
    },
    uploadTarget: async (_objectPath, uploadToken) => {
      if (!env) throw new BackupServerError('not_configured', false);
      const headers: Record<string, string> = { apikey: env.key };
      if (uploadToken) headers['x-signature'] = uploadToken;
      else {
        const token = await accessToken();
        if (!token) throw new BackupServerError('signed_out', false);
        headers.Authorization = `Bearer ${token}`;
      }
      return { endpoint: `${env.url}/storage/v1/upload/resumable`, headers };
    },
    downloadUrl: async (objectPath) => {
      const { data, error } = await sb.storage.from(BACKUP_BUCKET).createSignedUrl(objectPath, 120);
      if (error || !data?.signedUrl) throw serverError(error ?? {}, errorStatus(error));
      return data.signedUrl;
    },
  };
}

// ── Escrow (separate project) ─────────────────────────────────────────────

/** [R] `EXPO_PUBLIC_ESCROW_URL`: the `scribe-escrow` project's URL (routes in wire.ts). Unset: escrow is unavailable. */
const ESCROW_URL = process.env.EXPO_PUBLIC_ESCROW_URL ?? '';

function escrowClient(accessToken: () => Promise<string | null>): EscrowClient {
  return createEscrowClient({
    baseUrl: ESCROW_URL,
    accessToken,
    fetch: (url, init) => fetch(url, init),
    idempotency: { header: HEADER_IDEMPOTENCY_KEY, newId: uuidv7 },
  });
}

/**
 * [R] `EXPO_PUBLIC_ESCROW_KEY` (`v<version>:<base64>`): the staging drill key in development and
 * preview builds. A production build ignores it and trusts only the bundled keys, so a stray
 * variable can never seal families' book keys to a drill key.
 */
function escrowKeys(): readonly EscrowPublicKey[] {
  if (APP_ENV === 'production') return BUNDLED_ESCROW_KEYS;
  const m = /^v(\d+):([A-Za-z0-9+/=]{44})$/.exec((process.env.EXPO_PUBLIC_ESCROW_KEY ?? '').trim());
  if (!m) return BUNDLED_ESCROW_KEYS;
  try {
    b64(m[2]);
    return [...BUNDLED_ESCROW_KEYS, { version: Number(m[1]), publicKey: m[2] }];
  } catch {
    return BUNDLED_ESCROW_KEYS;
  }
}

// ── Transport ─────────────────────────────────────────────────────────────

const http: HttpLike = async (url, init) => {
  const body = init.body ? (init.body.buffer.slice(init.body.byteOffset, init.body.byteOffset + init.body.byteLength) as ArrayBuffer) : undefined;
  const r = await fetch(url, { method: init.method, headers: init.headers, body });
  return { status: r.status, header: (n) => r.headers.get(n) };
};

const downloader = {
  async download(url: string, toUri: string): Promise<void> {
    try {
      await File.downloadFileAsync(url, new File(toUri), { idempotent: true });
    } catch (e) {
      const status = Number(/\b([45]\d\d)\b/.exec(String((e as Error)?.message ?? ''))?.[1] ?? 0);
      throw new BackupServerError(`HTTP${status}`, status === 0 || status === 408 || status === 429 || status >= 500);
    }
  },
};

// ── Conditions ────────────────────────────────────────────────────────────

let netKind: NetworkKind = 'unknown';
async function network(): Promise<NetworkKind> {
  try {
    const s = await Network.getNetworkStateAsync();
    if (s.isConnected === false) netKind = 'none';
    else if (s.type === Network.NetworkStateType.WIFI) netKind = 'wifi';
    else if (s.type === Network.NetworkStateType.CELLULAR) netKind = 'cellular';
    else if (s.type === Network.NetworkStateType.NONE) netKind = 'none';
    else netKind = 'unknown';
  } catch {
    netKind = 'unknown';
  }
  return netKind;
}

function conditions(db: () => BackupDb | null): Conditions {
  return {
    network,
    foreground: () => AppState.currentState === 'active',
    busy: () => getAudioMode() !== 'idle' || activeTakeId() !== null,
    cellularAllowed: () => db()?.getMeta('cellular') === 'on',
    // `backupUploads` and `escrow` are in the remote-config vocabulary from #138 (S07); on develop's schema they read false.
    uploadsKilled: () => (getRemoteConfig().killSwitches as Record<string, boolean | undefined>).backupUploads === true,
    escrowKilled: () => (getRemoteConfig().killSwitches as Record<string, boolean | undefined>).escrow === true,
  };
}

// ── One service per signed-in person ──────────────────────────────────────

let backupDb: BackupDb | null = null;
let service: BackupService | null = null;
let serviceFor: string | null = null;
let lastView: BackupView | null = null;
const listeners = new Set<() => void>();

function db(): BackupDb {
  if (!backupDb) backupDb = openBackupDb(openNativeDb(BACKUP_DB_FILE).db, () => new Date().toISOString());
  return backupDb;
}

async function session(sb: SupabaseClient): Promise<{ uid: string; token: string } | null> {
  const { data } = await sb.auth.getSession();
  const s = data.session;
  return s?.user?.id && s.access_token ? { uid: s.user.id, token: s.access_token } : null;
}

async function current(): Promise<BackupService | null> {
  const sb = getSupabaseOrNull();
  if (!sb) return null;
  const s = await session(sb).catch(() => null);
  if (!s) {
    service = null;
    serviceFor = null;
    return null;
  }
  if (service && serviceFor === s.uid) return service;
  const token = async () => (await session(sb).catch(() => null))?.token ?? null;
  const vault = nativeVault();
  service = createBackupService({
    db: db(),
    vault,
    aead: nativeAead,
    files: nativeFiles,
    server: supabaseServer(sb, token, s.uid),
    escrow: escrowClient(token),
    http,
    downloader,
    conditions: conditions(() => backupDb),
    clock: { now: () => Date.now(), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) },
    profileId: s.uid,
    source: backupSource({ db: localSqlDb, profileId: s.uid }),
    local: restoreLocal({ db: localSqlDb, profileId: s.uid, fileExists: nativeFiles.exists, changed: notifyStoreChanged }),
    escrowKeys,
  });
  serviceFor = s.uid;
  return service;
}

function emit(): void {
  lastView = service?.view() ?? null;
  for (const l of listeners) l();
}

let timer: ReturnType<typeof setTimeout> | null = null;
/** Coalesces bursts (a save emits several store events) into one pass a few seconds later. */
function kick(delayMs = 3000): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void current()
      .then((s) => s?.tick())
      .catch(() => undefined)
      .finally(emit);
  }, delayMs);
}

let started = false;

/** Once per process, from the root layout through gate.ts. Never throws. */
export function startBackupRuntime(): void {
  if (started || !ScribeKeys) return;
  started = true;
  void current()
    .then((s) => s?.start())
    .catch(() => undefined)
    .finally(emit);
  AppState.addEventListener('change', (st) => {
    if (st === 'active') kick(500);
  });
  Network.addNetworkStateListener(() => kick(1000));
  subscribe(() => kick());
  getSupabaseOrNull()?.auth.onAuthStateChange(() => kick(500));
}

// ── What the Settings screen uses ─────────────────────────────────────────

export function subscribeBackup(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The last known state: null when signed out or not loaded yet. */
export function backupView(): BackupView | null {
  return lastView;
}

export async function refreshBackup(): Promise<BackupView | null> {
  const s = await current().catch(() => null);
  emit();
  return s?.view() ?? null;
}

export async function signedIn(): Promise<boolean> {
  return (await current().catch(() => null)) !== null;
}

export async function turnOnBackup(): Promise<'on' | 'unavailable' | 'signed_out'> {
  const s = await current();
  if (!s) return 'signed_out';
  const r = await s.turnOn();
  emit();
  kick(500);
  return r;
}

export async function turnOffBackupKeep(): Promise<void> {
  const s = await current();
  if (!s) return;
  await s.turnOffKeep();
  emit();
}

export function backupCellular(): boolean {
  return service?.cellular() ?? false;
}

export function setBackupCellular(on: boolean): void {
  service?.setCellular(on);
  emit();
  if (on) kick(500);
}

/** A letter was opened: bring its recording back now if it is backed up and not on this phone. */
export function restoreForLetter(entryId: string): void {
  void current()
    .then((s) => s?.restore.restoreEntry(entryId))
    .then((r) => {
      if (r?.kind === 'done') notifyStoreChanged();
    })
    .catch(() => undefined);
}

export function tryRestoreAgain(): void {
  service?.restore.clearStopped();
  kick(0);
}
