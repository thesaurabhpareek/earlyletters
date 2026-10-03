/**
 * Clearer listening copies (founder decision 8, ADR 0015).
 *
 * The original recording is never altered: it is only read. A listening
 * copy is a second file, Application Support/listening/<letter id>.m4a,
 * made with Apple's system voice isolation (AUSoundIsolation, iOS 16 and
 * later) through the ScribeAudio module. The person can always hear the
 * original; the copy is an extra, offered where it helps (a fan, a
 * white-noise machine).
 *
 * - Made on request (the player asks), one at a time, with progress and
 *   cancel. Never in the background, never at launch.
 * - Excluded from device backup (it can always be made again) and never
 *   uploaded or exported (the original is what export carries).
 * - Classification: L4, derived from the voice (rule 2, DATA_CLASSIFICATION);
 *   deleted with its letter. Requests to the store and export owners are in
 *   the speech engineer's report.
 * - `mix` below 100 keeps a little of the room, so a baby's laugh in the
 *   background is softened, not erased (E: tuned by ear on the corpus).
 */
import { File } from 'expo-file-system';
import { ScribeAudio, scribeAudioErrorCode } from '../../../modules/scribe-audio';

export const DEFAULT_MIX = 80;

export function listeningCopiesSupported(): boolean {
  try {
    return !!ScribeAudio && ScribeAudio.isIsolationAvailable();
  } catch {
    return false;
  }
}

/** Safe file name for a letter id (ids are UUIDv7; anything else is reduced to word characters). */
export function listeningFileName(id: string): string {
  return `${id.replace(/[^A-Za-z0-9_-]/g, '_')}.m4a`;
}

function listeningFile(id: string): File | null {
  if (!ScribeAudio) return null;
  try {
    const dir = ScribeAudio.listeningDirectory();
    return dir ? new File(dir, listeningFileName(id)) : null;
  } catch {
    return null;
  }
}

/** URI of a finished listening copy, or null. */
export function listeningCopyUri(id: string): string | null {
  const f = listeningFile(id);
  return f?.exists ? f.uri : null;
}

export type ListeningCopyResult = { ok: true; uri: string } | { ok: false; reason: 'unavailable' | 'cancelled' | 'failed' };

let chain: Promise<unknown> = Promise.resolve();
const inFlight = new Map<string, Promise<ListeningCopyResult>>();

/**
 * Makes (or returns) the listening copy for one letter. Joins a run already
 * in progress for the same letter. `onProgress` receives 0 to 1.
 */
export function makeListeningCopy(
  id: string,
  sourceUri: string,
  opts: { mix?: number; onProgress?: (p: number) => void; signal?: AbortSignal } = {},
): Promise<ListeningCopyResult> {
  const existing = listeningCopyUri(id);
  if (existing) return Promise.resolve({ ok: true, uri: existing });
  const running = inFlight.get(id);
  if (running) return running;
  const native = ScribeAudio;
  const file = listeningFile(id);
  if (!native || !file || !listeningCopiesSupported()) return Promise.resolve({ ok: false, reason: 'unavailable' });

  const jobId = `${id}:${Date.now()}`;
  const run = async (): Promise<ListeningCopyResult> => {
    if (opts.signal?.aborted) return { ok: false, reason: 'cancelled' };
    const sub = native.addListener('onEnhanceProgress', (e) => {
      if (e.jobId === jobId) opts.onProgress?.(e.progress);
    });
    const onAbort = () => native.cancelEnhance(jobId);
    opts.signal?.addEventListener('abort', onAbort);
    try {
      await native.enhance(jobId, sourceUri, file.uri, { mix: opts.mix ?? DEFAULT_MIX });
      return { ok: true, uri: file.uri };
    } catch (e) {
      const code = scribeAudioErrorCode(e);
      if (code === 'ERR_SCRIBE_AUDIO_CANCELLED') return { ok: false, reason: 'cancelled' };
      if (code === 'ERR_SCRIBE_AUDIO_ISOLATION_UNAVAILABLE' || code === 'ERR_SCRIBE_AUDIO_UNSUPPORTED') return { ok: false, reason: 'unavailable' };
      return { ok: false, reason: 'failed' };
    } finally {
      opts.signal?.removeEventListener('abort', onAbort);
      sub.remove();
    }
  };
  const p = chain.then(run, run).finally(() => inFlight.delete(id));
  chain = p.catch(() => {});
  inFlight.set(id, p);
  return p;
}

/** Deletes a letter's listening copy (letter deleted, or the parent prefers the original only). */
export function removeListeningCopy(id: string): void {
  try {
    const f = listeningFile(id);
    if (f?.exists) f.delete();
  } catch {
    // nothing to remove
  }
}
