/**
 * Remote config, pack manifest and content bundle on the device (ADR 0016,
 * founder decisions 15 to 17). Public API:
 *
 *   startRemote()            call once after the first frame (coordinator wires it in _layout)
 *   getRemoteConfig()        sync; last good config or bundled defaults
 *   useRemoteConfig()        React hook of the same
 *   getPackManifest()        sync; last verified manifest or null (src/lib/packs reads it)
 *   getContentBundle()       sync; last verified content bundle or null
 *   useContentBundle()       React hook of the same
 *   refreshRemote(force?)    fetch now (pull to refresh, tests); never throws
 *
 * Nothing here is awaited at launch, and every reader works offline from the
 * last good copy (TDD 01 3.9, A-REQ-002).
 */
import Constants from 'expo-constants';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import {
  CLIENT_REFRESH_MS,
  DEFAULT_REMOTE_CONFIG,
  ENDPOINT_CLASSES,
  ENDPOINTS,
  parseContentBundle,
  parsePackManifest,
  parseRemoteConfig,
  SEMVER_RE,
  TRUSTED_SIGNING_KEYS,
  type ContentBundle,
  type PackManifest,
  type RemoteConfig,
} from '@scribe/api';
import { readSupabaseEnv } from '../supabase/env';
import { SignedDocumentClient, type ParsedPayload, type RefreshOutcome } from './documents';
import { expoDocStorage, fetchDocHttp } from './expo-adapter';

/** The app's own version, as App Review and the manifest's `minAppVersion` see it. */
export const APP_VERSION: string = (() => {
  const v = Constants.expoConfig?.version;
  return typeof v === 'string' && SEMVER_RE.test(v) ? v : '0.0.0';
})();

/**
 * Where documents come from: `EXPO_PUBLIC_DOCS_BASE_URL` when a CDN fronts
 * the functions (ADR 0016), else the Supabase project URL. Null in a build
 * without either: the app uses its bundled defaults and packaged copy.
 */
function docsBase(): string | null {
  const cdn = (process.env.EXPO_PUBLIC_DOCS_BASE_URL ?? '').trim().replace(/\/+$/, '');
  if (/^https:\/\/[^\s/]+$/.test(cdn)) return cdn;
  return readSupabaseEnv()?.url ?? null;
}

const base = docsBase();
const url = (path: string, query = '') => (base ? `${base}${path}${query}` : null);
const storage = expoDocStorage();
const timeoutMs = ENDPOINT_CLASSES.public_document.timeoutMs;
const trustedKeys = () => TRUSTED_SIGNING_KEYS;

const EMPTY_MANIFEST: PackManifest = { schemaVersion: 1, version: 0, generatedAt: '1970-01-01T00:00:00.000Z', packs: [] };
const EMPTY_BUNDLE: ContentBundle = { schemaVersion: 1, version: 0, generatedAt: '1970-01-01T00:00:00.000Z', locale: 'en', blocks: [] };

const strip = <T,>(r: { ok: true; value: T } | { ok: false; reason: string }): ParsedPayload<T> =>
  r.ok ? { ok: true, value: r.value } : { ok: false, reason: r.reason };

export const remoteConfigDoc = new SignedDocumentClient<RemoteConfig>({
  kind: 'remote-config',
  url: url(ENDPOINTS.remoteConfig.path),
  parse: (p) => strip(parseRemoteConfig(p)),
  versionOf: (c) => c.version,
  fallback: DEFAULT_REMOTE_CONFIG,
  storage,
  http: fetchDocHttp,
  trustedKeys,
  appVersion: APP_VERSION,
  minIntervalMs: CLIENT_REFRESH_MS.remoteConfig,
  timeoutMs,
});

export const packManifestDoc = new SignedDocumentClient<PackManifest>({
  kind: 'pack-manifest',
  url: url(ENDPOINTS.packManifest.path),
  parse: (p) => strip(parsePackManifest(p)),
  versionOf: (m) => m.version,
  fallback: EMPTY_MANIFEST,
  storage,
  http: fetchDocHttp,
  trustedKeys,
  appVersion: APP_VERSION,
  minIntervalMs: CLIENT_REFRESH_MS.packManifest,
  timeoutMs,
});

export const contentDoc = new SignedDocumentClient<ContentBundle>({
  kind: 'content-bundle',
  // v1.0 interface is English only (decision 6); the locale is in the URL so a CDN caches each separately.
  url: url(ENDPOINTS.contentBundle.path, '?locale=en'),
  parse: (p) => strip(parseContentBundle(p)),
  versionOf: (b) => b.version,
  fallback: EMPTY_BUNDLE,
  storage,
  http: fetchDocHttp,
  trustedKeys,
  appVersion: APP_VERSION,
  minIntervalMs: CLIENT_REFRESH_MS.contentBundle,
  timeoutMs,
});

export function getRemoteConfig(): RemoteConfig {
  return remoteConfigDoc.current();
}

export function getPackManifest(): PackManifest | null {
  const m = packManifestDoc.current();
  return m.version > 0 ? m : null;
}

export function getContentBundle(): ContentBundle | null {
  if (getRemoteConfig().killSwitches.serverContent) return null;
  const b = contentDoc.current();
  return b.version > 0 ? b : null;
}

export function useRemoteConfig(): RemoteConfig {
  return useSyncExternalStore((cb) => remoteConfigDoc.subscribe(cb), getRemoteConfig, getRemoteConfig);
}

export function useContentBundle(): ContentBundle | null {
  const bundle = useSyncExternalStore((cb) => contentDoc.subscribe(cb), () => contentDoc.current(), () => contentDoc.current());
  const config = useRemoteConfig();
  return config.killSwitches.serverContent || bundle.version === 0 ? null : bundle;
}

export interface RefreshSummary {
  config: RefreshOutcome;
  manifest: RefreshOutcome;
  content: RefreshOutcome;
}

const afterManifest = new Set<() => void>();

/** Called by src/lib/packs to fetch pack updates when a newer manifest arrives. */
export function onManifestUpdated(listener: () => void): () => void {
  afterManifest.add(listener);
  return () => afterManifest.delete(listener);
}

export async function refreshRemote(force = false): Promise<RefreshSummary> {
  // Config first: its kill switches decide whether content is used.
  const config = await remoteConfigDoc.refresh(force);
  const [manifest, content] = await Promise.all([packManifestDoc.refresh(force), contentDoc.refresh(force)]);
  if (manifest === 'updated') for (const l of afterManifest) l();
  return { config, manifest, content };
}

let started = false;

/** Starts background refreshes: now, and whenever the app returns to the foreground (each document keeps its own minimum interval). */
export function startRemote(): () => void {
  if (started) return () => undefined;
  started = true;
  remoteConfigDoc.load();
  packManifestDoc.load();
  contentDoc.load();
  void refreshRemote();
  const sub = AppState.addEventListener('change', (s) => {
    if (s === 'active') void refreshRemote();
  });
  return () => {
    sub.remove();
    started = false;
  };
}
