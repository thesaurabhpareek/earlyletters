/**
 * Speech packs through the platform pack system (founder decision 15).
 *
 * The pack engine (src/lib/packs, `PackManager`) downloads, resumes,
 * verifies SHA-256 against the signed manifest and installs. This file only
 * decides WHICH speech packs a phone needs (catalog.ts) and asks for them.
 *
 * Host: the platform facade (`src/lib/packs`: ensurePack, packPath,
 * onProgress, removePack, addLanguageResolver). The interface below is the
 * subset this area uses, typed structurally; `bindSpeechPacks` replaces it
 * (tests). The speech plan registers itself as a language resolver, so the
 * platform's `ensureLanguage(lang)` fetches that language's speech packs too.
 *
 * Development builds only: when the platform cannot supply a model (no signed
 * manifest published yet), a model copied by hand into Application
 * Support/models is used, after its SHA-256 matches the catalog.
 */
import { File } from 'expo-file-system';
import * as Device from 'expo-device';
import { ScribeAudio } from '../../../modules/scribe-audio';
import { devShortcutsAllowed } from '../build-env';
import * as platformPacks from '../packs';
import { modelsDirectory } from '../model-files';
import { getSetting, setSetting } from '../store';
import {
  SPEECH_MODELS,
  isSpeechLanguage,
  speechPlan,
  type Availability,
  type SpeechLanguage,
  type SpeechModelId,
  type SpeechPlan,
  type Tier,
} from './catalog';
import { pickTier } from './tiers';

export type SpeechPackPhase =
  | 'queued'
  | 'waiting_for_wifi'
  | 'downloading'
  | 'verifying'
  | 'installing'
  | 'installed'
  | 'failed'
  | 'cancelled'
  | 'removed';

export interface SpeechPackProgress {
  id: string;
  phase: SpeechPackPhase | string;
  bytesDone: number;
  bytesTotal: number;
  failure?: string;
}

export type SpeechEnsureResult = { ok: true; path: string } | { ok: false; reason: string };

/** The part of the platform pack API this area calls. */
export interface SpeechPackHost {
  packPath(id: string): string | null;
  ensurePack(id: string, opts?: { allowCellularOnce?: boolean; signal?: AbortSignal }): Promise<SpeechEnsureResult>;
  onProgress(listener: (p: SpeechPackProgress) => void): () => void;
  removePack(id: string): Promise<void>;
  addLanguageResolver?(resolver: (language: string) => string[]): () => void;
}

const platformHost: SpeechPackHost = {
  packPath: (id) => platformPacks.packPath(id),
  ensurePack: (id, opts) => platformPacks.ensurePack(id, opts),
  onProgress: (listener) => platformPacks.onProgress(listener),
  removePack: (id) => platformPacks.removePack(id),
  addLanguageResolver: (resolver) => platformPacks.addLanguageResolver(resolver),
};

let host: SpeechPackHost | null = null;
const hostListeners = new Set<() => void>();

export function bindSpeechPacks(h: SpeechPackHost): void {
  host = h;
  hostListeners.forEach((l) => l());
}

export function speechPackHost(): SpeechPackHost {
  if (host) return host;
  return devShortcutsAllowed ? withDevFallback(platformHost) : platformHost;
}

/** Packs a language needs on this phone, for the platform's `ensureLanguage` (empty for languages without speech). */
export function speechPacksForLanguage(language: string): string[] {
  const primary = language.split('-')[0];
  return isSpeechLanguage(primary) ? planFor([primary]).packs : [];
}

/** Called when a host is bound (the queue re-checks waiting letters). */
export function onSpeechPacksBound(listener: () => void): () => void {
  hostListeners.add(listener);
  return () => hostListeners.delete(listener);
}

// ---------------------------------------------------------------------------
// Tier and plan for this phone
// ---------------------------------------------------------------------------

const MEMORY_FAILURES_KEY = 'speech.memoryFailures';

