/**
 * whisper.rn contexts and their lifecycle (TDD 03 3.5.4, ADR 0015).
 *
 * - One recogniser context and one voice-detector context at a time, created
 *   lazily by the transcription queue, never at launch (A-REQ-002).
 * - Released 45 s after the last use, when the app goes to the background,
 *   and on the system memory warning, so a 1 GB model never sits in memory
 *   while the parent does something else (TDD 03 H-5).
 * - Switching language to one served by another model releases the old one
 *   first: two large models never share memory.
 * - Native whisper.cpp logging stays off: in debug builds it can print
 *   decoded text, which must never reach logs (LEGAL-REQ-014).
 * - Requires a development or store build: whisper.rn is a native module and
 *   is not in Expo Go. It is required lazily so Expo Go never touches it.
 */
import { AppState, type NativeEventSubscription } from 'react-native';
import type { WhisperContext, WhisperVadContext } from 'whisper.rn/index';
import { nativePath } from './paths';

type WhisperModule = typeof import('whisper.rn/index');

export const IDLE_RELEASE_MS = 45_000;

let mod: WhisperModule | null | undefined;

/** whisper.rn when its native side is present (development or store build), else null. */
export function whisperModule(): WhisperModule | null {
  if (mod !== undefined) return mod;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const m = require('whisper.rn/index') as WhisperModule;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TurboModuleRegistry } = require('react-native') as typeof import('react-native');
    mod = TurboModuleRegistry.get('RNWhisper') ? m : null;
  } catch {
    mod = null;
  }
  if (mod) void mod.toggleNativeLog(false).catch(() => {});
  return mod;
}

export interface Contexts {
  asr: WhisperContext;
  vad: WhisperVadContext;
}

interface Loaded {
  asrPath: string;
  vadPath: string;
  contexts: Promise<Contexts>;
}

let loaded: Loaded | null = null;
let users = 0;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let subscriptions: NativeEventSubscription[] = [];

function watchApp(): void {
  if (subscriptions.length) return;
  subscriptions = [
    AppState.addEventListener('change', (s) => {
      if (s === 'background') void releaseContexts();
    }),
    AppState.addEventListener('memoryWarning', () => {
      if (users === 0) void releaseContexts();
    }),
  ];
}

/**
 * Contexts for these model files, loading them if needed. Every `acquire`
 * must be paired with `release` (the queue does it in `finally`).
 * Throws `whisper_unavailable` without the native module, `model_load_failed`
 * when the model cannot be loaded (often memory: the caller counts it).
 */
export async function acquireContexts(asrPath: string, vadPath: string): Promise<Contexts> {
  const m = whisperModule();
  if (!m) throw new Error('whisper_unavailable');
  watchApp();
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  users += 1;
  try {
    if (loaded && (loaded.asrPath !== asrPath || loaded.vadPath !== vadPath)) await releaseNow();
    if (!loaded) {
      const contexts = (async () => {
        // VAD first: it is small and lets a silent recording finish without the big model.
        const vad = await m.initWhisperVad({ filePath: nativePath(vadPath), useGpu: false, nThreads: 2 });
        try {
          // Core ML encoder off: we do not ship one (ADR 0001); Metal GPU on.
          const asr = await m.initWhisper({ filePath: nativePath(asrPath), useGpu: true, useCoreMLIos: false, useFlashAttn: false });
          return { asr, vad };
        } catch (e) {
          await vad.release().catch(() => {});
          throw e;
        }
      })();
      loaded = { asrPath, vadPath, contexts };
      contexts.catch(() => {
        if (loaded?.contexts === contexts) loaded = null;
      });
    }
    return await loaded.contexts.catch(() => {
      throw new Error('model_load_failed');
    });
  } catch (e) {
    users -= 1;
    throw e;
  }
}

/** One use finished. The contexts are released after IDLE_RELEASE_MS with no new use. */
export function releaseContextsLater(): void {
  users = Math.max(0, users - 1);
  if (users > 0) return;
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    idleTimer = null;
    if (users === 0) void releaseContexts();
  }, IDLE_RELEASE_MS);
}

/** Frees both models now (background, memory warning, model removed in Settings). */
export async function releaseContexts(): Promise<void> {
  if (users > 0) return; // a job is running; the queue stops it first and calls this again
  await releaseNow();
}

async function releaseNow(): Promise<void> {
  const current = loaded;
  loaded = null;
  if (!current) return;
  try {
    const c = await current.contexts;
    await Promise.allSettled([c.asr.release(), c.vad.release()]);
  } catch {
    // never loaded: nothing to free
  }
}
