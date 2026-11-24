/**
 * Language and model packs: the public API other features call (ADR 0016,
 * founder decision 15). The engine and its tests are in engine.ts.
 *
 *   ensurePack(id, opts?)       download if needed, verify, install; resolves to { ok, path } or { ok: false, reason }
 *   packPath(id)                sync path of the installed file, or null
 *   onProgress(listener)        progress for every pack; returns unsubscribe
 *   listInstalled()             what is on this phone
 *   removePack(id)              delete a pack and any partial download
 *   cancelPack(id)              stop a download (the partial file is kept for resume)
 *   ensureLanguage(language)    "download when the language is chosen"
 *   addLanguageResolver(fn)     an engine adds the pack ids it needs for a language
 *   setAllowCellular(allow)     the person's "Use mobile data" choice
 *   startPacks()                call once after the first frame (coordinator wires it in _layout)
 *
 * Pack ids are `<kind>.<name>`: `text-rules.pt`, `prompts.hi`,
 * `speech-model.whisper-large-v3-turbo-q5_0`. The manifest (signed, from
 * src/lib/remote) says what exists; nothing unsigned is ever installed.
 */
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getSetting, setSetting } from '../store';
import { APP_VERSION, getPackManifest, getRemoteConfig, onManifestUpdated, packManifestDoc } from '../remote';
import { appSupportDir } from './app-support';
import { PackManager, type EnsureOptions, type EnsureResult, type InstalledPack, type PackProgress } from './engine';
import { expoNetwork, expoPackHttp, ExpoPackFs } from './expo-adapter';
import { WebPackFs } from './web-fs';

export type { EnsureOptions, EnsureResult, InstalledPack, PackFailure, PackPhase, PackProgress } from './engine';
export { CELLULAR_FREE_BYTES } from './engine';

let manager: PackManager | null = null;

function packs(): PackManager {
  if (manager) return manager;
  const root = appSupportDir('packs').dir.uri;
  // BL-2174: on web there is no pack folder and no signed manifest is fetched; the manager sees an empty, in-memory
  // phone, so nothing is installed, nothing downloads and `ensurePack` answers `no_manifest` instead of throwing.
  const web = Platform.OS === 'web';
  manager = new PackManager({
    fs: web ? new WebPackFs(root) : new ExpoPackFs(root),
    http: expoPackHttp,
    network: expoNetwork,
    settings: { get: getSetting, set: setSetting },
    appVersion: APP_VERSION,
    manifest: async () => {
      if (web) return null;
      // A manifest older than the refresh interval is refreshed first; failures fall back to the last good copy.
      await packManifestDoc.refresh().catch(() => undefined);
      return getPackManifest();
    },
    downloadsPaused: () => getRemoteConfig().killSwitches.packDownloads,
  });
  return manager;
}

export function ensurePack(id: string, opts?: EnsureOptions): Promise<EnsureResult> {
  return packs().ensurePack(id, opts);
}

export function packPath(id: string): string | null {
  return packs().packPath(id);
}

export function onProgress(listener: (p: PackProgress) => void): () => void {
  return packs().onProgress(listener);
}

export function listInstalled(): InstalledPack[] {
  return packs().listInstalled();
}

export function removePack(id: string): Promise<void> {
  return packs().removePack(id);
}

export function cancelPack(id: string): void {
  packs().cancel(id);
}

export function ensureLanguage(language: string, opts?: Omit<EnsureOptions, 'requireLatest'>): Promise<Record<string, EnsureResult>> {
  return packs().ensureLanguage(language, opts);
}

export function addLanguageResolver(resolver: (language: string) => string[]): () => void {
  return packs().addLanguageResolver(resolver);
}

export function allowCellular(): boolean {
  return packs().allowCellular();
}

export function setAllowCellular(allow: boolean): void {
  packs().setAllowCellular(allow);
}

export function storageBytes(): { installed: number; partial: number } {
  return packs().storageBytes();
}

export function waitingForWifi(): string[] {
  return packs().waiting();
}

export function activeDownloads(): string[] {
  return packs().active();
}

let stopManifestListener: (() => void) | null = null;

/** Repairs the pack folder after a crash and fetches updates of installed packs when a newer manifest arrives. */
export function startPacks(): () => void {
  const m = packs();
  m.load();
  stopManifestListener ??= onManifestUpdated(() => void m.updateInstalled());
  return () => {
    stopManifestListener?.();
    stopManifestListener = null;
  };
}

/** Installed packs plus live progress, for Settings > Storage. */
export function usePacks(): { installed: InstalledPack[]; progress: Record<string, PackProgress> } {
  const [installed, setInstalled] = useState<InstalledPack[]>(() => listInstalled());
  const [progress, setProgress] = useState<Record<string, PackProgress>>({});
  useEffect(
    () =>
      onProgress((p) => {
        setProgress((prev) => ({ ...prev, [p.id]: p }));
        if (p.phase === 'installed' || p.phase === 'removed') setInstalled(listInstalled());
      }),
    [],
  );
  return { installed, progress };
}