export function memoryFailures(): number {
  const n = Number(getSetting(MEMORY_FAILURES_KEY) ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** A large model was killed by the system or would not load. Two of these move the phone to the compact tier. */
export function recordMemoryFailure(): void {
  setSetting(MEMORY_FAILURES_KEY, String(memoryFailures() + 1));
}

export function deviceTier(): Tier {
  return pickTier({ totalMemoryBytes: Device.totalMemory ?? null, memoryFailures: memoryFailures() });
}

/**
 * A model may be chosen when it is hosted, or when this phone already has it
 * installed (so a language keeps its model if the host list changes).
 */
export function availability(): Availability {
  const h = speechPackHost();
  return (id) => SPEECH_MODELS[id].status === 'default' && (SPEECH_MODELS[id].hosted || h.packPath(id) !== null);
}

export function planFor(languages: readonly SpeechLanguage[], tier: Tier = deviceTier()): SpeechPlan {
  return speechPlan(languages, tier, availability());
}

/** Installed paths of every pack a language needs on this phone, or null if any is missing. */
export function installedPathsFor(language: SpeechLanguage, tier: Tier = deviceTier()): { asr: string; vad: string; asrId: SpeechModelId } | null {
  const h = speechPackHost();
  const plan = planFor([language], tier);
  const asrId = plan.asr[language];
  if (!asrId) return null;
  const asr = h.packPath(asrId);
  const vad = h.packPath(plan.packs[0]);
  return asr && vad ? { asr, vad, asrId } : null;
}

/**
 * Starts (or joins) the downloads a language needs: the voice detector and
 * its recogniser. Wi-Fi and storage rules are the pack engine's. Resolves
 * when every pack is installed or one cannot be fetched now.
 */
export async function ensureSpeechFor(language: SpeechLanguage, opts: { allowCellularOnce?: boolean; signal?: AbortSignal } = {}): Promise<SpeechEnsureResult> {
  const h = speechPackHost();
  const plan = planFor([language]);
  let asrPath = '';
  for (const id of plan.packs) {
    const r = await h.ensurePack(id, opts);
    if (!r.ok) return r;
    if (id === plan.asr[language]) asrPath = r.path;
  }
  return { ok: true, path: asrPath };
}

/** Download progress (0..1) across a language's packs, or null when nothing is in flight. */
export function combineProgress(language: SpeechLanguage, latest: ReadonlyMap<string, SpeechPackProgress>): number | null {
  const plan = planFor([language]);
  let done = 0;
  let total = 0;
  let active = false;
  const h = speechPackHost();
  for (const id of plan.packs) {
    const bytes = SPEECH_MODELS[id].bytes;
    total += bytes;
    if (h.packPath(id)) {
      done += bytes;
      continue;
    }
    const p = latest.get(id);
    if (p && p.phase !== 'failed' && p.phase !== 'cancelled' && p.phase !== 'removed') active = true;
    done += p ? Math.min(bytes, p.bytesDone) : 0;
  }
  return active && total > 0 ? done / total : null;
}

// ---------------------------------------------------------------------------
// Development fallback (hand-copied model files), never in preview or store builds
// ---------------------------------------------------------------------------

const verified = new Map<string, string>();

async function devModel(id: string): Promise<SpeechEnsureResult> {
  const known = verified.get(id);
  if (known) return { ok: true, path: known };
  const model = SPEECH_MODELS[id as SpeechModelId];
  if (!model || !ScribeAudio) return { ok: false, reason: 'not_in_manifest' };
  const file = new File(modelsDirectory().dir, model.fileName);
  if (!file.exists) return { ok: false, reason: 'not_in_manifest' };
  const sha = await ScribeAudio.sha256File(file.uri).catch(() => null);
  if (sha !== model.sha256) return { ok: false, reason: 'hash_mismatch' };
  verified.set(id, file.uri);
  return { ok: true, path: file.uri };
}

function withDevFallback(base: SpeechPackHost): SpeechPackHost {
  return {
    ...base,
    packPath: (id) => base.packPath(id) ?? verified.get(id) ?? null,
    async ensurePack(id, opts) {
      const r = await base.ensurePack(id, opts).catch(() => ({ ok: false as const, reason: 'download_failed' }));
      return r.ok ? r : devModel(id);
    },
    async removePack(id) {
      verified.delete(id);
      await base.removePack(id);
    },
  };
}
